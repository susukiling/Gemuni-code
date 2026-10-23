import { isValidElement, memo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import CodeBlock, { nodeText } from "./CodeBlock";
import { IconCheck, IconCopy, IconRefresh } from "./Icons";

function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={{
          pre({ children }) {
            const child = Array.isArray(children) ? children[0] : children;
            let lang = "";
            if (isValidElement(child)) {
              const cls = (child.props as { className?: string }).className ?? "";
              lang = /language-([\w+#-]+)/.exec(cls)?.[1] ?? "";
            }
            const inner: ReactNode = isValidElement(child) ? child : children;
            return <CodeBlock lang={lang}>{inner}</CodeBlock>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

interface Props {
  role: "user" | "model";
  content: string;
  streaming?: boolean;
  onRegenerate?: () => void;
}

function MessageView({ role, content, streaming, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);

  if (role === "user") {
    return (
      <div className="msg user">
        <div className="bubble">{content}</div>
      </div>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="msg model">
      {content ? <Markdown text={content} /> : <div className="typing" aria-label="生成中"><i /><i /><i /></div>}
      {!streaming && content && (
        <div className="msg-actions">
          <button onClick={() => void copy()} aria-label="全文をコピー" title="全文をコピー">
            {copied ? <IconCheck /> : <IconCopy />}
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} aria-label="再生成" title="再生成">
              <IconRefresh />
            </button>
          )}
        </div>
      )}
      {!streaming && content && (
        <p className="disclaimer">AIは不正確な情報を提示することがあります。生成されたコードは必ず動作確認してください。</p>
      )}
    </div>
  );
}

export default memo(MessageView);
export { nodeText };
