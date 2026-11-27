'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRICING, PRICING_MODELS, fetchPricing } from '@/lib/pricing';
import PeriodsEditor, { ViewSwitch } from './PeriodsEditor';

const MODELS = {
  Himalayan: { name: 'Royal Enfield Himalayan', cc: '450 cc' },
  CFMoto700: { name: 'CF Moto 700 CL-X', cc: '700 cc' },
};
const BASE_DAYS = 2; // durée minimale de location : c'est elle qui sert de prix de référence

const fmt = (n) => `${(Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
// La ligne « 1 jour » n'est pas affichée : on ne loue pas à la journée, elle suit toujours le prix de 2 jours.
const toRows = (tiers) => tiers.filter((t) => t.days >= BASE_DAYS).map((t) => ({ days: String(t.days), price: String(t.price) }));
const clone = (x) => JSON.parse(JSON.stringify(x));

const focus = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2';
const input = 'rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold tabular-nums hover:border-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/25';

export default function PricingEditor() {
  const [saved, setSaved] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [model, setModel] = useState(PRICING_MODELS[0]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [simDays, setSimDays] = useState('5');
  const [curve, setCurve] = useState({});
  const [view, setView] = useState('standard');

  useEffect(() => {
    fetchPricing().then((p) => {
      const rows = {};
      for (const m of PRICING_MODELS) rows[m] = toRows(p[m] ?? DEFAULT_PRICING[m]);
      setPricing(rows);
      setSaved(clone(rows));
    });
  }, []);

  const rows = useMemo(() => pricing?.[model] ?? [], [pricing, model]);
  const dirty = !!pricing && JSON.stringify(pricing[model]) !== JSON.stringify(saved[model]);

  const problems = useMemo(() => {
    const seen = new Set();
    return rows.map((r) => {
      const d = Number(r.days), p = Number(r.price);
      if (!Number.isInteger(d) || d < BASE_DAYS) return `La durée doit être d’au moins ${BASE_DAYS} jours.`;
      if (r.price === '' || !Number.isFinite(p) || p < 0) return 'Saisissez un prix.';
      if (seen.has(d)) return 'Cette durée existe déjà.';
      seen.add(d);
      return null;
    });
  }, [rows]);
  const hasProblems = problems.some(Boolean) || !rows.some((r) => Number(r.days) === BASE_DAYS);

  if (view === 'periods') return <PeriodsEditor view={view} onViewChange={setView} />;
  if (!pricing) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Chargement…</div>;

  const setRows = (next) => { setPricing({ ...pricing, [model]: next }); setCurve({ ...curve, [model]: null }); setStatus(null); };
  const update = (i, key, v) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const remove = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const add = () => setRows([...rows, { days: String(Math.max(BASE_DAYS, ...rows.map((r) => Number(r.days) || 0)) + 1), price: '' }]);
  const sortRows = () => {
    const s = [...rows].sort((a, b) => Number(a.days) - Number(b.days));
    if (JSON.stringify(s) !== JSON.stringify(rows)) setRows(s);
  };
  const restore = () => {
    if (window.confirm('Remettre les prix d’origine pour cette moto ? Rien n’est publié tant que vous n’enregistrez pas.'))
      setRows(toRows(DEFAULT_PRICING[model]));
  };

  // Le prix de 2 jours pilote toute la grille : chaque durée garde son ratio.
  const baseRow = rows.find((r) => Number(r.days) === BASE_DAYS);
  const setBase = (value) => {
    const ref = curve[model] ?? rows;
    const refBase = Number(ref.find((r) => Number(r.days) === BASE_DAYS)?.price);
    if (!curve[model]) setCurve({ ...curve, [model]: rows });
    const v = Number(value);
    if (value === '' || !Number.isFinite(v) || v < 0 || !refBase) {
      setPricing({ ...pricing, [model]: rows.map((r) => (r === baseRow ? { ...r, price: value } : r)) });
      return;
    }
    setPricing({ ...pricing, [model]: ref.map((r) => ({ ...r, price: String(Math.round((Number(r.price) * v) / refBase)) })) });
    setStatus(null);
  };

  const save = async () => {
    setSaving(true); setStatus(null);
    try {
      const tiers = rows.map((r) => ({ days: Number(r.days), price: Number(r.price) })).sort((a, b) => a.days - b.days);
      const base = tiers.find((t) => t.days === BASE_DAYS);
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, tiers: [{ days: 1, price: base.price }, ...tiers] }), // 1 jour = prix de 2 jours
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? 'Session expirée : reconnectez-vous.' : data.error || 'Échec de l’enregistrement.');
      const fresh = toRows(tiers);
      setPricing({ ...pricing, [model]: fresh });
      setSaved({ ...saved, [model]: fresh });
      setCurve({ ...curve, [model]: null });
      setStatus({ type: 'ok', text: 'Prix enregistrés et en ligne.' });
    } catch (e) { setStatus({ type: 'error', text: e.message }); }
    finally { setSaving(false); }
  };

  // Même règle que la page de réservation (1 jour = prix de 2 jours).
  const sim = (() => {
    const days = Number(simDays);
    const tiers = rows.filter((r) => r.price !== '' && Number(r.days) >= BASE_DAYS)
      .map((r) => ({ days: Number(r.days), price: Number(r.price) })).sort((a, b) => a.days - b.days);
    if (!days || days < 1 || tiers.length === 0) return null;
    let base = tiers.find((t) => t.days === days)?.price ?? tiers.find((t) => t.days > days)?.price;
    if (base == null) { const l = tiers[tiers.length - 1]; base = Math.round((l.price / l.days) * days); }
    const r2 = (n) => Math.round(n * 100) / 100;
    const sub = r2(base * 1.07);
    return r2(sub + r2(sub * 0.035));
  })();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">Tarifs de location</h1>
          <a href="/admin/ok" className={`text-sm text-gray-500 hover:text-gray-900 rounded ${focus}`}>← Tableau de bord</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 pb-36 space-y-6">
        <ViewSwitch view={view} onChange={setView} />

        {/* Moto */}
        <div role="tablist" aria-label="Moto" className="flex gap-2 flex-wrap">
          {PRICING_MODELS.map((m) => {
            const active = m === model;
            const changed = JSON.stringify(pricing[m]) !== JSON.stringify(saved[m]);
            return (
              <button key={m} type="button" role="tab" aria-selected={active}
                onClick={() => { setModel(m); setStatus(null); }}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${focus} ${
                  active ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                {MODELS[m].name}{changed && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-500 align-middle" title="Non enregistré" />}
              </button>
            );
          })}
        </div>

        {/* Prix de base */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <label htmlFor="base" className="font-semibold">Prix pour {BASE_DAYS} jours</label>
          <p className="text-sm text-gray-500 mt-1">C’est la location minimale. Changez-le : toutes les autres durées suivent, avec les mêmes remises.</p>
          <div className="relative mt-4 max-w-xs">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-semibold">$</span>
            <input id="base" type="number" inputMode="decimal" min="0" step="1" value={baseRow?.price ?? ''}
              onChange={(e) => setBase(e.target.value)} className={`${input} w-full pl-10 pr-4 py-3 text-3xl`} />
          </div>
        </section>

        {/* Grille */}
        <section className="bg-white rounded-2xl border border-gray-200">
          <div className="p-6 pb-3">
            <h2 className="font-semibold">Prix selon la durée</h2>
            <p className="text-sm text-gray-500 mt-1">Prix total de la location, avant taxes et frais.</p>
          </div>
          <ul>
            {rows.map((r, i) => {
              const perDay = Number(r.days) > 0 && r.price !== '' ? Number(r.price) / Number(r.days) : null;
              return (
                <li key={i} className={`border-t border-gray-100 px-6 py-3 ${problems[i] ? 'bg-red-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-28 shrink-0">
                      <input type="number" inputMode="numeric" min={BASE_DAYS} step="1" value={r.days} aria-label="Nombre de jours"
                        onChange={(e) => update(i, 'days', e.target.value)} onBlur={sortRows}
                        className={`${input} w-full pl-3 pr-14 py-2.5`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">jours</span>
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                      <input type="number" inputMode="decimal" min="0" step="0.01" value={r.price} aria-label={`Prix pour ${r.days} jours`}
                        onChange={(e) => update(i, 'price', e.target.value)} className={`${input} w-full pl-7 pr-3 py-2.5`} />
                    </div>
                    <span className="hidden sm:block w-28 text-right text-sm text-gray-400 tabular-nums">{perDay != null ? `${fmt(perDay)} / jour` : ''}</span>
                    <button type="button" onClick={() => remove(i)} aria-label={`Supprimer ${r.days} jours`} title="Supprimer"
                      className={`w-9 h-9 shrink-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 ${focus}`}>✕</button>
                  </div>
                  {problems[i] && <p role="alert" className="mt-1.5 text-sm font-medium text-red-600">{problems[i]}</p>}
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
            <button type="button" onClick={add} className={`text-sm font-semibold text-yellow-700 hover:text-yellow-800 rounded ${focus}`}>+ Ajouter une durée</button>
            <button type="button" onClick={restore} className={`text-sm text-gray-400 hover:text-gray-700 rounded ${focus}`}>Remettre les prix d’origine</button>
          </div>
        </section>

        {/* Essai */}
        <section className="rounded-2xl bg-yellow-50 border border-yellow-200 px-6 py-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-medium">Pour</span>
          <input type="number" min="1" value={simDays} onChange={(e) => setSimDays(e.target.value)} aria-label="Nombre de jours à tester"
            className={`${input} w-20 text-center py-2`} />
          <span className="font-medium">jours, le client paie</span>
          <span className="text-xl font-bold tabular-nums">{sim != null ? fmt(sim) : '—'}</span>
          <span className="text-sm text-gray-500">TVA et frais de carte inclus</span>
        </section>
      </main>

      {/* Enregistrement */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0 text-sm" role="status" aria-live="polite">
            {status ? <span className={`font-semibold ${status.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{status.text}</span>
              : hasProblems ? <span className="text-red-600 font-medium">Corrigez les lignes en rouge pour enregistrer.</span>
              : dirty ? <span className="text-gray-700">Modifications non enregistrées</span>
              : <span className="text-gray-400">Aucune modification</span>}
          </div>
          {dirty && <button type="button" onClick={() => setRows(clone(saved[model]))} className={`px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 ${focus}`}>Annuler</button>}
          <button type="button" onClick={save} disabled={!dirty || hasProblems || saving}
            className={`px-6 py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${focus}`}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
