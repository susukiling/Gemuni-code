import { useState, type FormEvent } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import { APP_NAME } from "../config";
import { Logo } from "./Icons";

function errorText(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません";
    case "auth/missing-password":
    case "auth/weak-password":
      return "パスワードは6文字以上にしてください";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "メールアドレスまたはパスワードが違います";
    case "auth/email-already-in-use":
      return "このメールアドレスは既に登録されています";
    case "auth/too-many-requests":
      return "試行回数が多すぎます。しばらくしてからお試しください";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/network-request-failed":
      return "ネットワークに接続できません";
    default:
      return `ログインに失敗しました (${code})`;
  }
}

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "unknown";
      const text = errorText(code);
      if (text) setMsg({ kind: "error", text });
    } finally {
      setBusy(false);
    }
  }

  const google = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() =>
      mode === "signin"
        ? signInWithEmailAndPassword(auth, email.trim(), password)
        : createUserWithEmailAndPassword(auth, email.trim(), password)
    );
  };

  const reset = () => {
    if (!email.trim()) return setMsg({ kind: "error", text: "先にメールアドレスを入力してください" });
    void run(async () => {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg({ kind: "info", text: "パスワード再設定メールを送信しました" });
    });
  };

  return (
    <div className="login">
      <div className="login-card">
        <Logo size={56} />
        <h1>{APP_NAME}</h1>
        <p className="muted">コード生成に特化したAIチャット</p>

        <button className="btn-google" onClick={google} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.3-4 6.8-9.9 6.8-17.1z" />
            <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.3-8.7 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          Googleでログイン
        </button>

        <div className="divider">
          <span>または</span>
        </div>

        <form onSubmit={submit} className="login-form">
          <input
            type="email"
            placeholder="メールアドレス"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="パスワード(6文字以上)"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {msg && <p className={msg.kind === "error" ? "form-error" : "form-info"}>{msg.text}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>
            {mode === "signin" ? "ログイン" : "アカウントを作成"}
          </button>
        </form>

        <div className="login-links">
          <button className="link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "新規登録はこちら" : "ログインに戻る"}
          </button>
          {mode === "signin" && (
            <button className="link" onClick={reset}>
              パスワードを忘れた
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
