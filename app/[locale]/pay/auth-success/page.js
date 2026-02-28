'use client'
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const estado    = searchParams.get('Estado');
  const codOper   = searchParams.get('Oper');
  const totalPaid = searchParams.get('TotalPagado');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!bookingId) { setStatus('timeout'); return; }

    const confirm = async () => {
      try {
        if (estado === 'Aprobada') {
          const res = await fetch('/api/pay/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, type: 'auth', codOper, totalPaid }),
          });
          const data = await res.json();
          if (data.success) { setStatus('success'); return; }
        }
        setStatus('timeout');
      } catch (e) {
        setStatus('timeout');
      }
    };

    confirm();
  }, [bookingId, estado, codOper, totalPaid]);

  if (status === 'loading') return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
      <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-800 mb-2">Processing your authorization...</h1>
      <p className="text-gray-500 text-sm">Please wait, do not close this page.</p>
    </div>
  );

  if (status === 'success') return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Deposit Authorized!</h1>
      <p className="text-gray-500 text-sm mb-6">Your $1,000 security deposit has been successfully authorized. Your card will only be charged if damages occur.</p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
        You can now close this page. We'll be in touch soon! 🏍️
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
      <div className="text-5xl mb-4">⏳</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Almost there...</h1>
      <p className="text-gray-500 text-sm mb-6">We're still confirming your payment. If you completed the payment, everything should be fine — we'll update your booking shortly.</p>
      <a href="https://wa.me/50768051100"
        className="block w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition text-center">
        Contact us on WhatsApp
      </a>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Image src="/LOGO.svg" alt="Overland Motorcycles" width={160} height={60} className="mb-8" priority />
      <Suspense fallback={<div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />}>
        <AuthSuccessContent />
      </Suspense>
    </div>
  );
}