import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconMic, IconPaperclip, IconPlus, IconSend, IconStop } from "./Icons";
import { APP_NAME } from "../config";

interface Props {
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

type SR = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

const MAX_LEN = 12000;

export default function Composer({ busy, onSend, onStop }: Props) {
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const rec = useRef<SR | null>(null);

  const SRClass = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR })
    .SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t.slice(0, MAX_LEN));
    setText("");
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 日本語入力の変換確定のEnterでは送信しない
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.innerWidth > 700) {
      e.preventDefault();
      submit();
    }
  }

  async function attach(f: File | undefined) {
    if (!f) return;
    if (f.size > 100_000) return alert("添付できるのは100KBまでのテキスト/コードファイルです");
    const body = await f.text();
    const ext = f.name.split(".").pop() ?? "";
    setText((p) => `${p}${p ? "\n\n" : ""}${f.name}:\n\`\`\`${ext}\n${body}\n\`\`\`\n`);
    ta.current?.focus();
  }

  function toggleMic() {
    if (!SRClass) return alert("このブラウザは音声入力に対応していません");
    if (listening) return rec.current?.stop();
    const r = new SRClass();
    r.lang = "ja-JP";
    r.interimResults = false;
    r.onresult = (e) => {
      const said = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join("");
      setText((p) => p + said);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  return (
    <div className="composer-wrap">
      <div className="composer">
        <div className="plus-wrap">
          <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="追加">
            <IconPlus />
          </button>
          {menu && (
            <>
              <div className="popover-backdrop" onClick={() => setMenu(false)} />
              <div className="popover up">
                <button
                  onClick={() => {
                    setMenu(false);
                    file.current?.click();
                  }}
                >
                  <IconPaperclip /> コードファイルを添付
                </button>
              </div>
            </>
          )}
          <input
            ref={file}
            type="file"
            hidden
            accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.java,.kt,.swift,.go,.rs,.c,.cpp,.h,.cs,.php,.rb,.sql,.sh,.html,.css,.yml,.yaml,.toml"
            onChange={(e) => {
              void attach(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <textarea
          ref={ta}
          rows={1}
          value={text}
          placeholder={`${APP_NAME} に相談`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          enterKeyHint="send"
        />

        {SRClass && !busy && (
          <button
            className={listening ? "icon-btn rec" : "icon-btn"}
            onClick={toggleMic}
            aria-label="音声入力"
          >
            <IconMic />
          </button>
        )}

        {busy ? (
          <button className="send stop" onClick={onStop} aria-label="停止">
            <IconStop />
          </button>
        ) : (
          <button className="send" onClick={submit} disabled={!text.trim()} aria-label="送信">
            <IconSend />
          </button>
        )}
      </div>
    </div>
  );
}
