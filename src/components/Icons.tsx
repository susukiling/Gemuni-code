import type { ReactNode } from "react";

interface P {
  size?: number;
}

const base = (size: number, children: ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const IconMenu = ({ size = 22 }: P) =>
  base(size, <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></>);
export const IconClose = ({ size = 22 }: P) => base(size, <path d="M6 6l12 12M18 6L6 18" />);
export const IconNewChat = ({ size = 22 }: P) =>
  base(size, <><path d="M12 20h8" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>);
export const IconSearch = ({ size = 22 }: P) => base(size, <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const IconPlus = ({ size = 22 }: P) => base(size, <path d="M12 5v14M5 12h14" />);
export const IconMic = ({ size = 22 }: P) =>
  base(size, <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>);
export const IconSend = ({ size = 22 }: P) => base(size, <path d="M12 19V5M5 12l7-7 7 7" />);
export const IconStop = ({ size = 22 }: P) =>
  base(size, <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />);
export const IconCopy = ({ size = 20 }: P) =>
  base(size, <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>);
export const IconCheck = ({ size = 20 }: P) => base(size, <path d="M5 12l5 5 9-10" />);
export const IconRefresh = ({ size = 20 }: P) =>
  base(size, <><path d="M20 11a8 8 0 10-2.3 5.7" /><path d="M20 4v7h-7" /></>);
export const IconSettings = ({ size = 22 }: P) =>
  base(
    size,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </>
  );
export const IconChevron = ({ size = 16 }: P) => base(size, <path d="M6 9l6 6 6-6" />);
export const IconTrash = ({ size = 18 }: P) =>
  base(size, <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>);
export const IconPaperclip = ({ size = 20 }: P) =>
  base(size, <path d="M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8" />);
export const IconUpload = ({ size = 20 }: P) =>
  base(size, <><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 20h16" /></>);

/** アプリのロゴ(Geminiのロゴとは別の独自デザイン) */
export function Logo({ size = 40 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2646dc" />
          <stop offset="1" stopColor="#783cdc" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg)" />
      <g stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M24 22L14 32l10 10" />
        <path d="M40 22l10 10-10 10" />
        <path d="M35 19l-6 26" />
      </g>
    </svg>
  );
}
