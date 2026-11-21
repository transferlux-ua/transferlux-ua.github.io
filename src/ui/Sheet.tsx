import { useEffect, useRef, type ReactNode } from "react";
import { Close } from "./Icons";

/** Right side panel on desktop, bottom sheet on phones. */
export function Sheet({ open, title, onClose, closeLabel, children, wide }: { open: boolean; title: string; onClose: () => void; closeLabel: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
      prev?.focus?.();
    };
  }, [open, onClose]);
  return (
    <div className={`sheet-wrap${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className={`sheet${wide ? " sheet--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="sheet__head">
          <span className="sheet__grip" aria-hidden="true" />
          <h2 className="sheet__title">{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label={closeLabel}><Close /></button>
        </div>
        <div className="sheet__body">{open ? children : null}</div>
      </div>
    </div>
  );
}
