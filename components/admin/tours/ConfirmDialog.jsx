'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { btnSecondary, focus } from './ui';

// "Are you sure?" modal for destructive actions. Escape / click outside / Cancel all close it.
export default function ConfirmDialog({ title, children, confirmLabel, busy, error, onConfirm, onClose }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h2 id="confirm-title" className="text-xl font-bold mt-4">{title}</h2>
        <div id="confirm-text" className="text-gray-600 mt-2 leading-relaxed">{children}</div>
        {error && <p role="alert" className="text-sm font-medium text-red-600 mt-3">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className={btnSecondary}>Non, annuler</button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={`inline-flex items-center justify-center px-5 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-60 ${focus}`}>
            {busy ? 'Un instant…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
