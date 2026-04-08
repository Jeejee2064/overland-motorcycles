'use client';
import { useState } from 'react';

export default function BalancePayButton({ bookingId, mode = 'balance' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const labels = {
    balance: { idle: 'Pay Remaining Balance', loading: 'Redirecting...' },
    full:    { idle: 'Pay Full Amount',        loading: 'Redirecting...' },
    initial: { idle: 'Pay Initial Deposit',    loading: 'Redirecting...' },
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pay/balance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, mode }), // ← mode passé ici
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? labels[mode]?.loading : labels[mode]?.idle}
      </button>
    </div>
  );
}