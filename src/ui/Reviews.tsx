import { useRef, useState } from "react";
import { Chevron } from "./Icons";
import { Lightbox } from "./Lightbox";

/* Screenshots of real client messages, provided by the company. */
const REVIEWS = Array.from({ length: 8 }, (_, i) => `/img/reviews/review-${String(i + 1).padStart(2, "0")}`);

export function Reviews({ title, closeLabel, prevLabel, nextLabel }: { title: string; closeLabel: string; prevLabel: string; nextLabel: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <>
      <div className="reviews">
        <div className="reviews__row" ref={row}>
          {REVIEWS.map((r, i) => (
            <button key={r} type="button" className="reviews__item" onClick={() => setOpen(i)} aria-label={`${title} ${i + 1}`}>
              <img src={`${r}-360.jpg`} alt="" loading="lazy" decoding="async" width={360} height={640} />
            </button>
          ))}
        </div>
        <div className="reviews__nav">
          <button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label={prevLabel}><Chevron style={{ transform: "rotate(180deg)" }} /></button>
          <button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label={nextLabel}><Chevron /></button>
        </div>
      </div>
      {open !== null && (
        <Lightbox srcs={REVIEWS.map((r) => `${r}.jpg`)} index={open} onIndex={setOpen} onClose={() => setOpen(null)}
          title={title} closeLabel={closeLabel} prevLabel={prevLabel} nextLabel={nextLabel} />
      )}
    </>
  );
}
