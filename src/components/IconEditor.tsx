import { useEffect, useMemo, useRef, useState } from "react";
import { fileToImage, renderIcon, resizeDataUrl } from "../lib/iconTools";
import { IconUpload } from "./Icons";

const GRADIENTS: [string, string][] = [
  ["#2646dc", "#783cdc"],
  ["#0ea5e9", "#2563eb"],
  ["#10b981", "#047857"],
  ["#f59e0b", "#dc2626"],
  ["#ec4899", "#8b5cf6"],
  ["#111827", "#374151"],
  ["#f8fafc", "#cbd5e1"],
];

const GLYPHS = ["</>", "{ }", "💻", "🚀", "⚡", "🐍", "🤖", "✨"];

interface Props {
  title: string;
  hint?: string;
  round?: boolean; // プレビューを円形にする(プロフィール用)
  current: string | null;
  onSave: (dataUrl: string) => void;
  onReset: () => void;
  onClose: () => void;
}

/** 画像のアップロード(ズーム・位置調整)または色+文字でアイコンを作るエディタ */
export default function IconEditor({ title, hint, round, current, onSave, onReset, onClose }: Props) {
  const [tab, setTab] = useState<"image" | "design">(current ? "image" : "design");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [grad, setGrad] = useState(0);
  const [glyph, setGlyph] = useState("</>");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const useImage = tab === "image" && image;

  const preview = useMemo(() => {
    try {
      return renderIcon({
        size: 256,
        image: useImage ? image : null,
        zoom,
        offsetX,
        offsetY,
        bg1: GRADIENTS[grad][0],
        bg2: GRADIENTS[grad][1],
        glyph,
      });
    } catch {
      return "";
    }
  }, [useImage, image, zoom, offsetX, offsetY, grad, glyph]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("画像ファイルを選んでください");
    if (file.size > 15 * 1024 * 1024) return setError("画像が大きすぎます(15MBまで)");
    try {
      setImage(await fileToImage(file));
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setTab("image");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function save() {
    try {
      let out = renderIcon({
        size: 512,
        image: useImage ? image : null,
        zoom,
        offsetX,
        offsetY,
        bg1: GRADIENTS[grad][0],
        bg2: GRADIENTS[grad][1],
        glyph,
      });
      // Firestoreの1ドキュメント上限(1MB)に収める
      if (out.length > 700_000) out = await resizeDataUrl(out, 320);
      onSave(out);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal icon-editor" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {hint && <p className="muted small">{hint}</p>}

        <div className="icon-preview-wrap">
          <img className={round ? "icon-preview round" : "icon-preview"} src={preview} alt="プレビュー" />
        </div>

        <div className="seg">
          <button className={tab === "image" ? "on" : ""} onClick={() => setTab("image")}>
            画像
          </button>
          <button className={tab === "design" ? "on" : ""} onClick={() => setTab("design")}>
            デザイン
          </button>
        </div>

        {tab === "image" ? (
          <div className="editor-pane">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <IconUpload /> {image ? "別の画像を選ぶ" : "画像をアップロード"}
            </button>
            {image && (
              <>
                <label className="slider">
                  <span>ズーム</span>
                  <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} />
                </label>
                <label className="slider">
                  <span>左右</span>
                  <input type="range" min={-1} max={1} step={0.01} value={offsetX} onChange={(e) => setOffsetX(+e.target.value)} />
                </label>
                <label className="slider">
                  <span>上下</span>
                  <input type="range" min={-1} max={1} step={0.01} value={offsetY} onChange={(e) => setOffsetY(+e.target.value)} />
                </label>
              </>
            )}
          </div>
        ) : (
          <div className="editor-pane">
            <div className="swatches">
              {GRADIENTS.map(([a, b], i) => (
                <button
                  key={i}
                  className={i === grad ? "swatch on" : "swatch"}
                  style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                  onClick={() => setGrad(i)}
                  aria-label={`背景 ${i + 1}`}
                />
              ))}
            </div>
            <div className="glyphs">
              {GLYPHS.map((g) => (
                <button key={g} className={g === glyph ? "chip on" : "chip"} onClick={() => setGlyph(g)}>
                  {g}
                </button>
              ))}
            </div>
            <input
              className="text-input"
              value={glyph}
              maxLength={4}
              onChange={(e) => setGlyph(e.target.value)}
              placeholder="好きな文字・絵文字(最大4文字)"
            />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-text danger" onClick={onReset}>
            初期アイコンに戻す
          </button>
          <span className="spacer" />
          <button className="btn-text" onClick={onClose}>
            キャンセル
          </button>
          <button className="btn-primary" onClick={() => void save()}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
