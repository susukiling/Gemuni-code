import { APP_NAME } from "../config";

export interface IconSpec {
  size: number;
  image: HTMLImageElement | null;
  zoom: number; // 1〜3
  offsetX: number; // -1〜1
  offsetY: number; // -1〜1
  bg1: string;
  bg2: string;
  glyph: string; // 画像なしのとき中央に描く文字・絵文字
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像を読み込めませんでした"));
    img.src = src;
  });
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ファイルを読み込めませんでした"));
    reader.onload = () => loadImage(String(reader.result)).then(resolve, reject);
    reader.readAsDataURL(file);
  });
}

/** 正方形のアイコン(PNG dataURL)を描画する。OS側で角丸になるので四隅は塗りつぶす */
export function renderIcon(spec: IconSpec): string {
  const { size, image, zoom, offsetX, offsetY, bg1, bg2, glyph } = spec;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvasを利用できません");

  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, bg1);
  g.addColorStop(1, bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  if (image) {
    // 正方形に中央クロップ → ズーム → ずらし
    const side = Math.min(image.width, image.height) / zoom;
    const maxX = (image.width - side) / 2;
    const maxY = (image.height - side) / 2;
    const sx = image.width / 2 - side / 2 + offsetX * maxX;
    const sy = image.height / 2 - side / 2 + offsetY * maxY;
    ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
  } else if (glyph) {
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const len = Array.from(glyph).length;
    const fs = size * (len <= 1 ? 0.55 : len === 2 ? 0.42 : 0.3);
    ctx.font = `700 ${fs}px system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Color Emoji", sans-serif`;
    ctx.fillText(glyph, size / 2, size / 2 + fs * 0.04);
  }
  return canvas.toDataURL("image/png");
}

/** dataURLを別サイズに縮小 */
export async function resizeDataUrl(dataUrl: string, size: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);
  return c.toDataURL("image/png");
}

function setLink(rel: string, href: string, sizes?: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  if (sizes) el.setAttribute("sizes", sizes);
  el.type = "image/png";
  el.href = href;
}

let manifestUrl: string | null = null;

/**
 * アプリアイコンを反映する。
 * - タブのファビコン / iOSの apple-touch-icon / PWAマニフェストを動的に差し替える
 * - dataUrl が null なら同梱のデフォルトアイコンに戻す
 * 注意: すでにホーム画面に追加済みのアイコンは変わらないため、変更後は追加し直す。
 */
export async function applyAppIcon(dataUrl: string | null): Promise<void> {
  const origin = location.origin;
  let icon192 = `${origin}/icons/icon-192.png`;
  let icon512 = `${origin}/icons/icon-512.png`;
  let touch = `${origin}/icons/apple-touch-icon.png`;
  let maskable = `${origin}/icons/icon-maskable-512.png`;

  if (dataUrl) {
    try {
      [icon192, icon512, touch] = await Promise.all([
        resizeDataUrl(dataUrl, 192),
        resizeDataUrl(dataUrl, 512),
        resizeDataUrl(dataUrl, 180),
      ]);
      maskable = icon512;
    } catch {
      return;
    }
  }

  setLink("icon", icon192);
  setLink("apple-touch-icon", touch, "180x180");

  const manifest = {
    name: APP_NAME,
    short_name: APP_NAME,
    start_url: `${origin}/`,
    scope: `${origin}/`,
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const next = URL.createObjectURL(blob);
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.href = next;
  if (manifestUrl) URL.revokeObjectURL(manifestUrl);
  manifestUrl = next;
}
