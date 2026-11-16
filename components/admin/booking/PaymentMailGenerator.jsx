'use client'
import React from 'react';
import { Copy, Check } from 'lucide-react';

// Sends (or copies) payment / security-deposit links for a booking.
export default function PaymentMailGenerator({ booking, onSent, notify, role }) {
  const isCoronado = role === 'coronado';
  const bikeCount = booking.bike_quantity || 1;
  const authCount = booking.auth_count || 0;
  const balDone   = booking.balance_status === 'captured';
  const initDone  = booking.webhook_received && booking.payment_status === 'paid';

  const options = [];

  // "Full payment" covers initial + balance — only offer it while neither is paid.
  if (!initDone && !balDone) {
    options.push({
      id: 'full',
      label: `Full Payment (Initial + Balance) — $${parseFloat(booking.total_price).toFixed(2)}`,
      done: false, type: 'full', index: 0,
    });
  }
  if (!initDone) {
    options.push({
      id: 'initial',
      label: `Initial Payment (50%) — $${parseFloat(booking.down_payment).toFixed(2)}`,
      done: false, type: 'initial', index: 0,
    });
  }
  if (!isCoronado) {
    for (let i = 0; i < bikeCount; i++) {
      options.push({
        id: `auth_${i}`,
        label: bikeCount > 1 ? `Security Deposit #${i + 1} — $1,000` : 'Security Deposit — $1,000',
        done: authCount > i, type: 'auth', index: i,
      });
    }
  }
  options.push({
    id: 'balance',
    label: `Remaining Balance — $${(parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2)}`,
    done: balDone, type: 'balance', index: 0,
  });

  const [selected, setSelected] = React.useState(() => {
    const notDone = options.filter(o => !o.done);
    const full = notDone.find(o => o.id === 'full');
    return full
      ? notDone.filter(o => o.id !== 'initial' && o.id !== 'balance').map(o => o.id)
      : notDone.map(o => o.id);
  });
  const [sending, setSending]     = React.useState(false);
  const [copyingId, setCopyingId] = React.useState(null);
  const [copiedId, setCopiedId]   = React.useState(null);

  const fullSelected          = selected.includes('full');
  const halfOrBalanceSelected = selected.some(id => id === 'initial' || id === 'balance');
  const isLocked = (opt) =>
    opt.done ||
    (opt.id === 'full' && halfOrBalanceSelected) ||
    ((opt.id === 'initial' || opt.id === 'balance') && fullSelected);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const call = async (links, sendEmail) => {
    const res = await fetch('/api/pay/send-payment-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, links, ...(sendEmail ? {} : { sendEmail: false }) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const handleSend = async () => {
    if (selected.length === 0) return;
    setSending(true);
    try {
      await call(selected.map(id => {
        const opt = options.find(o => o.id === id);
        return { type: opt.type, index: opt.index };
      }), true);
      notify('Payment mail sent!');
      if (onSent) await onSent();
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async (opt) => {
    setCopyingId(opt.id);
    try {
      const data = await call([{ type: opt.type, index: opt.index }], false);
      await navigator.clipboard.writeText(data.links[0].url);
      notify('Link copied to clipboard!');
      setCopiedId(opt.id);
      setTimeout(() => setCopiedId(id => (id === opt.id ? null : id)), 2000);
      if (onSent) await onSent();
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Send payment links</p>
      <div className="space-y-1 mb-3">
        {options.map(opt => {
          const locked = isLocked(opt);
          return (
            <div key={opt.id} className="flex flex-wrap items-center gap-2 p-1.5 hover:bg-gray-100 transition">
              <label className={'flex items-center gap-2 flex-1 min-w-0 ' + (locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer')}>
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={selected.includes(opt.id)}
                  onChange={() => toggle(opt.id)}
                  className="w-4 h-4 shrink-0 accent-yellow-400"
                />
                <span className="text-xs text-gray-900">{opt.label}</span>
              </label>
              {opt.done && <span className="text-xs text-green-600 whitespace-nowrap">✅ Done</span>}
              {!opt.done && locked && (
                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                  {opt.id === 'full' ? 'uncheck other options first' : 'covered by full payment'}
                </span>
              )}
              {!opt.done && (
                <button
                  type="button"
                  onClick={() => handleCopy(opt)}
                  disabled={copyingId === opt.id}
                  title="Copy payment link (doesn't send an email)"
                  className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-yellow-500 px-2 py-1 transition disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {copiedId === opt.id
                    ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</>
                    : <><Copy className="w-3.5 h-3.5" /> {copyingId === opt.id ? '...' : 'Copy link'}</>}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSend}
        disabled={sending || selected.length === 0}
        className="w-full py-2 bg-accent hover:bg-yellow-500 text-black font-bold uppercase tracking-wide text-xs transition disabled:opacity-50"
      >
        {sending ? 'Sending...' : `Send ${selected.length} link${selected.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
