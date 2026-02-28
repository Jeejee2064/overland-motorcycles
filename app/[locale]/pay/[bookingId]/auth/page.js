import { createClient } from '@supabase/supabase-js';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import AuthPayButton from './AuthPayButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function AuthPage({ params, searchParams }) {
  const { bookingId } = await params;
  const sp = await searchParams;
  const index = parseInt(sp?.index || '0');
  const locale = (await params).locale || 'en';
  const t = await getTranslations({ locale, namespace: 'auth' });

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t('notFound')}</p>
      </div>
    );
  }

  if (booking.auth_status === 'authorized') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-600 text-xl font-semibold">✅ {t('alreadyPaid')}</p>
      </div>
    );
  }

  const depositLabel = booking.bike_quantity > 1
    ? `Security Deposit #${index + 1} of ${booking.bike_quantity}`
    : 'Security Deposit';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Image src="/LOGO.svg" alt="Overland Motorcycles" width={160} height={60} priority />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{depositLabel}</h1>
        <p className="text-gray-500 mb-6">{t('subtitle')}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between"><span>{t('name')}</span><span className="font-medium">{booking.first_name} {booking.last_name}</span></div>
          <div className="flex justify-between"><span>{t('motorcycle')}</span><span className="font-medium">{booking.motorcycle_model}</span></div>
          <div className="flex justify-between"><span>{t('dates')}</span><span className="font-medium">{booking.start_date} → {booking.end_date}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">{t('depositAmount')}</span>
            <span className="font-bold text-lg">$1,000.00</span>
          </div>
        </div>
        <AuthPayButton
          bookingId={bookingId}
          index={index}
          buttonLabel={t('button')}
          loadingLabel={t('loading')}
        />
      </div>
    </div>
  );
}