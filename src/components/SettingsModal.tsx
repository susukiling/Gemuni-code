import { useEffect, useState } from "react";
import { signOut, type User } from "firebase/auth";
import { collection, deleteDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ACCENTS, APP_NAME, LANGUAGES } from "../config";
import type { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import Avatar from "./Avatar";
import IconEditor from "./IconEditor";
import { IconClose } from "./Icons";

interface Props {
  user: User;
  settings: Settings;
  update: (p: Partial<Settings>) => void;
  onClose: () => void;
  onAllDeleted: () => void;
}

type Editing = null | "app" | "avatar";

export default function SettingsModal({ user, settings, update, onClose, onAllDeleted }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !editing && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

  const label = settings.displayName || user.displayName || user.email || "";

  async function exportAll() {
    setBusy(true);
    try {
      const chats = await getDocs(collection(db, "users", user.uid, "chats"));
      const out = [];
      for (const c of chats.docs) {
        const msgs = await getDocs(collection(db, "users", user.uid, "chats", c.id, "messages"));
        out.push({
          id: c.id,
          ...c.data(),
          messages: msgs.docs.map((m) => m.data()).sort((a, b) => a.createdAt - b.createdAt),
        });
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `chats-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    if (!confirm("すべてのチャット履歴を削除します。元に戻せません。よろしいですか?")) return;
    setBusy(true);
    try {
      const chats = await getDocs(collection(db, "users", user.uid, "chats"));
      for (const c of chats.docs) {
        const msgs = await getDocs(collection(db, "users", user.uid, "chats", c.id, "messages"));
        await Promise.all(msgs.docs.map((m) => deleteDoc(m.ref)));
        await deleteDoc(c.ref);
      }
      onAllDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal settings" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="設定">
        <div className="modal-head">
          <h2>設定</h2>
          <button className="round-btn" onClick={onClose} aria-label="閉じる">
            <IconClose />
          </button>
        </div>

        <div className="settings-body">
          <section>
            <h3>アイコン</h3>
            <div className="icon-row">
              <div className="icon-item">
                <img className="app-icon-thumb" src={settings.appIcon ?? "/icons/icon-192.png"} alt="アプリアイコン" />
                <div>
                  <b>アプリアイコン</b>
                  <small>ホーム画面・ブラウザのタブに表示</small>
                  <button className="btn-secondary" onClick={() => setEditing("app")}>
                    編集
                  </button>
                </div>
              </div>
              <div className="icon-item">
                <Avatar src={settings.avatarIcon} name={label} size={56} />
                <div>
                  <b>プロフィールアイコン</b>
                  <small>サイドバーなどに表示</small>
                  <button className="btn-secondary" onClick={() => setEditing("avatar")}>
                    編集
                  </button>
                </div>
              </div>
            </div>
            <p className="muted small">
              ※ すでにホーム画面に追加済みの場合、アプリアイコンの変更を反映するには一度削除して追加し直してください。
            </p>
          </section>

          <section>
            <h3>プロフィール</h3>
            <label className="field">
              <span>表示名</span>
              <input
                className="text-input"
                value={settings.displayName}
                maxLength={30}
                placeholder={user.displayName ?? "あなたの名前"}
                onChange={(e) => update({ displayName: e.target.value })}
              />
            </label>
            <p className="muted small">ログイン中: {user.email}</p>
          </section>

          <section>
            <h3>AI設定</h3>
            <label className="field">
              <span>
                創造性(temperature): <b>{settings.temperature.toFixed(1)}</b>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => update({ temperature: +e.target.value })}
              />
              <small className="muted">低いほど安定した出力。コード生成は0.2〜0.4がおすすめ</small>
            </label>
            <label className="field">
              <span>
                文脈として送る直近メッセージ数: <b>{settings.contextLimit}</b>
              </span>
              <input
                type="range"
                min={2}
                max={40}
                step={2}
                value={settings.contextLimit}
                onChange={(e) => update({ contextLimit: +e.target.value })}
              />
              <small className="muted">多いほど文脈を保てますが、利用量が増えます</small>
            </label>
          </section>

          <section>
            <h3>コード生成</h3>
            <label className="field">
              <span>優先するプログラミング言語</span>
              <select className="text-input" value={settings.language} onChange={(e) => update({ language: e.target.value })}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>カスタム指示</span>
              <textarea
                className="text-input"
                rows={4}
                maxLength={1500}
                placeholder="例: 変数名は英語、コメントは日本語。TypeScriptはstrictで。"
                value={settings.customInstructions}
                onChange={(e) => update({ customInstructions: e.target.value })}
              />
              <small className="muted">{settings.customInstructions.length}/1500</small>
            </label>
          </section>

          <section>
            <h3>外観</h3>
            <div className="seg">
              {(["dark", "light", "system"] as const).map((t) => (
                <button key={t} className={settings.theme === t ? "on" : ""} onClick={() => update({ theme: t })}>
                  {t === "dark" ? "ダーク" : t === "light" ? "ライト" : "自動"}
                </button>
              ))}
            </div>
            <div className="field">
              <span>アクセントカラー</span>
              <div className="swatches">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    className={settings.accent === c ? "swatch on" : "swatch"}
                    style={{ background: c }}
                    onClick={() => update({ accent: c })}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <label className="field">
              <span>
                文字サイズ: <b>{settings.fontSize}px</b>
              </span>
              <input
                type="range"
                min={13}
                max={20}
                step={1}
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: +e.target.value })}
              />
            </label>
          </section>

          <section>
            <h3>データ</h3>
            <div className="btn-row">
              <button className="btn-secondary" onClick={() => void exportAll()} disabled={busy}>
                チャットをJSONで書き出す
              </button>
              <button className="btn-secondary danger" onClick={() => void deleteAll()} disabled={busy}>
                すべての履歴を削除
              </button>
            </div>
            <div className="btn-row">
              <button className="btn-text" onClick={() => update({ ...DEFAULT_SETTINGS, displayName: settings.displayName })}>
                設定を初期化
              </button>
            </div>
          </section>

          <section>
            <h3>アカウント</h3>
            <button className="btn-secondary" onClick={() => void signOut(auth)}>
              ログアウト
            </button>
            <p className="muted small">{APP_NAME} v0.1.0</p>
          </section>
        </div>
      </div>

      {editing && (
        <IconEditor
          title={editing === "app" ? "アプリアイコンを編集" : "プロフィールアイコンを編集"}
          hint={editing === "app" ? "ホーム画面に追加したときのアイコンになります" : "丸く切り抜かれて表示されます"}
          round={editing === "avatar"}
          current={editing === "app" ? settings.appIcon : settings.avatarIcon}
          onClose={() => setEditing(null)}
          onSave={(url) => {
            update(editing === "app" ? { appIcon: url } : { avatarIcon: url });
            setEditing(null);
          }}
          onReset={() => {
            update(editing === "app" ? { appIcon: null } : { avatarIcon: null });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
