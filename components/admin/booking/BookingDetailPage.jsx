'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, X, Bike, Mail, Copy, Check, Share2, Trash2, AlertTriangle } from 'lucide-react';
import {
  getBookingMotorcycles,
  getAvailableMotorcyclesForEdit,
} from '@/lib/supabase/bookings-admin-helpers';
import PaymentMailGenerator from '@/components/admin/booking/PaymentMailGenerator';

const BACK_HREF = '/admin/ok?tab=bookings';

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

// Fields that can be edited through the draft (and sent on Save).
const EDITABLE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'country',
  'start_date', 'end_date', 'bike_quantity', 'motorcycle_model', 'pickup_location',
  'total_price', 'down_payment', 'deposit', 'special_requests', 'important_note', 'hear_about_us',
  'payment_status', 'webhook_received', 'auth_status', 'auth_count',
  'balance_status', 'balance_paid_at', 'paid',
];

const pick = (obj) => Object.fromEntries(EDITABLE_FIELDS.map(f => [f, obj?.[f] ?? null]));

const STATUS_STYLES = {
  pending:      'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed:    'bg-sky-100 text-sky-800 border-sky-300',
  'fully paid': 'bg-green-100 text-green-800 border-green-300',
  completed:    'bg-gray-100 text-gray-700 border-gray-300',
  cancelled:    'bg-red-100 text-red-800 border-red-300',
};

const inputCls =
  'w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm focus:border-yellow-500 focus:outline-none disabled:opacity-50';
const smallSelectCls =
  'px-2 py-1 bg-white border border-gray-300 text-gray-900 text-xs font-semibold focus:border-yellow-500 focus:outline-none';

function Card({ title, icon, aside, children, className = '' }) {
  return (
    <section className={'bg-white border border-gray-200 border-t-2 border-t-accent p-5 ' + className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
          {icon}{title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      {children}
    </div>
  );
}

const PayToggleButton = ({ done, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={'px-3 py-1 text-xs font-bold border disabled:opacity-50 transition ' + (
      done ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-400/25'
           : 'bg-accent text-black border-accent hover:bg-yellow-500'
    )}
  >
    {done ? '✅ Paid — undo' : 'Mark as paid'}
  </button>
);

function PaymentRow({ title, amount, txId, children }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{amount}</p>
        {txId && <p className="text-[11px] text-gray-500 truncate">ID: {txId}</p>}
      </div>
      {children}
    </div>
  );
}

export default function BookingDetailPage({ bookingId, role }) {
  const router = useRouter();
  const isCoronado = role === 'coronado';

  const [booking, setBooking]       = useState(null);   // last saved version
  const [draft, setDraft]           = useState(null);   // working copy
  const [loadError, setLoadError]   = useState(null);
  const [isEditing, setIsEditing]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [busy, setBusy]             = useState(false);  // quick payment / status updates

  const [assigned, setAssigned]               = useState([]);
  const [available, setAvailable]             = useState([]);
  const [loadingBikes, setLoadingBikes]       = useState(true);
  const [savingMotorcycle, setSavingMotorcycle] = useState(false);

  const [toast, setToast]               = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingConfirm, setSendingConfirm] = useState(false);
  const [confirmSent, setConfirmSent]   = useState(false);
  const [copied, setCopied]             = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadBooking = useCallback(async () => {
    const res  = await fetch(`/api/bookings/${bookingId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load booking');
    setBooking(data.booking);
    return data.booking;
  }, [bookingId]);

  const loadBikes = useCallback(async () => {
    try {
      setAssigned(await getBookingMotorcycles(bookingId));
    } catch (e) {
      console.error('Error loading motorcycle data:', e);
    } finally {
      setLoadingBikes(false);
    }
  }, [bookingId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await loadBooking();
        if (!cancelled) setDraft({ ...b });
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      }
    })();
    loadBikes();
    return () => { cancelled = true; };
  }, [loadBooking, loadBikes]);

  // Re-fetch the saved booking; keep the draft in sync only when not editing.
  const refresh = useCallback(async () => {
    try {
      const b = await loadBooking();
      setDraft(prev => (isEditing ? { ...prev, ...pickPaymentFields(b) } : { ...b }));
    } catch (e) {
      console.error('Error refreshing booking:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBooking, isEditing]);

  const dirty = useMemo(
    () => !!booking && !!draft && JSON.stringify(pick(booking)) !== JSON.stringify(pick(draft)),
    [booking, draft]
  );

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Available motorcycles for the (draft) dates / model / location while editing.
  useEffect(() => {
    if (!isEditing || !draft?.start_date || !draft?.end_date) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await getAvailableMotorcyclesForEdit(
          draft.start_date, draft.end_date, bookingId,
          draft.pickup_location || booking?.pickup_location, isCoronado
        );
        const model = draft.motorcycle_model || booking?.motorcycle_model;
        if (!cancelled) setAvailable(model ? list.filter(m => m.model === model) : list);
      } catch (e) {
        console.error('Error loading available motorcycles:', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, draft?.start_date, draft?.end_date, draft?.motorcycle_model, draft?.pickup_location]);

  const slots = useMemo(() => {
    if (!booking) return [];
    return Array.from({ length: booking.bike_quantity || 0 }, (_, i) => {
      const a = assigned[i];
      return {
        index: i,
        assignmentId: a?.id || null,
        motorcycleId: a?.motorcycle_id || '',
        motorcycleName: a?.motorcycles?.name || '',
      };
    });
  }, [booking, assigned]);

  const setField = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));

  const api = async (path, init, fallbackMsg) => {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || fallbackMsg);
    return data;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = pick(draft);
      body.pickup_location = isCoronado ? 'Playa Coronado' : draft.pickup_location;
      await api(`/api/admin/bookings/${bookingId}`, { method: 'PATCH', body: JSON.stringify(body) }, 'Failed to save booking');
      const fresh = await loadBooking();
      setDraft({ ...fresh });
      setIsEditing(false);
      notify('Booking updated successfully!');
    } catch (e) {
      notify('Error saving booking: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft({ ...booking });
    setIsEditing(false);
  };

  // Payment-related fields saved immediately (outside edit mode).
  const quickUpdate = async (updates, okMsg) => {
    setBusy(true);
    try {
      await api(`/api/admin/bookings/${bookingId}`, { method: 'PATCH', body: JSON.stringify(updates) }, 'Failed to update');
      await refresh();
      notify(okMsg);
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const initialIsPaid = draft?.payment_status === 'paid' && !!draft?.webhook_received;
  const toggleInitial = () => quickUpdate(
    initialIsPaid
      ? { payment_status: 'pending', webhook_received: false }
      : { payment_status: 'paid', webhook_received: true },
    initialIsPaid ? 'Initial payment set to pending' : 'Initial payment marked as paid'
  );
  const toggleAuth = (i) => {
    const count = booking.auth_count || 0;
    const qty   = booking.bike_quantity || 1;
    const isDone = count > i;
    const newCount = isDone ? i : i + 1;
    quickUpdate({
      auth_count:  newCount,
      auth_status: newCount >= qty ? 'authorized' : newCount > 0 ? 'pending' : null,
    }, isDone ? 'Security deposit unmarked' : 'Security deposit marked as authorized');
  };
  const toggleBalance = () => {
    const isDone = booking.balance_status === 'captured';
    quickUpdate(
      isDone
        ? { balance_status: 'pending', balance_paid_at: null, paid: false }
        : { balance_status: 'captured', balance_paid_at: new Date().toISOString(), paid: true },
      isDone ? 'Balance set to pending' : 'Balance marked as paid'
    );
  };
  const markFullyPaid = () => quickUpdate({ paid: true, status: 'fully paid' }, 'Payment marked as fully paid!');
  const changeStatus  = (status) => quickUpdate({ status }, 'Status updated successfully!');

  // Motorcycle changes apply immediately (not part of the draft).
  const handleMotorcycleChange = async (newMotorcycleId, oldAssignmentId) => {
    setSavingMotorcycle(true);
    try {
      await api(`/api/admin/bookings/${bookingId}/motorcycles`, {
        method: 'PATCH',
        body: JSON.stringify({ oldAssignmentId, newMotorcycleId }),
      }, 'Failed to update motorcycle');
      await loadBikes();
      notify('Motorcycle updated successfully!');
    } catch (e) {
      notify('Error updating motorcycle: ' + e.message, 'error');
    } finally {
      setSavingMotorcycle(false);
    }
  };

  const handleSendConfirmation = async () => {
    setSendingConfirm(true);
    try {
      await api('/api/bookings/send-confirmation-mail', { method: 'POST', body: JSON.stringify({ bookingId }) }, 'Failed to send email');
      setConfirmSent(true);
      const total = 1 + (booking.booking_riders || []).filter(r => r.email).length;
      notify(`Confirmation email sent to ${total} rider${total > 1 ? 's' : ''}`);
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setSendingConfirm(false);
    }
  };

  const copyText = async (key, text, msg) => {
    await navigator.clipboard.writeText(text);
    notify(msg);
    setCopied(key);
    setTimeout(() => setCopied(c => (c === key ? null : c)), 2000);
  };

  const copyCustomerLink = async () => {
    try {
      await copyText('customer', `${window.location.origin}/customerbookings/${bookingId}`, 'Customer link copied!');
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    }
  };

  // One security-deposit link per motorcycle (same flow as the payment mail, without sending it).
  const copyDepositLink = async (i) => {
    try {
      const data = await api('/api/pay/send-payment-mail', {
        method: 'POST',
        body: JSON.stringify({ bookingId, links: [{ type: 'auth', index: i }], sendEmail: false }),
      }, 'Failed to generate link');
      await copyText(`auth_${i}`, data.links[0].url, 'Deposit link copied!');
      await refresh();
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    try {
      await api(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' }, 'Failed to delete booking');
      setDraft(null); // drop the unsaved-changes guard
      router.push(BACK_HREF);
    } catch (e) {
      notify('Error deleting booking: ' + e.message, 'error');
    }
  };

  const onBackClick = (e) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  const brandBar = (
    <div className="bg-white border-b-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="relative block w-12 h-12" aria-label="Overland Motorcycles">
          <Image src="/logo.png" alt="Overland Motorcycles" fill sizes="48px" className="object-contain" priority />
        </Link>
        <span className="font-heading text-sm uppercase tracking-widest text-gray-700">
          Booking <span className="text-yellow-600">#{String(bookingId).slice(0, 8).toUpperCase()}</span>
        </span>
      </div>
    </div>
  );

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {brandBar}
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="mx-auto text-yellow-600 mb-4" size={36} />
          <p className="font-heading uppercase tracking-wider mb-2">Booking not available</p>
          <p className="text-gray-500 text-sm mb-6">{loadError}</p>
          <Link href={BACK_HREF} className="inline-block px-5 py-2 bg-accent text-black font-bold uppercase text-sm hover:bg-yellow-500 transition">
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking || !draft) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {brandBar}
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  const modelLabel = MODEL_LABELS[draft.motorcycle_model] || draft.motorcycle_model || 'Unknown model';
  const duration = (() => {
    if (!draft.start_date || !draft.end_date) return 0;
    const s = new Date(draft.start_date + 'T00:00:00');
    const e = new Date(draft.end_date + 'T00:00:00');
    return Math.round((e - s) / 86400000) + 1;
  })();
  const remaining = (
    parseFloat(draft.total_price) + parseFloat(draft.deposit) - parseFloat(draft.down_payment)
  ).toFixed(2);
  const fullName = `${draft.first_name || ''} ${draft.last_name || ''}`.trim();

  const textField = ({ label, field, type = 'text' }) => (
    <Field key={field} label={label}>
      {isEditing ? (
        <input type={type} value={draft[field] ?? ''} onChange={(e) => setField(field, e.target.value)} className={inputCls} />
      ) : (
        <p className="font-semibold text-gray-900 break-words">{draft[field] || '—'}</p>
      )}
    </Field>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {brandBar}

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <Link
            href={BACK_HREF}
            onClick={onBackClick}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-yellow-600 transition"
          >
            <ArrowLeft size={16} /> Bookings
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase text-gray-900 truncate">
              {fullName || 'Booking'}
            </h1>
            <p className="text-xs font-semibold text-yellow-600">{modelLabel} · 📍 {draft.pickup_location || 'Panama City'}</p>
          </div>
          <span className={'text-xs font-bold uppercase px-3 py-1 border ' + (STATUS_STYLES[booking.status] || STATUS_STYLES.pending)}>
            {booking.status}
          </span>
          {draft.important_note && (
            <span className="text-xs font-bold uppercase px-3 py-1 border bg-red-100 text-red-800 border-red-300">⚠️ Important</span>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-black font-bold uppercase text-sm hover:bg-yellow-500 transition"
            >
              <Edit2 size={16} /> Edit
            </button>
          )}
        </div>
      </div>

      <main className={'max-w-7xl mx-auto px-4 sm:px-6 py-6 ' + (isEditing ? 'pb-28' : '')}>
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6 min-w-0">

            <Card title="Customer">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'First name', field: 'first_name' },
                  { label: 'Last name',  field: 'last_name' },
                  { label: 'Email',      field: 'email', type: 'email' },
                  { label: 'Phone',      field: 'phone', type: 'tel' },
                  { label: 'Country',    field: 'country' },
                ].map(textField)}
                <Field label="How did you hear about us?">
                  {isEditing ? (
                    <select value={draft.hear_about_us || ''} onChange={(e) => setField('hear_about_us', e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      <option value="walk-in">Walk-in</option>
                      <option value="google">Google</option>
                      <option value="social-media">Social Media</option>
                      <option value="referral">Referral</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="font-semibold text-gray-900 capitalize">{draft.hear_about_us || 'N/A'}</p>
                  )}
                </Field>
              </div>
            </Card>

            {booking.booking_riders?.length > 0 && (
              <Card title="Additional riders">
                <div className="space-y-3">
                  {booking.booking_riders.map((rider) => (
                    <div key={rider.id} className="p-3 bg-gray-50 border border-gray-200">
                      <p className="text-xs font-bold text-yellow-600 mb-2 uppercase tracking-wider">Rider {rider.rider_index}</p>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">Name: </span><span className="font-semibold text-gray-900">{rider.first_name} {rider.last_name}</span></div>
                        <div><span className="text-gray-500">Email: </span>{rider.email
                          ? <a href={`mailto:${rider.email}`} className="text-yellow-600 hover:underline font-semibold break-all">{rider.email}</a>
                          : '—'}</div>
                        <div><span className="text-gray-500">Phone: </span>{rider.phone
                          ? <a href={`https://wa.me/${rider.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-semibold">{rider.phone}</a>
                          : '—'}</div>
                        <div><span className="text-gray-500">Country: </span><span className="font-semibold text-gray-900">{rider.country || '—'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Trip">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Start date">
                  {isEditing
                    ? <input type="date" value={draft.start_date || ''} onChange={(e) => setField('start_date', e.target.value)} className={inputCls} />
                    : <p className="font-semibold text-gray-900">{draft.start_date}</p>}
                </Field>
                <Field label="End date">
                  {isEditing
                    ? <input type="date" value={draft.end_date || ''} onChange={(e) => setField('end_date', e.target.value)} className={inputCls} />
                    : <p className="font-semibold text-gray-900">{draft.end_date}</p>}
                </Field>
                <Field label="Duration">
                  <p className="font-semibold text-gray-900">{duration} day{duration !== 1 ? 's' : ''}</p>
                </Field>
                <Field label="Bike quantity">
                  <p className="font-semibold text-gray-900">{draft.bike_quantity}</p>
                </Field>
                <Field label="Pickup location">
                  {isEditing && !isCoronado ? (
                    <select
                      value={draft.pickup_location || 'Panama City'}
                      onChange={(e) => {
                        const location = e.target.value;
                        setDraft(prev => ({
                          ...prev,
                          pickup_location: location,
                          motorcycle_model: location === 'Playa Coronado' && prev.motorcycle_model === 'CFMoto700' ? 'Himalayan' : prev.motorcycle_model,
                        }));
                      }}
                      className={inputCls}
                    >
                      <option value="Panama City">Panama City</option>
                      <option value="Playa Coronado">Playa Coronado</option>
                    </select>
                  ) : (
                    <p className="font-semibold text-gray-900">{draft.pickup_location || 'Panama City'}</p>
                  )}
                </Field>
                <Field label="Motorcycle model">
                  {isEditing ? (
                    <select value={draft.motorcycle_model || 'Himalayan'} onChange={(e) => setField('motorcycle_model', e.target.value)} className={inputCls}>
                      <option value="Himalayan">Royal Enfield Himalayan 450</option>
                      {draft.pickup_location !== 'Playa Coronado' && <option value="CFMoto700">CF Moto 700 CL-X</option>}
                    </select>
                  ) : (
                    <p className="font-semibold text-yellow-600">{modelLabel}</p>
                  )}
                </Field>
              </div>
            </Card>

            <Card
              title="Assigned motorcycles"
              icon={<Bike size={16} className="text-yellow-600" />}
              aside={<span className="text-xs text-gray-500">{modelLabel}</span>}
            >
              {loadingBikes ? (
                <p className="text-center py-4 text-gray-500 text-sm">Loading motorcycles...</p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot, i) => (
                    <div key={slot.index}>
                      <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Motorcycle {i + 1}</p>
                      {isEditing ? (
                        <select
                          value={slot.motorcycleId}
                          onChange={(e) => handleMotorcycleChange(e.target.value, slot.assignmentId)}
                          disabled={savingMotorcycle}
                          className={inputCls}
                        >
                          <option value="">Select a motorcycle...</option>
                          {slot.motorcycleId && slot.motorcycleName && (
                            <option value={slot.motorcycleId}>{slot.motorcycleName} (Current)</option>
                          )}
                          {available.filter(m => m.id !== slot.motorcycleId).map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.location || 'Panama City'})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3">
                          <Bike size={16} className="text-yellow-600" />
                          <span className="font-semibold text-gray-900">{slot.motorcycleName || 'Not assigned'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {slots.length === 0 && (
                    <p className="text-center py-4 text-gray-500 text-sm bg-gray-50">No motorcycle slots available</p>
                  )}
                  {isEditing && (
                    <p className="text-[11px] text-gray-500">Motorcycle changes are applied immediately.</p>
                  )}
                  {isEditing && available.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-300 text-sm text-yellow-800">
                      ⚠️ No available {modelLabel} bikes for this date range.
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card
              title="Special requests"
              aside={isEditing && (
                <label className="flex items-center gap-2 text-xs font-semibold text-red-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!draft.important_note}
                    onChange={(e) => setField('important_note', e.target.checked)}
                    className="w-4 h-4 accent-red-500"
                  />
                  ⚠️ Important
                </label>
              )}
            >
              {isEditing ? (
                <textarea
                  value={draft.special_requests || ''}
                  onChange={(e) => setField('special_requests', e.target.value)}
                  rows={4}
                  aria-label="Special requests"
                  placeholder="Enter any special requests..."
                  className={inputCls + (draft.important_note ? ' border-red-400' : '')}
                />
              ) : (
                <p className={'p-4 text-sm whitespace-pre-wrap ' + (draft.important_note ? 'bg-red-50 border border-red-200 text-red-900 font-medium' : 'bg-gray-50 text-gray-700')}>
                  {draft.special_requests || 'No special requests'}
                </p>
              )}
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6 lg:sticky lg:top-24 min-w-0">

            <Card title="Status">
              <select
                value={booking.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={busy || isEditing}
                aria-label="Booking status"
                className={inputCls}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="fully paid">Fully Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </Card>

            <Card title="Payment">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total', field: 'total_price' },
                    { label: 'Down', field: 'down_payment' },
                    { label: 'Deposit', field: 'deposit' },
                  ].map(({ label, field }) => (
                    <Field key={field} label={label}>
                      {isEditing ? (
                        <input
                          type="number" step="0.01" value={Number.isNaN(draft[field]) ? '' : draft[field] ?? ''}
                          onChange={(e) => setField(field, parseFloat(e.target.value))}
                          className={inputCls + ' px-2'}
                        />
                      ) : (
                        <p className="font-semibold text-gray-900">${draft[field]}</p>
                      )}
                    </Field>
                  ))}
                </div>

                {!draft.paid && (
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                    <span className="text-gray-500">Still to be paid</span>
                    <span className="font-semibold text-red-600">${remaining}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                  <span className="text-gray-900 font-bold">Payment status</span>
                  <span className={'font-bold ' + (draft.paid ? 'text-green-600' : 'text-red-600')}>{draft.paid ? 'PAID' : 'UNPAID'}</span>
                </div>

                <PaymentRow title="Initial payment (50%)" amount={`$${parseFloat(draft.down_payment).toFixed(2)}`} txId={draft.paguelofacil_transaction_id}>
                  {isEditing ? (
                    <select
                      aria-label="Initial payment status"
                      value={initialIsPaid ? 'paid' : draft.payment_status || 'pending'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft(prev => ({
                          ...prev,
                          payment_status: val,
                          webhook_received: val === 'paid',
                          paid: val === 'paid' ? true : prev.paid,
                        }));
                      }}
                      className={smallSelectCls}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="paid">✅ Paid</option>
                      <option value="failed">❌ Failed</option>
                    </select>
                  ) : (
                    <PayToggleButton done={initialIsPaid} disabled={busy} onClick={toggleInitial} />
                  )}
                </PaymentRow>

                {!isCoronado && Array.from({ length: draft.bike_quantity || 1 }).map((_, i) => {
                  const isAuthorized = (draft.auth_count || 0) > i;
                  return (
                    <PaymentRow
                      key={i}
                      title={`Security deposit${draft.bike_quantity > 1 ? ` #${i + 1}` : ''} (AUTH)`}
                      amount="$1,000.00"
                      txId={isAuthorized ? draft.auth_transaction_id : null}
                    >
                      {isEditing ? (
                        <select
                          aria-label={`Security deposit ${i + 1} status`}
                          value={isAuthorized ? 'authorized' : (draft.auth_status === 'authorized' ? 'pending' : draft.auth_status) || 'not_sent'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft(prev => ({
                              ...prev,
                              auth_status: val === 'not_sent' ? null : val,
                              auth_count: val === 'authorized' ? i + 1 : (prev.auth_count || 0) > i ? i : prev.auth_count,
                            }));
                          }}
                          className={smallSelectCls}
                        >
                          <option value="not_sent">— Not sent</option>
                          <option value="pending">⏳ Pending</option>
                          <option value="authorized">✅ Authorized</option>
                          <option value="failed">❌ Failed</option>
                        </select>
                      ) : (
                        <PayToggleButton done={isAuthorized} disabled={busy} onClick={() => toggleAuth(i)} />
                      )}
                    </PaymentRow>
                  );
                })}

                <PaymentRow
                  title="Remaining balance"
                  amount={`$${(parseFloat(draft.total_price) - parseFloat(draft.down_payment)).toFixed(2)}`}
                  txId={draft.balance_transaction_id}
                >
                  {isEditing ? (
                    <select
                      aria-label="Balance status"
                      value={draft.balance_status || 'not_sent'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft(prev => ({
                          ...prev,
                          balance_status: val === 'not_sent' ? null : val,
                          ...(val === 'captured' ? { paid: true, balance_paid_at: new Date().toISOString() } : {}),
                        }));
                      }}
                      className={smallSelectCls}
                    >
                      <option value="not_sent">— Not sent</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="captured">✅ Paid</option>
                      <option value="failed">❌ Failed</option>
                    </select>
                  ) : (
                    <PayToggleButton done={booking.balance_status === 'captured'} disabled={busy} onClick={toggleBalance} />
                  )}
                </PaymentRow>

                {!isEditing && (
                  <>
                    <PaymentMailGenerator
                      key={[booking.payment_status, booking.webhook_received, booking.auth_count, booking.balance_status, booking.bike_quantity].join('|')}
                      booking={booking}
                      onSent={refresh}
                      notify={notify}
                      role={role}
                    />
                    {booking.payment_mail_sent_at && (
                      <p className="text-[11px] text-gray-500 text-center">
                        Last mail sent: {new Date(booking.payment_mail_sent_at).toLocaleString()}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>

            {!isEditing && (
              <Card title="Actions">
                <div className="space-y-2">
                  {!booking.paid && (
                    <button onClick={markFullyPaid} disabled={busy}
                      className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold uppercase text-sm transition disabled:opacity-50">
                      Mark as fully paid
                    </button>
                  )}
                  <button onClick={handleSendConfirmation} disabled={sendingConfirm}
                    className={'w-full flex items-center justify-center gap-2 px-4 py-2 border font-bold uppercase text-sm transition disabled:opacity-50 ' + (
                      confirmSent ? 'border-green-300 text-green-800 bg-green-400/10' : 'border-gray-300 text-gray-900 hover:border-yellow-500 hover:text-yellow-600'
                    )}>
                    <Mail size={15} />
                    {sendingConfirm ? 'Sending…' : confirmSent ? 'Confirmation sent' : 'Send confirmation email'}
                  </button>
                  <button onClick={copyCustomerLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-900 hover:border-yellow-500 hover:text-yellow-600 font-bold uppercase text-sm transition">
                    {copied === 'customer' ? <Check size={15} className="text-green-600" /> : <Share2 size={15} />}
                    Copy customer link
                  </button>
                  {!isCoronado && Array.from({ length: booking.bike_quantity || 1 }).map((_, i) => (
                    (booking.auth_count || 0) > i ? null : (
                      <button key={i} onClick={() => copyDepositLink(i)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-900 hover:border-yellow-500 hover:text-yellow-600 font-bold uppercase text-sm transition">
                        {copied === `auth_${i}` ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                        Copy deposit link{booking.bike_quantity > 1 ? ` #${i + 1}` : ''}
                      </button>
                    )
                  ))}
                  <button onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white font-bold uppercase text-sm transition mt-2">
                    <Trash2 size={15} /> Delete booking
                  </button>
                </div>
              </Card>
            )}
          </aside>
        </div>
      </main>

      {/* Sticky save bar */}
      {isEditing && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-accent shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">
              {dirty ? <><span className="text-yellow-600">●</span> Unsaved changes</> : 'Editing — no changes yet'}
            </p>
            <div className="flex gap-2">
              <button onClick={handleDiscard} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-900 hover:border-gray-500 font-bold uppercase text-sm transition disabled:opacity-50">
                <X size={16} /> Discard
              </button>
              <button onClick={handleSave} disabled={saving || !dirty}
                className="flex items-center gap-2 px-5 py-2 bg-accent text-black hover:bg-yellow-500 font-bold uppercase text-sm transition disabled:opacity-50">
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div role="status" className={`fixed ${isEditing ? 'bottom-20' : 'bottom-6'} right-6 z-[200] flex items-center gap-3 px-5 py-3.5 shadow-2xl text-white text-sm font-semibold ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
        }`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4" role="dialog" aria-modal="true" aria-label="Confirm deletion">
          <div className="bg-white border border-gray-200 border-t-2 border-t-red-500 p-6 max-w-sm w-full">
            <p className="text-gray-900 font-semibold mb-6 text-center">Delete this booking? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold uppercase text-sm transition">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-900 hover:border-gray-500 font-bold uppercase text-sm transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fields the server can change while the admin is editing (payment flow).
function pickPaymentFields(b) {
  return {
    payment_status: b.payment_status, webhook_received: b.webhook_received,
    auth_status: b.auth_status, auth_count: b.auth_count,
    balance_status: b.balance_status, balance_paid_at: b.balance_paid_at, paid: b.paid,
  };
}
