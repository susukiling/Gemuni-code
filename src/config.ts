// アプリ名はここだけ変えれば全画面に反映されます。
// ※「Gemini Code」はGoogle製品名と紛らわしいため、公開前に独自名への変更を推奨します。
export const APP_NAME = "Gemini Code";

export const SUGGESTIONS = [
  "Reactでログインフォームを作って",
  "Pythonで CSV を集計するスクリプトを書いて",
  "TypeScriptで debounce 関数を実装して",
  "SQLで売上の月次ランキングを出すクエリを書いて",
];

export const LANGUAGES = [
  "自動",
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Kotlin",
  "Swift",
  "Go",
  "Rust",
  "C#",
  "C++",
  "PHP",
  "Ruby",
  "SQL",
  "Bash",
];

export const ACCENTS = ["#3b5bdb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777"];

// 使うGeminiモデル。名前は変わりやすいので、Firebaseコンソール(AI Logic)や
// https://firebase.google.com/docs/ai-logic/models で最新のFlash系の名前を確認してください。
export const MODEL_NAME: string = import.meta.env.VITE_GEMINI_MODEL ?? "gemini-3.5-flash-lite";
