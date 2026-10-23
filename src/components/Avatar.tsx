interface Props {
  src: string | null;
  name: string;
  size?: number;
  onClick?: () => void;
}

/** プロフィールアイコン。画像が無ければ頭文字を表示 */
export default function Avatar({ src, name, size = 40, onClick }: Props) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  const style = { width: size, height: size, fontSize: size * 0.45 };
  const inner = src ? <img src={src} alt="" /> : <span>{initial}</span>;
  return onClick ? (
    <button className="avatar" style={style} onClick={onClick} aria-label="アカウントと設定">
      {inner}
    </button>
  ) : (
    <div className="avatar" style={style}>
      {inner}
    </div>
  );
}
