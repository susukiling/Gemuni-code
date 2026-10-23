export interface Settings {
  displayName: string;
  avatarIcon: string | null; // dataURL (プロフィールアイコン)
  appIcon: string | null; // dataURL (ホーム画面・タブのアイコン)
  theme: "dark" | "light" | "system";
  accent: string;
  fontSize: number;
  customInstructions: string;
  temperature: number;
  contextLimit: number;
  language: string;
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: "",
  avatarIcon: null,
  appIcon: null,
  theme: "dark",
  accent: "#3b5bdb",
  fontSize: 16,
  customInstructions: "",
  temperature: 0.3,
  contextLimit: 20,
  language: "自動",
};

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: number;
}
