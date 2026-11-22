import { useEffect, useRef } from "react";
import { Chevron, Close } from "./Icons";

/** Full screen photo viewer: Esc, arrows, swipe, click on the backdrop closes. */
export function Lightbox({ srcs, index, onIndex, onClose, title, closeLabel, prevLabel, nextLabel }: {
  srcs: string[]; index: number; onIndex: (i: number) => void; onClose: () => void;
  title: string; closeLabel: string; prevLabel: string; nextLabel: string;
}) {
  const touch = useRef<number | null>(null);
  const n = srcs.length;
  const go = (d: number) => onIndex((index + d + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("no-scroll"); };
  }, [index, n, onIndex, onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={title}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <img key={srcs[index]} src={srcs[index]} alt="" />
      <button type="button" className="icon-btn icon-btn--glass lightbox__close" onClick={onClose} aria-label={closeLabel}><Close /></button>
      {n > 1 && <button type="button" className="icon-btn icon-btn--glass lightbox__prev" onClick={() => go(-1)} aria-label={prevLabel}><Chevron style={{ transform: "rotate(180deg)" }} /></button>}
      {n > 1 && <button type="button" className="icon-btn icon-btn--glass lightbox__next" onClick={() => go(1)} aria-label={nextLabel}><Chevron /></button>}
      <span className="lightbox__count">{title} · {index + 1} / {n}</span>
    </div>
  );
}
