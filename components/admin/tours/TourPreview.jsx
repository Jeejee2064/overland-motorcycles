'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import { ArrowLeft, Monitor, Smartphone, Rocket, ExternalLink } from 'lucide-react';
import { COPY_LOCALES, LOCALE_LABELS } from '@/lib/tours-shared';
import { btnGhost, btnPrimary, focus } from './ui';

// Same pages as the live site, drawn from the draft, in a frame that can be narrowed to phone size.
export default function TourPreview({ tourId, slug, name, hasDraft, initialLang }) {
  const [lang, setLang] = useState(initialLang);
  const [device, setDevice] = useState('desktop');
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState(null);
  const [published, setPublished] = useState(false);

  const src = `${lang === 'en' ? '' : `/${lang}`}/admin/lostoursdeclems/${tourId}/render`;

  const publish = async () => {
    if (!window.confirm('Mettre ce tour en ligne ? Les visiteurs verront ces modifications tout de suite.')) return;
    setPublishing(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Échec de la mise en ligne.');
      setPublished(true);
    } catch (e) {
      setStatus(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const pill = (active) =>
    `px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${focus} ${
      active ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
    }`;

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={`/admin/lostoursdeclems/${tourId}`} className={btnGhost}>
          <ArrowLeft size={16} /> Retour à la modification
        </Link>

        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">Aperçu · {name}</p>
          <p className="text-xs text-gray-500" role="status" aria-live="polite">
            {published
              ? 'C’est en ligne !'
              : hasDraft
                ? 'Pas encore en ligne : seuls vous le voyez.'
                : 'Identique à la version en ligne.'}
          </p>
        </div>

        <div role="group" aria-label="Langue" className="flex gap-1.5">
          {COPY_LOCALES.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={pill(lang === l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Taille d’écran" className="flex gap-1.5">
          <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} className={`${pill(device === 'desktop')} inline-flex items-center gap-1.5`}>
            <Monitor size={15} /> Ordinateur
          </button>
          <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} className={`${pill(device === 'mobile')} inline-flex items-center gap-1.5`}>
            <Smartphone size={15} /> Téléphone
          </button>
        </div>

        {published ? (
          <Link href={`/motorcycle-tours/${slug}`} target="_blank" className={btnPrimary}>
            Voir sur le site <ExternalLink size={16} />
          </Link>
        ) : (
          <button type="button" onClick={publish} disabled={publishing || !hasDraft} className={btnPrimary}>
            <Rocket size={16} /> {publishing ? 'Mise en ligne…' : 'Mettre en ligne'}
          </button>
        )}
      </header>

      {status && (
        <p role="alert" className="bg-red-50 text-red-700 text-sm font-medium px-4 py-2 border-b border-red-200">
          {status}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-auto flex justify-center p-0 sm:p-4">
        <iframe
          key={src}
          src={src}
          title={`Aperçu de ${name} en ${LOCALE_LABELS[lang]}`}
          className={`bg-white h-full border-0 sm:rounded-xl sm:shadow-lg transition-[width] duration-300 ${
            device === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
          }`}
        />
      </div>
    </div>
  );
}
