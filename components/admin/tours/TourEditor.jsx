'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, ExternalLink, ImagePlus, Loader2, Plus, Rocket, Star, Trash2, X,
} from 'lucide-react';
import { COPY_LOCALES, LOCALE_LABELS } from '@/lib/tours-shared';
import { uploadTourPhoto } from './photos';
import { btnGhost, btnPrimary, btnSecondary, field, focus, priceFmt } from './ui';

const TABS = [
  ['photos', 'Photos'],
  ['textes', 'Textes'],
  ['infos', 'Prix & infos'],
];

const clone = (x) => JSON.parse(JSON.stringify(x));
const move = (list, i, d) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

function Field({ id, label, hint, count, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold text-sm">{label}</label>
        {count}
      </div>
      {hint && <p className="text-sm text-gray-500 mt-0.5">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const Card = ({ title, hint, children, action }) => (
  <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const IconBtn = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${focus} ${
      danger ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

const Counter = ({ value, max, soft }) => (
  <span className={`text-xs tabular-nums ${value > soft ? 'text-amber-600' : 'text-gray-400'}`}>{value}/{max}</span>
);

export default function TourEditor({ tourId, info, initial, initialHasDraft }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [hasDraft, setHasDraft] = useState(initialHasDraft);
  const [neverPublished, setNeverPublished] = useState(info.neverPublished);
  const [tab, setTab] = useState('photos');
  const [lang, setLang] = useState('fr');
  const [busy, setBusy] = useState(null); // 'save' | 'preview' | 'publish' | 'discard'
  const [status, setStatus] = useState(null);
  const [uploads, setUploads] = useState([]); // placeholders while photos are uploading
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInput = useRef(null);
  const heroInput = useRef(null);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(saved), [state, saved]);
  const copy = state.copy[lang];
  const uploading = uploads.length > 0;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const edit = useCallback((fn) => {
    setState((s) => { const next = clone(s); fn(next); return next; });
    setStatus(null);
  }, []);
  const editCopy = (fn) => edit((s) => fn(s.copy[lang]));
  const setText = (key) => (e) => editCopy((c) => { c[key] = e.target.value; });

  const langChanged = (l) => JSON.stringify(state.copy[l]) !== JSON.stringify(saved.copy[l]);

  // ---------- photos ----------
  const addFiles = async (files) => {
    const list = [...files].filter(Boolean);
    if (!list.length) return;
    const errors = [];
    await Promise.all(list.map(async (file) => {
      const key = `${file.name}-${Math.random()}`;
      setUploads((u) => [...u, key]);
      try {
        const src = await uploadTourPhoto(tourId, file);
        edit((s) => { s.gallery.push({ id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src, alt: '', credit: '', url: '' }); });
      } catch (e) {
        errors.push(e.message);
      } finally {
        setUploads((u) => u.filter((k) => k !== key));
      }
    }));
    if (errors.length) setStatus({ type: 'error', text: errors[0] });
  };

  const replaceHero = async (file) => {
    if (!file) return;
    const key = 'hero';
    setUploads((u) => [...u, key]);
    try {
      const src = await uploadTourPhoto(tourId, file);
      edit((s) => { s.image = src; });
    } catch (e) {
      setStatus({ type: 'error', text: e.message });
    } finally {
      setUploads((u) => u.filter((k) => k !== key));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ---------- saving ----------
  const validate = () => {
    if (!(Number(state.price) >= 0) || state.price === '') return 'Indiquez un prix.';
    for (const l of COPY_LOCALES) {
      if (!state.copy[l].name.trim()) return `Le nom du tour est vide en ${LOCALE_LABELS[l]}.`;
    }
    if (state.structure) {
      const d = Number(state.structure.days);
      if (!Number.isInteger(d) || d < 1 || d > 60) return 'La durée doit être de 1 à 60 jours.';
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(state.structure.slug)) return 'L’adresse de la page ne peut contenir que des lettres minuscules, des chiffres et des tirets.';
    }
    if (uploading) return 'Patientez : des photos sont encore en cours d’envoi.';
    return null;
  };

  const call = async (action, withContent = true) => {
    const res = await fetch(`/api/admin/tours/${tourId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, content: withContent ? state : undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Échec de l’enregistrement.');
    return data;
  };

  const run = async (kind, fn) => {
    const problem = kind === 'discard' ? null : validate();
    if (problem) { setStatus({ type: 'error', text: problem }); return; }
    setBusy(kind);
    setStatus(null);
    try { await fn(); } catch (e) { setStatus({ type: 'error', text: e.message }); } finally { setBusy(null); }
  };

  const save = () => run('save', async () => {
    await call('save');
    setSaved(clone(state)); setHasDraft(true);
    setStatus({ type: 'ok', text: 'Brouillon enregistré. Pas encore en ligne.' });
  });

  const preview = () => run('preview', async () => {
    if (dirty || !hasDraft) await call('save');
    setSaved(clone(state)); setHasDraft(true);
    router.push(`/admin/lostoursdeclems/${tourId}/preview?lang=${lang}`);
  });

  const publish = () => {
    if (!window.confirm('Mettre ce tour en ligne ? Les visiteurs du site verront ces modifications tout de suite.')) return;
    run('publish', async () => {
      await call('publish');
      setSaved(clone(state)); setHasDraft(false); setNeverPublished(false);
      setStatus({ type: 'ok', text: 'C’est en ligne !' });
    });
  };

  const discard = () => {
    if (!window.confirm('Annuler toutes les modifications non publiées de ce tour ? Vous reviendrez à la version actuellement en ligne.')) return;
    run('discard', async () => {
      const { state: published } = await call('discard', false);
      setState(published); setSaved(published); setHasDraft(false);
      setStatus({ type: 'ok', text: 'Retour à la version en ligne.' });
    });
  };

  const remove = async () => {
    if (!window.confirm('Supprimer définitivement ce tour (textes, photos et prix) ? Il disparaîtra du site.')) return;
    setBusy('delete');
    try {
      await call('delete', false);
      router.push('/admin/lostoursdeclems');
    } catch (e) {
      setStatus({ type: 'error', text: e.message });
      setBusy(null);
    }
  };

  const days = state.structure?.days ?? info.days;
  const stops = state.structure?.stops ?? [];
  const name = saved.copy.fr.name || tourId;
  const pending = dirty || hasDraft;

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 pt-4">
          <Link href="/admin/lostoursdeclems" className={`${btnGhost} -ml-3`}>
            <ArrowLeft size={16} /> Tous les tours
          </Link>
          <div className="flex items-center justify-between gap-4 mt-1 mb-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{name}</h1>
              <p className="text-sm text-gray-500">{days} jours · {Math.max(0, days - 1)} nuits</p>
            </div>
            <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${pending ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
              {neverPublished ? 'Nouveau · pas en ligne' : pending ? 'Modifications non publiées' : 'En ligne'}
            </span>
          </div>
          <div role="tablist" aria-label="Sections" className="flex gap-1 -mb-px">
            {TABS.map(([key, label]) => (
              <button
                key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${focus} ${
                  tab === key ? 'border-yellow-400 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 pb-44 space-y-5">
        {/* ================= PHOTOS ================= */}
        {tab === 'photos' && (
          <div role="tabpanel" id="panel-photos" aria-labelledby="tab-photos" className="space-y-5">
            <Card title="Photo principale" hint="La grande photo en haut de la page du tour, et sur la carte du tour. Idéalement un paysage horizontal.">
              <div className="relative aspect-[16/7] rounded-xl overflow-hidden bg-gray-100">
                <Image src={state.image} alt="Photo principale" fill sizes="768px" className="object-cover" unoptimized={state.image.startsWith('http')} />
                {uploads.includes('hero') && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center gap-2 font-semibold"><Loader2 className="animate-spin" size={20} /> Envoi…</div>
                )}
              </div>
              <input ref={heroInput} type="file" accept="image/*" hidden onChange={(e) => { replaceHero(e.target.files[0]); e.target.value = ''; }} />
              <button type="button" onClick={() => heroInput.current.click()} className={`${btnSecondary} mt-4`}>
                <ImagePlus size={18} /> Changer la photo principale
              </button>
            </Card>

            <Card title={`Galerie (${state.gallery.length} photos)`} hint="Les photos affichées plus bas sur la page, dans cet ordre. Ajoutez-en autant que vous voulez.">
              <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${dragging ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'}`}
              >
                <button type="button" onClick={() => fileInput.current.click()} className={btnPrimary}>
                  <ImagePlus size={18} /> Ajouter des photos
                </button>
                <p className="text-sm text-gray-500 mt-3">ou glissez-les ici. Plusieurs d’un coup, c’est possible. Elles sont réduites automatiquement.</p>
              </div>

              <ul className="grid sm:grid-cols-2 gap-4 mt-5">
                {state.gallery.map((photo, i) => (
                  <li key={photo.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white flex flex-col">
                    <div className="relative aspect-[3/2] bg-gray-100">
                      <Image src={photo.src} alt={photo.alt || `Photo ${i + 1}`} fill sizes="360px" className="object-cover" unoptimized={photo.src.startsWith('http')} />
                      <span className="absolute top-2 left-2 bg-white/90 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{i + 1}</span>
                      {state.image === photo.src && (
                        <span className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold rounded-full px-2.5 py-1 inline-flex items-center gap-1"><Star size={12} /> Principale</span>
                      )}
                    </div>
                    <div className="p-3 space-y-2 flex-1">
                      <label className="sr-only" htmlFor={`alt-${photo.id}`}>Description de la photo {i + 1}</label>
                      <input id={`alt-${photo.id}`} type="text" value={photo.alt} placeholder="Description (ex. Plage de Santa Catalina)"
                        onChange={(e) => edit((s) => { s.gallery[i].alt = e.target.value; })} className={`${field} px-3 py-2 text-sm`} />
                      <label className="sr-only" htmlFor={`credit-${photo.id}`}>Crédit de la photo {i + 1}</label>
                      <input id={`credit-${photo.id}`} type="text" value={photo.credit} placeholder="Crédit photo (facultatif)"
                        onChange={(e) => edit((s) => { s.gallery[i].credit = e.target.value; })} className={`${field} px-3 py-2 text-xs`} />
                    </div>
                    <div className="border-t border-gray-100 px-2 py-1.5 flex items-center gap-0.5">
                      <IconBtn label="Déplacer avant" disabled={i === 0} onClick={() => edit((s) => { s.gallery = move(s.gallery, i, -1); })}><ArrowLeft size={17} /></IconBtn>
                      <IconBtn label="Déplacer après" disabled={i === state.gallery.length - 1} onClick={() => edit((s) => { s.gallery = move(s.gallery, i, 1); })}><ArrowRight size={17} /></IconBtn>
                      <IconBtn label="Utiliser comme photo principale" disabled={state.image === photo.src} onClick={() => edit((s) => { s.image = photo.src; })}><Star size={17} /></IconBtn>
                      <span className="flex-1" />
                      {confirmDelete === photo.id ? (
                        <span className="flex items-center gap-1 text-sm">
                          <button type="button" onClick={() => { edit((s) => { s.gallery.splice(i, 1); }); setConfirmDelete(null); }} className={`px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold ${focus}`}>Supprimer</button>
                          <button type="button" onClick={() => setConfirmDelete(null)} className={btnGhost}>Non</button>
                        </span>
                      ) : (
                        <IconBtn label="Supprimer cette photo" danger onClick={() => setConfirmDelete(photo.id)}><Trash2 size={17} /></IconBtn>
                      )}
                    </div>
                  </li>
                ))}
                {uploads.filter((u) => u !== 'hero').map((u) => (
                  <li key={u} className="rounded-xl border border-dashed border-gray-300 aspect-[3/2] flex items-center justify-center gap-2 text-gray-500 text-sm font-medium">
                    <Loader2 className="animate-spin" size={18} /> Envoi en cours…
                  </li>
                ))}
              </ul>
              {state.gallery.length === 0 && !uploading && <p className="text-sm text-gray-400 mt-4 text-center">Aucune photo dans la galerie.</p>}
            </Card>
          </div>
        )}

        {/* ================= TEXTES ================= */}
        {tab === 'textes' && (
          <div role="tabpanel" id="panel-textes" aria-labelledby="tab-textes" className="space-y-5">
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-5 py-4">
              <p className="font-semibold text-sm">Langue du texte que vous modifiez</p>
              <div role="group" aria-label="Langue" className="flex flex-wrap gap-2 mt-3">
                {COPY_LOCALES.map((l) => (
                  <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${focus} ${lang === l ? 'bg-yellow-400 border-yellow-400' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                    {LOCALE_LABELS[l]}
                    {langChanged(l) && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-500 align-middle" title="Modifié" />}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">Chaque langue se modifie séparément : le site affiche la langue de chaque visiteur.</p>
            </div>

            <Card title="Présentation">
              <div className="space-y-5">
                <Field id="name" label="Nom du tour"><input id="name" type="text" value={copy.name} onChange={setText('name')} className={`${field} px-4 py-3 font-semibold`} /></Field>
                <Field id="tagline" label="Slogan" hint="La ligne sous le titre, tout en haut de la page."><input id="tagline" type="text" value={copy.tagline} onChange={setText('tagline')} className={`${field} px-4 py-3`} /></Field>
                <Field id="route" label="Itinéraire en bref" hint="Les étapes, séparées par « · ». Affiché sur la carte du tour."><input id="route" type="text" value={copy.route} onChange={setText('route')} className={`${field} px-4 py-3`} /></Field>
                <Field id="intro" label="Texte de présentation"><textarea id="intro" rows={6} value={copy.intro} onChange={setText('intro')} className={`${field} px-4 py-3 leading-relaxed`} /></Field>
              </div>
            </Card>

            <Card title="Points forts" hint="Les atouts du tour, en une ligne chacun."
              action={<button type="button" onClick={() => editCopy((c) => { c.highlights.push(''); })} className={btnGhost}><Plus size={16} /> Ajouter</button>}>
              <ul className="space-y-2">
                {copy.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <input type="text" aria-label={`Point fort ${i + 1}`} value={h} onChange={(e) => editCopy((c) => { c.highlights[i] = e.target.value; })} className={`${field} px-3 py-2.5 flex-1 min-w-0`} />
                    <IconBtn label="Monter" disabled={i === 0} onClick={() => editCopy((c) => { c.highlights = move(c.highlights, i, -1); })}><ArrowUp size={16} /></IconBtn>
                    <IconBtn label="Descendre" disabled={i === copy.highlights.length - 1} onClick={() => editCopy((c) => { c.highlights = move(c.highlights, i, 1); })}><ArrowDown size={16} /></IconBtn>
                    <IconBtn label="Supprimer" danger onClick={() => editCopy((c) => { c.highlights.splice(i, 1); })}><X size={16} /></IconBtn>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Programme jour par jour"
              action={<button type="button" onClick={() => editCopy((c) => { c.days.push({ title: '', body: '' }); })} className={btnGhost}><Plus size={16} /> Ajouter un jour</button>}>
              <ol className="space-y-4">
                {copy.days.map((d, i) => (
                  <li key={i} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</span>
                      <input type="text" aria-label={`Titre du jour ${i + 1}`} value={d.title} placeholder="Titre (ex. Panama City → Valle de Antón)"
                        onChange={(e) => editCopy((c) => { c.days[i].title = e.target.value; })} className={`${field} px-3 py-2.5 font-semibold flex-1 min-w-0`} />
                      <IconBtn label="Monter" disabled={i === 0} onClick={() => editCopy((c) => { c.days = move(c.days, i, -1); })}><ArrowUp size={16} /></IconBtn>
                      <IconBtn label="Descendre" disabled={i === copy.days.length - 1} onClick={() => editCopy((c) => { c.days = move(c.days, i, 1); })}><ArrowDown size={16} /></IconBtn>
                      <IconBtn label="Supprimer ce jour" danger onClick={() => { if (window.confirm(`Supprimer le jour ${i + 1} ?`)) editCopy((c) => { c.days.splice(i, 1); }); }}><Trash2 size={16} /></IconBtn>
                    </div>
                    <textarea aria-label={`Description du jour ${i + 1}`} rows={4} value={d.body}
                      onChange={(e) => editCopy((c) => { c.days[i].body = e.target.value; })} className={`${field} px-3 py-2.5 leading-relaxed`} />
                  </li>
                ))}
              </ol>
            </Card>

            <Card title="Questions fréquentes"
              action={<button type="button" onClick={() => editCopy((c) => { c.faq.push({ q: '', a: '' }); })} className={btnGhost}><Plus size={16} /> Ajouter</button>}>
              <ul className="space-y-4">
                {copy.faq.map((f, i) => (
                  <li key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
                    <div className="flex items-center gap-1">
                      <input type="text" aria-label={`Question ${i + 1}`} value={f.q} placeholder="Question"
                        onChange={(e) => editCopy((c) => { c.faq[i].q = e.target.value; })} className={`${field} px-3 py-2.5 font-semibold flex-1 min-w-0`} />
                      <IconBtn label="Monter" disabled={i === 0} onClick={() => editCopy((c) => { c.faq = move(c.faq, i, -1); })}><ArrowUp size={16} /></IconBtn>
                      <IconBtn label="Descendre" disabled={i === copy.faq.length - 1} onClick={() => editCopy((c) => { c.faq = move(c.faq, i, 1); })}><ArrowDown size={16} /></IconBtn>
                      <IconBtn label="Supprimer" danger onClick={() => editCopy((c) => { c.faq.splice(i, 1); })}><Trash2 size={16} /></IconBtn>
                    </div>
                    <textarea aria-label={`Réponse ${i + 1}`} rows={3} value={f.a} placeholder="Réponse"
                      onChange={(e) => editCopy((c) => { c.faq[i].a = e.target.value; })} className={`${field} px-3 py-2.5 leading-relaxed`} />
                  </li>
                ))}
              </ul>
            </Card>

            <details className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 group">
              <summary className={`font-bold text-lg cursor-pointer rounded ${focus}`}>Référencement Google <span className="text-sm font-normal text-gray-500 ml-2">(avancé, facultatif)</span></summary>
              <div className="space-y-5 mt-5">
                <Field id="metaTitle" label="Titre dans Google" hint="Idéalement moins de 60 caractères." count={<Counter value={copy.metaTitle.length} max={60} soft={60} />}>
                  <input id="metaTitle" type="text" value={copy.metaTitle} onChange={setText('metaTitle')} className={`${field} px-4 py-3`} />
                </Field>
                <Field id="metaDescription" label="Description dans Google" hint="Idéalement moins de 160 caractères." count={<Counter value={copy.metaDescription.length} max={160} soft={160} />}>
                  <textarea id="metaDescription" rows={3} value={copy.metaDescription} onChange={setText('metaDescription')} className={`${field} px-4 py-3`} />
                </Field>
                <Field id="keywords" label="Mots-clés" hint="Séparés par des virgules.">
                  <input id="keywords" type="text" value={copy.keywords} onChange={setText('keywords')} className={`${field} px-4 py-3`} />
                </Field>
              </div>
            </details>
          </div>
        )}

        {/* ================= INFOS ================= */}
        {tab === 'infos' && (
          <div role="tabpanel" id="panel-infos" aria-labelledby="tab-infos" className="space-y-5">
            <Card title="Prix" hint="Le « à partir de » affiché sur la page du tour et sur sa carte.">
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-semibold">$</span>
                <input id="price" aria-label="Prix du tour en dollars" type="number" inputMode="decimal" min="0" step="1" value={state.price}
                  onChange={(e) => edit((s) => { s.price = e.target.value; })} className={`${field} pl-10 pr-4 py-3 text-3xl font-semibold tabular-nums`} />
              </div>
              {info.defaultPrice != null && Number(state.price) !== info.defaultPrice && (
                <p className="text-sm text-gray-500 mt-3">Prix d’origine : {priceFmt(info.defaultPrice)}</p>
              )}
            </Card>

            {info.builtin ? (
              <Card title="Ce qui ne se change pas ici" hint="Lié à la carte et au parcours. Pour le modifier, contactez Jérôme.">
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div><dt className="text-gray-500">Durée</dt><dd className="font-semibold">{info.days} jours · {info.nights} nuits</dd></div>
                  <div><dt className="text-gray-500">Moto</dt><dd className="font-semibold">Royal Enfield Himalayan 450</dd></div>
                  <div className="sm:col-span-2"><dt className="text-gray-500">Étapes sur la carte</dt><dd className="font-semibold">{info.stops.join(' → ')}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-gray-500">Adresse de la page</dt><dd className="font-mono text-xs break-all">/motorcycle-tours/{info.slug}</dd></div>
                </dl>
                <p className="text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100">
                  Les listes « Ce qui est inclus », « Non inclus » et « Options » sont communes à tous les tours.
                </p>
              </Card>
            ) : (
              <>
                <Card title="Durée" hint="Le nombre de nuits est calculé : durée moins un.">
                  <div className="relative w-40">
                    <input id="days" aria-label="Nombre de jours" type="number" inputMode="numeric" min="1" max="60" step="1" value={state.structure.days}
                      onChange={(e) => edit((s) => { s.structure.days = e.target.value === '' ? '' : Number(e.target.value); })}
                      className={`${field} pl-4 pr-16 py-3 text-xl font-semibold tabular-nums`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">jours</span>
                  </div>
                </Card>

                <Card title="Étapes sur la carte" hint="Dans l’ordre du parcours. La carte de la page du tour est tracée entre ces lieux. Sans étape, la carte n’est pas affichée.">
                  <ol className="space-y-2">
                    {stops.map((stop, i) => (
                      <li key={`${stop}-${i}`} className="flex items-center gap-1 rounded-xl border border-gray-200 pl-3">
                        <span className="w-7 h-7 rounded-full bg-yellow-400 text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="flex-1 font-semibold px-2">{info.places.find((p) => p.id === stop)?.name ?? stop}</span>
                        <IconBtn label="Monter" disabled={i === 0} onClick={() => edit((s) => { s.structure.stops = move(s.structure.stops, i, -1); })}><ArrowUp size={16} /></IconBtn>
                        <IconBtn label="Descendre" disabled={i === stops.length - 1} onClick={() => edit((s) => { s.structure.stops = move(s.structure.stops, i, 1); })}><ArrowDown size={16} /></IconBtn>
                        <IconBtn label="Retirer cette étape" danger onClick={() => edit((s) => { s.structure.stops.splice(i, 1); })}><X size={16} /></IconBtn>
                      </li>
                    ))}
                  </ol>
                  <label htmlFor="add-stop" className="sr-only">Ajouter une étape</label>
                  <select id="add-stop" value="" onChange={(e) => { if (e.target.value) edit((s) => { s.structure.stops.push(e.target.value); }); }}
                    className={`${field} mt-4 px-4 py-3 max-w-sm`}>
                    <option value="">+ Ajouter une étape…</option>
                    {info.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <p className="text-sm text-gray-500 mt-3">Un lieu qui n’est pas dans la liste ? Contactez Jérôme pour l’ajouter.</p>
                </Card>

                <Card title="Adresse de la page" hint={info.slugLocked ? 'Le tour est en ligne : son adresse ne change plus, pour ne pas casser les liens et Google.' : 'Choisie à partir du nom. Modifiable tant que le tour n’est pas en ligne.'}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 shrink-0">/motorcycle-tours/</span>
                    <input aria-label="Adresse de la page" type="text" value={state.structure.slug} disabled={info.slugLocked}
                      onChange={(e) => edit((s) => { s.structure.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'); })}
                      className={`${field} px-3 py-2.5 font-mono text-sm disabled:bg-gray-100 disabled:text-gray-500`} />
                  </div>
                </Card>

                <Card title="Supprimer ce tour" hint="Définitif : le tour, ses textes et son prix disparaissent du site.">
                  <button type="button" onClick={remove} disabled={!!busy}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50 ${focus}`}>
                    <Trash2 size={16} /> Supprimer ce tour
                  </button>
                </Card>
              </>
            )}
          </div>
        )}
      </main>

      {/* Actions */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="max-w-3xl mx-auto px-5 py-3 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          <div className="sm:flex-1 min-w-0 text-sm" role="status" aria-live="polite">
            {status ? (
              <span className={`font-semibold ${status.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{status.text}</span>
            ) : dirty ? (
              <span className="text-gray-700 font-medium">Modifications non enregistrées</span>
            ) : hasDraft ? (
              <span className="text-gray-600">Brouillon enregistré · pas encore en ligne</span>
            ) : (
              <span className="text-gray-400">Tout est en ligne</span>
            )}
            {pending && !busy && !neverPublished && (
              <button type="button" onClick={discard} className={`ml-3 text-gray-400 hover:text-red-600 underline underline-offset-2 rounded ${focus}`}>
                Annuler les modifications
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end">
            <button type="button" onClick={save} disabled={!!busy || !dirty} className={btnGhost}>
              {busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={preview} disabled={!!busy} className={btnSecondary}>
              <Eye size={18} /> {busy === 'preview' ? 'Ouverture…' : 'Aperçu'}
            </button>
            <button type="button" onClick={publish} disabled={!!busy || !pending} className={btnPrimary}>
              <Rocket size={18} /> {busy === 'publish' ? 'Mise en ligne…' : (<><span className="sm:hidden">Publier</span><span className="hidden sm:inline">Mettre en ligne</span></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
