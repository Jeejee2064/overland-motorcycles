'use client';
import { useState } from 'react';

export default function AuthPayButton({ bookingId, index = 0, buttonLabel, loadingLabel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pay/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, index }),
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
      <button onClick={handlePay} disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50">
        {loading ? loadingLabel : buttonLabel}
      </button>
    </div>
  );
}