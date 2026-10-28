import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icons';

/** Matches the 140 ms exit transition in styles.css, plus a frame of slack. */
const EXIT_MS = 160;

/** Native <dialog> wrapper: focus trap, Esc to close, click backdrop to close. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Content stays mounted for the length of the exit (EXIT_MS) so the box fades out full, not empty.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open) {
      if (d.open) d.close();
      const t = window.setTimeout(() => setMounted(false), EXIT_MS);
      return () => window.clearTimeout(t);
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' wide' : ''}`}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {mounted && (
        <div className="modal-body">
          <div className="modal-head">
            <h2>{title}</h2>
            <button type="button" className="btn text icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
