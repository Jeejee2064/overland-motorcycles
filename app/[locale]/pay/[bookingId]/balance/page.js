import { createClient } from '@supabase/supabase-js';
import { getTranslations } from 'next-intl/server';
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
  const locale = (await params).locale || 'en';
  const t = await getTranslations({ locale, namespace: 'Pay' });

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t('bookingNotFound')}</p>
      </div>
    );
  }

  if (booking.balance_status === 'captured' && mode !== 'initial') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-xl font-semibold">✅ {t('balanceAlreadyPaid')}</p>
      </div>
    );
  }

  if (mode === 'initial' && booking.payment_status === 'paid' && booking.webhook_received) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-xl font-semibold">✅ {t('initialAlreadyReceived')}</p>
      </div>
    );
  }

  const balanceAmount   = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);
  const fullAmount      = parseFloat(booking.total_price).toFixed(2);
  const initialAmount   = parseFloat(booking.down_payment).toFixed(2);

  const titles = {
    balance: t('remainingBalance'),
    full:    t('fullPayment'),
    initial: t('initialPayment'),
  };

  const subtitles = {
    balance: t('subtitleBalance'),
    full:    t('subtitleFull'),
    initial: t('subtitleInitial'),
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
          <div className="flex justify-between"><span>{t('name')}</span><span className="font-medium">{booking.first_name} {booking.last_name}</span></div>
          <div className="flex justify-between"><span>{t('motorcycle')}</span><span className="font-medium">{booking.motorcycle_model}</span></div>
          <div className="flex justify-between"><span>{t('pickupLocation')}</span><span className="font-medium">{booking.pickup_location || 'Panama City'}</span></div>
          <div className="flex justify-between"><span>{t('dates')}</span><span className="font-medium">{booking.start_date} → {booking.end_date}</span></div>
          <div className="flex justify-between"><span>{t('totalPrice')}</span><span className="font-medium">${fullAmount}</span></div>
          {mode === 'balance' && (
            <div className="flex justify-between"><span>{t('alreadyPaid')}</span><span className="font-medium text-green-600">- ${initialAmount}</span></div>
          )}
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">{t('amountDue')}</span>
            <span className="font-bold text-lg">${amountDue}</span>
          </div>
        </div>

        <BalancePayButton
          bookingId={bookingId}
          mode={mode}
          labels={{
            balance: t('payBalance'),
            full: t('payFull'),
            initial: t('payInitial'),
            loading: t('redirecting'),
          }}
        />
      </div>
    </div>
  );
}