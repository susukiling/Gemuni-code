import { getGenerativeModel } from "firebase/ai";
import { ai, auth } from "../firebase";
import { MODEL_NAME } from "../config";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

export interface StreamOptions {
  messages: ChatTurn[];
  customInstructions: string;
  temperature: number;
  language: string;
  signal: AbortSignal;
  onToken: (text: string) => void;
}

const BASE_INSTRUCTION = `あなたはコード生成専用のアシスタントです。
- 回答はコードブロックを中心にし、説明は簡潔にする。
- 言語の指定がなければ、会話の文脈から最適な言語を選ぶ。
- 生成コードには必要最小限のコメントを付ける。動作に必要な前提(依存パッケージ、実行方法)は短く添える。
- コードと無関係な雑談や質問には、短く答えたうえでコードの話題に戻るよう促す。
- 不確かなAPIやバージョンは断定せず、その旨を明記する。
- ユーザーの言語(日本語など)で説明する。`;

function buildSystem(language: string, custom: string): string {
  return [
    BASE_INSTRUCTION,
    language && language !== "自動" ? `- 言語の指定がない限り ${language} を使う。` : "",
    custom.trim() ? `\nユーザーのカスタム指示:\n${custom.trim().slice(0, 1500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.toLowerCase();
  if (m.includes("429") || m.includes("quota") || m.includes("resource_exhausted") || m.includes("rate"))
   return `無料枠の上限、または利用制限の可能性があります。(${msg.slice(0, 200)})`;
  if (m.includes("app check") || m.includes("appcheck") || m.includes("403") || m.includes("permission"))
    return "AIを利用できません。FirebaseコンソールでFirebase AI Logicの有効化とApp Checkの設定を確認してください。";
  if (m.includes("network") || m.includes("fetch")) return "ネットワークに接続できません。";
  return `AIの応答でエラーが発生しました。(${msg.slice(0, 120)})`;
}

/** Firebase AI Logic(Gemini)を直接呼び出し、テキストをストリーミングで受け取る */
export async function streamChat(opts: StreamOptions): Promise<string> {
  if (!auth.currentUser) throw new Error("ログインが必要です");

  const model = getGenerativeModel(ai, {
    model: MODEL_NAME,
    systemInstruction: buildSystem(opts.language, opts.customInstructions),
    generationConfig: { temperature: opts.temperature, maxOutputTokens: 8192 },
  });

  // Geminiは最初も最後もuserである必要がある
  const turns = [...opts.messages];
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") throw new Error("送信できるメッセージがありません");

  let full = "";
  try {
    const result = await model.generateContentStream({
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.content.slice(0, 20000) }] })),
    });
    for await (const chunk of result.stream) {
      if (opts.signal.aborted) throw new DOMException("aborted", "AbortError");
      full += chunk.text();
      opts.onToken(full);
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      // 途中までの内容を保存できるよう、呼び出し元に中断を伝える
      throw e;
    }
    throw new Error(friendlyError(e));
  }
  return full;
}
