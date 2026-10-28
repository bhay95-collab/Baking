import { useEffect, useRef, type ReactNode } from 'react';

/** Native <dialog> wrapper: focus trap, Esc to close, click backdrop to close. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
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
      {open && (
        <div className="modal-body">
          <div className="modal-head">
            <h2>{title}</h2>
            <button type="button" className="btn ghost icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
