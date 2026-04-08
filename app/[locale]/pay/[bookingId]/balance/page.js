import { createClient } from '@supabase/supabase-js';
import BalancePayButton from './BalancePayButton';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function BalancePage({ params, searchParams }) {
  const { bookingId } = await params;
  const sp   = await searchParams;
  const mode = sp?.mode || 'balance'; // 'balance' | 'full' | 'initial'

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Booking not found.</p>
      </div>
    );
  }

  if (booking.balance_status === 'captured' && mode !== 'initial') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-xl font-semibold">✅ Balance already paid. Thank you!</p>
      </div>
    );
  }

  if (mode === 'initial' && booking.payment_status === 'paid' && booking.webhook_received) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-xl font-semibold">✅ Initial payment already received. Thank you!</p>
      </div>
    );
  }

  const balanceAmount   = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);
  const fullAmount      = parseFloat(booking.total_price).toFixed(2);
  const initialAmount   = parseFloat(booking.down_payment).toFixed(2);

  const titles = {
    balance: 'Remaining Balance',
    full:    'Full Payment',
    initial: 'Initial Payment (50%)',
  };

  const subtitles = {
    balance: 'Final payment to complete your booking.',
    full:    'Complete payment for your rental.',
    initial: 'First payment to confirm your booking.',
  };

  const amountDue = mode === 'full' ? fullAmount : mode === 'initial' ? initialAmount : balanceAmount;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="flex justify-center mb-6">
        <Image src="/LOGO.svg" alt="Overland Motorcycles" width={160} height={60} priority />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{titles[mode]}</h1>
        <p className="text-gray-500 mb-6">{subtitles[mode]}</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between"><span>Name</span><span className="font-medium">{booking.first_name} {booking.last_name}</span></div>
          <div className="flex justify-between"><span>Motorcycle</span><span className="font-medium">{booking.motorcycle_model}</span></div>
          <div className="flex justify-between"><span>Dates</span><span className="font-medium">{booking.start_date} → {booking.end_date}</span></div>
          <div className="flex justify-between"><span>Total Price</span><span className="font-medium">${fullAmount}</span></div>
          {mode === 'balance' && (
            <div className="flex justify-between"><span>Already Paid</span><span className="font-medium text-green-600">- ${initialAmount}</span></div>
          )}
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">Amount Due</span>
            <span className="font-bold text-lg">${amountDue}</span>
          </div>
        </div>

        <BalancePayButton bookingId={bookingId} mode={mode} />
      </div>
    </div>
  );
}