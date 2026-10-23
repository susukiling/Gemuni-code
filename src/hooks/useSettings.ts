import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_SETTINGS, type Settings } from "../types";
import { applyAppIcon } from "../lib/iconTools";

const LS_KEY = "settings-v1";

function readLocal(): Settings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

function applyLook(s: Settings) {
  const root = document.documentElement;
  const dark =
    s.theme === "dark" || (s.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.style.setProperty("--accent", s.accent);
  root.style.setProperty("--font-size", `${s.fontSize}px`);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#000000" : "#ffffff");
}

/** 設定をローカルに即時保存し、ログイン中はFirestoreとも同期する */
export function useSettings(uid: string | undefined) {
  const [settings, setSettings] = useState<Settings>(readLocal);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(settings);
  latest.current = settings;

  // Firestore → ローカル
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid, "meta", "settings"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<Settings>) });
    });
  }, [uid]);

  // 見た目の反映
  useEffect(() => {
    applyLook(settings);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch {
      /* 容量超過などは無視 */
    }
  }, [settings]);

  useEffect(() => {
    void applyAppIcon(settings.appIcon);
  }, [settings.appIcon]);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const fn = () => applyLook(latest.current);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [settings.theme]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      if (!uid) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void setDoc(doc(db, "users", uid, "meta", "settings"), latest.current).catch(() => {});
      }, 500);
    },
    [uid]
  );

  return { settings, update };
}
