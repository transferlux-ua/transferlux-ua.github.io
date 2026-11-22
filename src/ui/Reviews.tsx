import { useCallback, useEffect, useRef, useState } from "react";
import { Chevron, Close } from "./Icons";

/* Screenshots of real client messages, provided by the company. */
const COUNT = 8;
const REVIEWS = Array.from({ length: COUNT }, (_, i) => `review-${String(i + 1).padStart(2, "0")}`);

export function Reviews({ title, closeLabel, prevLabel, nextLabel }: { title: string; closeLabel: string; prevLabel: string; nextLabel: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + COUNT) % COUNT)), []);
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("no-scroll"); };
  }, [open, close, go]);

  return (
    <>
      <div className="reviews">
        <div className="reviews__row" ref={row}>
          {REVIEWS.map((r, i) => (
            <button key={r} type="button" className="reviews__item" onClick={() => setOpen(i)} aria-label={`${title} ${i + 1}`}>
              <img src={`/img/reviews/${r}-360.jpg`} alt="" loading="lazy" decoding="async" width={360} height={640} />
            </button>
          ))}
        </div>
        <div className="reviews__nav">
          <button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label={prevLabel}><Chevron style={{ transform: "rotate(180deg)" }} /></button>
          <button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label={nextLabel}><Chevron /></button>
        </div>
      </div>
      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={title}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <img key={REVIEWS[open]} src={`/img/reviews/${REVIEWS[open]}.jpg`} alt="" />
          <button type="button" className="icon-btn icon-btn--glass lightbox__close" onClick={close} aria-label={closeLabel}><Close /></button>
          <button type="button" className="icon-btn icon-btn--glass lightbox__prev" onClick={() => go(-1)} aria-label={prevLabel}><Chevron style={{ transform: "rotate(180deg)" }} /></button>
          <button type="button" className="icon-btn icon-btn--glass lightbox__next" onClick={() => go(1)} aria-label={nextLabel}><Chevron /></button>
          <span className="lightbox__count">{open + 1} / {COUNT}</span>
        </div>
      )}
    </>
  );
}
