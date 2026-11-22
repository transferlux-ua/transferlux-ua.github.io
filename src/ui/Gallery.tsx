import { useCallback, useEffect, useRef, useState } from "react";
import { Chevron, Close } from "./Icons";

/* Company photos (watermarked TL copies in /img). The Volkswagen minivan photo is
   intentionally not here. 13 photos + one 2x2 tile = 16 cells, so the grid has no
   empty cells on 4 columns (desktop) and on 2 columns (phone). */
export const PHOTOS = [
  "sprinter-white-two", "sprinter-black-door", "sprinter-interior-light", "seat-recliner-closeup",
  "seats-three-light", "interior-light-vip", "interior-white-diamond", "seats-grey-vip",
  "vw-interior-brown", "interior-turquoise", "interior-purple",
  "interior-brown-orange", "seat-detail-gold"
];

export function Gallery({ title, closeLabel }: { title: string; closeLabel: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touch = useRef<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + PHOTOS.length) % PHOTOS.length)), []);

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
      <div className="photo-grid">
        {PHOTOS.map((p, i) => (
          <button key={p} type="button" className={`photo-grid__item${i === 0 ? " is-big" : ""}`} onClick={() => setOpen(i)} aria-label={`${title} ${i + 1}`}>
            <img src={`/img/${p}-640.jpg`} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={title}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <img key={PHOTOS[open]} src={`/img/${PHOTOS[open]}.jpg`} alt="" />
          <button type="button" className="icon-btn icon-btn--glass lightbox__close" onClick={close} aria-label={closeLabel}><Close /></button>
          <button type="button" className="icon-btn icon-btn--glass lightbox__prev" onClick={() => go(-1)} aria-label="prev"><Chevron style={{ transform: "rotate(180deg)" }} /></button>
          <button type="button" className="icon-btn icon-btn--glass lightbox__next" onClick={() => go(1)} aria-label="next"><Chevron /></button>
          <span className="lightbox__count">{open + 1} / {PHOTOS.length}</span>
        </div>
      )}
    </>
  );
}
