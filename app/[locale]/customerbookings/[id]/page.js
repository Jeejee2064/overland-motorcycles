import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import CustomerBrandBar from '@/components/CustomerBrandBar';
import { shopWhatsappLink } from '@/lib/whatsapp';

// Public, read-only booking view. The UUID in the URL is the only secret:
// never render email, phone, internal notes or plates here.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My booking',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

const DICT = {
  en: {
    hello: 'Hello', title: 'Your booking', motorcycle: 'Motorcycle', dates: 'Dates', days: (n) => `${n} day${n === 1 ? '' : 's'}`,
    pickup: 'Pickup location', total: 'Total price', paid: 'Paid', balance: 'Balance due', deposit: 'Security deposit',
    depositNote: 'Held on your card and released when the motorcycle is returned.',
    whatsapp: 'Contact us on WhatsApp', site: 'Back to website',
    status: { pending: 'Pending', confirmed: 'Confirmed', 'fully paid': 'Fully paid', cancelled: 'Cancelled', completed: 'Completed' },
  },
  es: {
    hello: 'Hola', title: 'Tu reserva', motorcycle: 'Moto', dates: 'Fechas', days: (n) => `${n} día${n === 1 ? '' : 's'}`,
    pickup: 'Lugar de recogida', total: 'Precio total', paid: 'Pagado', balance: 'Saldo pendiente', deposit: 'Depósito de garantía',
    depositNote: 'Se retiene en tu tarjeta y se libera al devolver la moto.',
    whatsapp: 'Escríbenos por WhatsApp', site: 'Volver al sitio',
    status: { pending: 'Pendiente', confirmed: 'Confirmada', 'fully paid': 'Pagada', cancelled: 'Cancelada', completed: 'Completada' },
  },
  fr: {
    hello: 'Bonjour', title: 'Votre réservation', motorcycle: 'Moto', dates: 'Dates', days: (n) => `${n} jour${n === 1 ? '' : 's'}`,
    pickup: 'Lieu de retrait', total: 'Prix total', paid: 'Payé', balance: 'Solde restant', deposit: 'Dépôt de garantie',
    depositNote: 'Bloqué sur votre carte et libéré au retour de la moto.',
    whatsapp: 'Nous contacter sur WhatsApp', site: 'Retour au site',
    status: { pending: 'En attente', confirmed: 'Confirmée', 'fully paid': 'Payée', cancelled: 'Annulée', completed: 'Terminée' },
  },
  pt: {
    hello: 'Olá', title: 'Sua reserva', motorcycle: 'Moto', dates: 'Datas', days: (n) => `${n} dia${n === 1 ? '' : 's'}`,
    pickup: 'Local de retirada', total: 'Preço total', paid: 'Pago', balance: 'Saldo pendente', deposit: 'Caução',
    depositNote: 'Retida no seu cartão e liberada na devolução da moto.',
    whatsapp: 'Fale conosco no WhatsApp', site: 'Voltar ao site',
    status: { pending: 'Pendente', confirmed: 'Confirmada', 'fully paid': 'Paga', cancelled: 'Cancelada', completed: 'Concluída' },
  },
};

const STATUS_STYLES = {
  pending:      'bg-yellow-400/15 text-yellow-300 border-yellow-400/40',
  confirmed:    'bg-sky-400/15 text-sky-300 border-sky-400/40',
  'fully paid': 'bg-green-400/15 text-green-300 border-green-400/40',
  completed:    'bg-gray-400/15 text-gray-300 border-gray-400/40',
  cancelled:    'bg-red-400/15 text-red-300 border-red-400/40',
};

const money = (n) => `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso, locale) => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const dayCount = (start, end) => {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  return Math.round((e - s) / 86400000) + 1;
};

function Row({ label, children, note }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/10 last:border-0">
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
        {note && <p className="text-[11px] text-gray-500 mt-0.5 max-w-[16rem]">{note}</p>}
      </div>
      <div className="text-right font-semibold text-white">{children}</div>
    </div>
  );
}

export default async function CustomerBookingPage({ params }) {
  const { locale, id } = await params;

  if (!UUID_RE.test(id)) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Explicit column list: only what this page displays (no email / phone / notes).
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('first_name, status, bike_quantity, motorcycle_model, start_date, end_date, pickup_location, total_price, down_payment, deposit, paid, payment_status, webhook_received, balance_status')
    .eq('id', id)
    .maybeSingle();

  if (error || !booking) notFound();

  const t = DICT[locale] || DICT.en;
  const total = Number(booking.total_price) || 0;
  const down  = Number(booking.down_payment) || 0;
  const initialPaid = booking.payment_status === 'paid' && !!booking.webhook_received;
  const balanceDone = booking.balance_status === 'captured';
  const paidAmount = booking.paid || (initialPaid && balanceDone)
    ? total
    : (initialPaid ? down : 0) + (balanceDone ? Math.max(total - down, 0) : 0);
  const balance = Math.max(total - Math.min(paidAmount, total), 0);
  const days = dayCount(booking.start_date, booking.end_date);
  const model = MODEL_LABELS[booking.motorcycle_model] || booking.motorcycle_model || '';
  const home = locale === 'en' ? '/' : `/${locale}`;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-gray-200">
      <CustomerBrandBar homeHref={home} />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-accent font-heading uppercase tracking-widest text-sm mb-1">
          {t.hello} {booking.first_name}
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-heading text-3xl font-bold uppercase text-white">{t.title}</h1>
          <span className={'text-xs font-bold uppercase px-3 py-1 border ' + (STATUS_STYLES[booking.status] || STATUS_STYLES.pending)}>
            {t.status[booking.status] || booking.status}
          </span>
        </div>

        <section className="bg-[#141414] border border-white/10 border-t-2 border-t-accent px-5 py-2">
          <Row label={t.motorcycle}>
            {booking.bike_quantity} × <span className="text-accent">{model}</span>
          </Row>
          <Row label={t.dates}>
            <span className="block">{formatDate(booking.start_date, locale)} → {formatDate(booking.end_date, locale)}</span>
            <span className="block text-xs text-gray-400 font-normal">{t.days(days)}</span>
          </Row>
          <Row label={t.pickup}>{booking.pickup_location || 'Panama City'}</Row>
          <Row label={t.total}>{money(total)}</Row>
          <Row label={t.paid}><span className="text-green-400">{money(paidAmount)}</span></Row>
          <Row label={t.balance}><span className={balance > 0 ? 'text-accent' : 'text-gray-400'}>{money(balance)}</span></Row>
          <Row label={t.deposit} note={t.depositNote}>{money(booking.deposit)}</Row>
        </section>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href={shopWhatsappLink(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-6 py-3 bg-accent text-black font-bold uppercase text-sm hover:bg-white transition"
          >
            {t.whatsapp}
          </a>
          <Link
            href={home}
            className="flex-1 text-center px-6 py-3 border border-white/30 text-white font-bold uppercase text-sm hover:border-accent hover:text-accent transition"
          >
            {t.site}
          </Link>
        </div>
      </main>
    </div>
  );
}
