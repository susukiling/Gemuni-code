import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { firebaseConfigured } from "./firebase";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import SettingsModal from "./components/SettingsModal";
import Avatar from "./components/Avatar";
import { IconMenu, IconNewChat, Logo } from "./components/Icons";
import { APP_NAME } from "./config";

function SetupNotice() {
  return (
    <div className="login">
      <div className="login-card">
        <Logo size={48} />
        <h1>{APP_NAME}</h1>
        <p className="muted">
          Firebaseの設定が見つかりません。<code>.env.example</code> を <code>.env.local</code> にコピーして、
          Firebaseコンソールの値を入力してから開発サーバーを再起動してください。
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { settings, update } = useSettings(user?.uid);
  const [chatId, setChatId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 900);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!firebaseConfigured) return <SetupNotice />;
  if (loading) return <div className="boot"><Logo size={48} /></div>;
  if (!user) return <Login />;

  const userLabel = user.displayName || user.email || "ユーザー";

  return (
    <div className={sidebar ? "app with-sidebar" : "app"}>
      <Sidebar
        uid={user.uid}
        userLabel={userLabel}
        settings={settings}
        activeId={chatId}
        open={sidebar}
        onClose={() => setSidebar(false)}
        onSelect={setChatId}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main">
        <header className="topbar">
          <button className="round-btn" onClick={() => setSidebar((s) => !s)} aria-label="サイドバー">
            <IconMenu />
          </button>
          <span className="app-title">{APP_NAME}</span>
          <span className="spacer" />
          <div className="pill">
            <button onClick={() => setChatId(null)} aria-label="新しいチャット">
              <IconNewChat />
            </button>
          </div>
          <Avatar src={settings.avatarIcon} name={settings.displayName || userLabel} size={40} onClick={() => setSettingsOpen(true)} />
        </header>

        <ChatView uid={user.uid} chatId={chatId} settings={settings} onChatCreated={setChatId} />
      </main>

      {settingsOpen && (
        <SettingsModal
          user={user}
          settings={settings}
          update={update}
          onClose={() => setSettingsOpen(false)}
          onAllDeleted={() => setChatId(null)}
        />
      )}
    </div>
  );
}
