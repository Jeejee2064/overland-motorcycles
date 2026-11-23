'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { ArrowUpRight, Clock, ImageIcon, LogOut, Pencil, Plus } from 'lucide-react';
import { btnPrimary, btnSecondary, btnGhost, field, focus, priceFmt } from './ui';

const dateFmt = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function NewTourDialog({ onClose }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [days, setDays] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, days: Number(days) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Création impossible.');
      router.push(`/admin/lostoursdeclems/${data.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form
        role="dialog" aria-modal="true" aria-labelledby="new-tour-title"
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl"
      >
        <div>
          <h2 id="new-tour-title" className="text-lg font-bold">Nouveau tour</h2>
          <p className="text-sm text-gray-500 mt-1">Deux infos pour commencer. Vous ajoutez ensuite les photos, les textes et le prix. Rien n’est en ligne tant que vous ne publiez pas.</p>
        </div>
        <div>
          <label htmlFor="new-name" className="font-semibold text-sm">Nom du tour</label>
          <input id="new-name" autoFocus required type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="ex. Tour du volcan Barú" className={`${field} mt-2 px-4 py-3 font-semibold`} />
        </div>
        <div>
          <label htmlFor="new-days" className="font-semibold text-sm">Durée (en jours)</label>
          <input id="new-days" required type="number" min="1" max="60" step="1" value={days} onChange={(e) => setDays(e.target.value)}
            className={`${field} mt-2 w-32 px-4 py-3 font-semibold tabular-nums`} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Annuler</button>
          <button type="submit" disabled={busy || !name.trim()} className={btnPrimary}>{busy ? 'Création…' : 'Créer le tour'}</button>
        </div>
      </form>
    </div>
  );
}

export default function ToursDashboard({ tours, setupError }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const logout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Les tours</h1>
            <p className="text-sm text-gray-500">Overland Motorcycles · textes, prix et photos</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setCreating(true)} className={`${btnGhost} text-gray-900`}>
              <Plus size={16} /> Nouveau tour
            </button>
            <Link href="/motorcycle-tours" target="_blank" className={`${btnGhost}`}>
              Voir le site <ArrowUpRight size={16} />
            </Link>
            <button type="button" onClick={logout} className={btnGhost}>
              <LogOut size={16} /> Quitter
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        {setupError && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            La base de données des tours n’est pas encore prête (table <code>tour_content</code>). Les modifications ne
            pourront pas être enregistrées tant que <code>supabase/tour_content.sql</code> n’a pas été exécuté.
          </div>
        )}

        <ol className="grid sm:grid-cols-3 gap-3 text-sm">
          {[
            ['1', 'Modifier', 'Choisissez un tour, changez les photos, les textes ou le prix.'],
            ['2', 'Aperçu', 'Regardez le résultat exact sur ordinateur et sur téléphone. Rien n’est public.'],
            ['3', 'Mettre en ligne', 'Quand tout vous plaît, un clic et c’est visible sur le site.'],
          ].map(([n, title, text]) => (
            <li key={n} className="flex gap-3 rounded-2xl bg-white border border-gray-200 p-4">
              <span className="w-7 h-7 shrink-0 rounded-full bg-yellow-400 font-bold flex items-center justify-center text-sm">{n}</span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-gray-500">{text}</span>
              </span>
            </li>
          ))}
        </ol>

        <ul className="grid sm:grid-cols-2 gap-5">
          {tours.map((tour) => (
            <li key={tour.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
              <Link href={`/admin/lostoursdeclems/${tour.id}`} className={`relative block aspect-[16/9] bg-gray-100 ${focus}`} aria-label={`Modifier ${tour.name}`}>
                <Image src={tour.image} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-yellow-400 text-gray-900 text-sm font-bold px-3 py-1 rounded-full">
                  <Clock size={14} /> {tour.days} jours
                </span>
                <span
                  className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full ${
                    tour.hasDraft ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {tour.neverPublished ? 'Nouveau · pas en ligne' : tour.hasDraft ? 'Modifications non publiées' : 'En ligne'}
                </span>
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-bold">{tour.name}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tour.route}</p>
                <p className="text-sm text-gray-500 mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{tour.days} jours · {tour.nights} nuits</span>
                  <span className="font-semibold text-gray-800">{priceFmt(tour.price)}</span>
                  <span className="inline-flex items-center gap-1"><ImageIcon size={14} /> {tour.photos} photos</span>
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">
                    {tour.publishedAt ? `Dernière mise en ligne le ${dateFmt(tour.publishedAt)}` : tour.custom ? 'Jamais mis en ligne' : 'Version d’origine'}
                  </span>
                  <Link href={`/admin/lostoursdeclems/${tour.id}`} className={btnPrimary}>
                    <Pencil size={16} /> Modifier
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
      {creating && <NewTourDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
