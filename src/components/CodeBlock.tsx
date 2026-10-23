import { useState, type ReactNode } from "react";
import { IconCheck, IconCopy } from "./Icons";

/** ReactNodeからプレーンテキストを取り出す(rehype-highlightのspan対応) */
export function nodeText(n: ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(nodeText).join("");
  if (typeof n === "object" && "props" in n) return nodeText((n as { props: { children?: ReactNode } }).props.children);
  return "";
}

export default function CodeBlock({ lang, children }: { lang: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(nodeText(children).replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard不可の環境は無視 */
    }
  }

  return (
    <div className="codeblock">
      <div className="codeblock-head">
        <span>{lang || "code"}</span>
        <button onClick={() => void copy()} aria-label="コードをコピー">
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
