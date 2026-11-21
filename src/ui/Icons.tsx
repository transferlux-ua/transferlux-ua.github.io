import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const Mark = (p: P) => (
  <svg viewBox="0 0 64 64" width={28} height={28} aria-hidden="true" {...p}>
    <g fill="currentColor"><rect x="8" y="13" width="28" height="5" /><rect x="19.5" y="18" width="5" height="33" /><rect x="31" y="13" width="5" height="38" /><rect x="31" y="46" width="25" height="5" /></g>
  </svg>
);
export const Swap = (p: P) => (<svg {...base} {...p}><path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" /></svg>);
export const Close = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Plus = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const Minus = (p: P) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>);
export const Chevron = (p: P) => (<svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>);
export const Menu = (p: P) => (<svg {...base} {...p}><path d="M4 8h16M4 16h16" /></svg>);
export const Pin = (p: P) => (<svg {...base} {...p}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.4" /></svg>);
export const Phone = (p: P) => (<svg {...base} {...p}><path d="M5 4h3.5l1.6 4.2-2.2 1.4a11 11 0 0 0 6.5 6.5l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" /></svg>);
export const Telegram = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" {...p}><path fill="currentColor" d="M21.4 4.3 2.9 11.4c-1 .4-1 1.6.1 1.9l4.6 1.4 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.4 4.6 3.4c.6.4 1.4.1 1.6-.6l3-14.2c.2-1-.7-1.8-1.4-1.5Zm-11.7 10 7.9-6.4-9.2 5.8z" /></svg>
);
export const WhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" {...p}><path fill="currentColor" d="M12 2.3a9.6 9.6 0 0 0-8.3 14.5L2.4 21.6l4.9-1.3A9.6 9.6 0 1 0 12 2.3Zm0 17.5c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.9 7.9 0 1 1 12 19.8Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2.1.7 2.8.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3Z" /></svg>
);
export const Arrows = (p: P) => (
  <svg viewBox="0 0 56 24" width={56} height={24} fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true" {...p}>
    <path d="M6 9h44M44 4l6 5M12 15h44M12 20l-6-5" strokeLinecap="round" />
  </svg>
);
