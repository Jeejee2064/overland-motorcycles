import Link from 'next/link';
import { useLocale } from 'next-intl';
import CustomerBrandBar from '@/components/CustomerBrandBar';

const TEXT = {
  en: { title: 'Booking not found', body: 'This link is invalid or the booking no longer exists. Please check the link you received or contact us.', home: 'Back to website' },
  es: { title: 'Reserva no encontrada', body: 'Este enlace no es válido o la reserva ya no existe. Revisa el enlace que recibiste o contáctanos.', home: 'Volver al sitio' },
  fr: { title: 'Réservation introuvable', body: "Ce lien est invalide ou la réservation n'existe plus. Vérifiez le lien reçu ou contactez-nous.", home: 'Retour au site' },
  pt: { title: 'Reserva não encontrada', body: 'Este link é inválido ou a reserva não existe mais. Verifique o link recebido ou entre em contato.', home: 'Voltar ao site' },
};

export default function CustomerBookingNotFound() {
  const locale = useLocale();
  const t = TEXT[locale] || TEXT.en;
  const home = locale === 'en' ? '/' : `/${locale}`;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-gray-200">
      <CustomerBrandBar homeHref={home} />
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold uppercase text-white mb-3">{t.title}</h1>
        <p className="text-gray-400 text-sm mb-8">{t.body}</p>
        <Link href={home} className="inline-block px-6 py-3 bg-accent text-black font-bold uppercase text-sm hover:bg-white transition">
          {t.home}
        </Link>
      </main>
    </div>
  );
}
