import { useCallback, useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { streamChat, type ChatTurn } from "../lib/api";
import { APP_NAME, SUGGESTIONS } from "../config";
import type { Message, Settings } from "../types";
import MessageView from "./MessageView";
import Composer from "./Composer";
import { Logo } from "./Icons";

interface Props {
  uid: string;
  chatId: string | null;
  settings: Settings;
  onChatCreated: (id: string) => void;
}

export default function ChatView({ uid, chatId, settings, onChatCreated }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState<{ chatId: string; text: string } | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const msgsRef = useRef<Message[]>([]);
  msgsRef.current = messages;
  const bottom = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  // メッセージ購読
  useEffect(() => {
    setError("");
    if (!chatId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "users", uid, "chats", chatId, "messages"), orderBy("createdAt"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) })));
    });
  }, [uid, chatId]);

  // 自動スクロール(ユーザーが上へ戻したら追従しない)
  useEffect(() => {
    if (stick.current) bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const run = useCallback(
    async (id: string, history: ChatTurn[]) => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      stick.current = true;
      setError("");
      setStreaming({ chatId: id, text: "" });
      let finalText = "";
      try {
        finalText = await streamChat({
          messages: history.slice(-settings.contextLimit),
          customInstructions: settings.customInstructions,
          temperature: settings.temperature,
          language: settings.language,
          signal: ctrl.signal,
          onToken: (t) => {
            finalText = t;
            setStreaming({ chatId: id, text: t });
          },
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message || "エラーが発生しました");
      } finally {
        // 途中で止めた場合も、そこまでの内容を保存する
        if (finalText.trim()) {
          const now = Date.now();
          await addDoc(collection(db, "users", uid, "chats", id, "messages"), {
            role: "model",
            content: finalText,
            createdAt: now,
          }).catch(() => {});
          await updateDoc(doc(db, "users", uid, "chats", id), { updatedAt: now }).catch(() => {});
        }
        setStreaming(null);
        abortRef.current = null;
      }
    },
    [uid, settings]
  );

  const send = useCallback(
    async (text: string) => {
      const now = Date.now();
      let id: string;
      if (chatId) {
        id = chatId;
      } else {
        const title = text.replace(/\s+/g, " ").slice(0, 40);
        const ref = await addDoc(collection(db, "users", uid, "chats"), {
          title,
          createdAt: now,
          updatedAt: now,
        });
        id = ref.id;
        onChatCreated(id);
      }
      const history: ChatTurn[] = [
        ...msgsRef.current.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];
      await addDoc(collection(db, "users", uid, "chats", id, "messages"), {
        role: "user",
        content: text,
        createdAt: now,
      });
      await run(id, history);
    },
    [chatId, uid, onChatCreated, run]
  );

  const regenerate = useCallback(async () => {
    if (!chatId || abortRef.current) return;
    const list = msgsRef.current;
    const last = list[list.length - 1];
    let base = list;
    if (last?.role === "model") {
      await deleteDoc(doc(db, "users", uid, "chats", chatId, "messages", last.id)).catch(() => {});
      base = list.slice(0, -1);
    }
    if (!base.length || base[base.length - 1].role !== "user") return;
    await run(
      chatId,
      base.map((m) => ({ role: m.role, content: m.content }))
    );
  }, [chatId, uid, run]);

  const busy = streaming !== null;
  const showStreaming = streaming && streaming.chatId === chatId;
  const empty = messages.length === 0 && !showStreaming;
  const name = settings.displayName.trim();
  const lastModelId = [...messages].reverse().find((m) => m.role === "model")?.id;
  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div className={empty ? "chat empty" : "chat"}>
      <div className="scroller" ref={scroller} onScroll={onScroll}>
        {empty ? (
          <div className="landing">
            <Logo size={56} />
            <h1>{name ? `${name}さん、` : ""}今日は何を作りますか?</h1>
            <p className="muted">{APP_NAME} はコード生成に特化したアシスタントです</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => void send(s)} disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="thread">
            {messages.map((m) => (
              <MessageView
                key={m.id}
                role={m.role}
                content={m.content}
                onRegenerate={m.id === lastModelId && !busy ? () => void regenerate() : undefined}
              />
            ))}
            {showStreaming && <MessageView role="model" content={streaming.text} streaming />}
            {error && (
              <div className="error-box" role="alert">
                <p>{error}</p>
                {lastIsUser && !busy && (
                  <button className="btn-secondary" onClick={() => void regenerate()}>
                    もう一度試す
                  </button>
                )}
              </div>
            )}
            <div ref={bottom} />
          </div>
        )}
      </div>
      <Composer busy={busy} onSend={(t) => void send(t)} onStop={() => abortRef.current?.abort()} />
    </div>
  );
}
