import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import type { Chat, Settings } from "../types";
import { APP_NAME } from "../config";
import Avatar from "./Avatar";
import { IconClose, IconNewChat, IconSearch, IconSettings, IconTrash } from "./Icons";

interface Props {
  uid: string;
  userLabel: string;
  settings: Settings;
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string | null) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ uid, userLabel, settings, activeId, open, onClose, onSelect, onOpenSettings }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users", uid, "chats"), orderBy("updatedAt", "desc"), limit(200));
    return onSnapshot(q, (snap) =>
      setChats(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Chat, "id">) })))
    );
  }, [uid]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? chats.filter((c) => c.title.toLowerCase().includes(s)) : chats;
  }, [chats, search]);

  async function remove(id: string) {
    if (!confirm("このチャットを削除しますか?")) return;
    // サブコレクション(messages)も削除
    const { getDocs } = await import("firebase/firestore");
    const msgs = await getDocs(collection(db, "users", uid, "chats", id, "messages"));
    await Promise.all(msgs.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "users", uid, "chats", id));
    if (id === activeId) onSelect(null);
  }

  const pick = (id: string | null) => {
    onSelect(id);
    if (window.innerWidth < 900) onClose();
  };

  return (
    <>
      <div className={open ? "scrim show" : "scrim"} onClick={onClose} />
      <aside className={open ? "sidebar open" : "sidebar"} aria-label="サイドバー">
        <div className="side-head">
          <span className="side-title">{APP_NAME}</span>
          <button className="round-btn" onClick={onClose} aria-label="閉じる">
            <IconClose />
          </button>
        </div>

        <nav className="side-nav">
          <button className="side-item primary" onClick={() => pick(null)}>
            <IconNewChat /> チャットを新規作成
          </button>
          {searching ? (
            <div className="side-search">
              <IconSearch />
              <input
                autoFocus
                value={search}
                placeholder="チャットを検索"
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => !search && setSearching(false)}
              />
            </div>
          ) : (
            <button className="side-item" onClick={() => setSearching(true)}>
              <IconSearch /> チャットを検索
            </button>
          )}
        </nav>

        <div className="side-label">最近</div>
        <div className="side-list">
          {shown.length === 0 && <p className="muted small pad">{search ? "見つかりません" : "まだチャットがありません"}</p>}
          {shown.map((c) => (
            <div key={c.id} className={c.id === activeId ? "chat-row active" : "chat-row"}>
              <button className="chat-title" onClick={() => pick(c.id)} title={c.title}>
                {c.title || "無題"}
              </button>
              <button className="del" onClick={() => void remove(c.id)} aria-label="削除">
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        <div className="side-foot">
          <Avatar src={settings.avatarIcon} name={settings.displayName || userLabel} size={36} />
          <span className="who">{settings.displayName || userLabel}</span>
          <button className="round-btn" onClick={onOpenSettings} aria-label="設定">
            <IconSettings />
          </button>
        </div>
      </aside>
    </>
  );
}
