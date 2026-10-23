import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebaseコンソール → プロジェクトの設定 → マイアプリ の値。公開されても問題ない設定値です。
const firebaseConfig = {
  apiKey: "★ここにapiKeyを貼る★",
  authDomain: "gemini-code-b841c.firebaseapp.com",
  projectId: "gemini-code-b841c",
  storageBucket: "gemini-code-b841c.firebasestorage.app",
  messagingSenderId: "172294732698",
  appId: "1:172294732698:web:30f79e22fcc40386e75823",
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("★") && firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);

// App Check: 自分のアプリ以外からのAI呼び出しを防ぐ(公開前に設定を推奨)
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
if (siteKey) {
  if (import.meta.env.DEV) {
    // ローカル開発用。コンソールに出るデバッグトークンをFirebaseに登録する
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
// Firebase AI Logic(Gemini Developer APIバックエンド)。APIキーをアプリに埋め込まずにGeminiを呼べる
export const ai = getAI(app, { backend: new GoogleAIBackend() });
