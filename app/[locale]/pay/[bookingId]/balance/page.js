import { createClient } from '@supabase/supabase-js';
import BalancePayButton from './BalancePayButton';
import Image from 'next/image';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function BalancePage({ params }) {
  const { bookingId } = await params;

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

  if (booking.balance_status === 'captured') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-xl font-semibold">✅ Balance already paid. Thank you!</p>
      </div>
    );
  }

  const balanceAmount = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
           <div className="flex justify-center mb-6">
           <Image src="/LOGO.svg" alt="Overland Motorcycles" width={160} height={60} priority />
         </div>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Remaining Balance</h1>
        <p className="text-gray-500 mb-6">Final payment to complete your booking.</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between"><span>Name</span><span className="font-medium">{booking.first_name} {booking.last_name}</span></div>
          <div className="flex justify-between"><span>Motorcycle</span><span className="font-medium">{booking.motorcycle_model}</span></div>
          <div className="flex justify-between"><span>Dates</span><span className="font-medium">{booking.start_date} → {booking.end_date}</span></div>
          <div className="flex justify-between"><span>Total Price</span><span className="font-medium">${parseFloat(booking.total_price).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Already Paid</span><span className="font-medium text-green-600">- ${parseFloat(booking.down_payment).toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2"><span className="font-semibold">Amount Due</span><span className="font-bold text-lg">${balanceAmount}</span></div>
        </div>

        <BalancePayButton bookingId={bookingId} />
      </div>
    </div>
  );
}