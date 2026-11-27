'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRICING, PRICING_MODELS, computeRentalPrice, fetchPricingData, tiersForRental } from '@/lib/pricing';

const MODELS = {
  Himalayan: 'Royal Enfield Himalayan',
  CFMoto700: 'CF Moto 700 CL-X',
};
const BASE_DAYS = 2;
const COLORS = ['bg-amber-400', 'bg-sky-400', 'bg-emerald-400', 'bg-rose-400', 'bg-violet-400', 'bg-orange-400'];
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const focus = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2';
const input = 'rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold tabular-nums hover:border-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/25';
const fmt = (n) => `${(Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $`;
const clone = (x) => JSON.parse(JSON.stringify(x));

const toDate = (s) => new Date(`${s}T12:00:00`);
const fmtDate = (s) => (s ? toDate(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const dayCount = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000) + 1;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Grids in editor state keep prices as strings (inputs); the 1-day line is never shown.
const toRows = (tiers) => tiers.filter((t) => t.days >= BASE_DAYS).map((t) => ({ days: t.days, price: String(t.price) }));
const toNumeric = (rows) => rows.map((r) => ({ days: Number(r.days), price: Number(r.price) }));

export function ViewSwitch({ view, onChange }) {
  const tab = (id, label) => (
    <button type="button" role="tab" aria-selected={view === id} onClick={() => onChange(id)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${focus} ${view === id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      {label}
    </button>
  );
  return (
    <div role="tablist" aria-label="Type de tarifs" className="flex gap-1 p-1 bg-white border border-gray-200 rounded-full w-fit">
      {tab('standard', 'Prix standard')}
      {tab('periods', 'Périodes')}
    </div>
  );
}

export default function PeriodsEditor({ view, onViewChange }) {
  const [standard, setStandard] = useState(null);
  const [periods, setPeriods] = useState(null);
  const [saved, setSaved] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState({ date: '', days: '5' });

  useEffect(() => {
    fetchPricingData().then(({ pricing, periods: list }) => {
      setStandard(pricing);
      const p = list.map((x) => ({
        id: x.id, name: x.name, start_date: x.start_date, end_date: x.end_date,
        tiers: Object.fromEntries(Object.entries(x.tiers ?? {}).map(([m, g]) => [m, toRows(g)])),
      }));
      setPeriods(p);
      setSaved(clone(p));
    });
  }, []);

  const sorted = useMemo(() => [...(periods ?? [])].sort((a, b) => (a.start_date || '9').localeCompare(b.start_date || '9')), [periods]);
  const dirty = !!periods && JSON.stringify(periods) !== JSON.stringify(saved);

  // One message per period (or null).
  const problems = useMemo(() => {
    const out = {};
    sorted.forEach((p, i) => {
      if (!p.name.trim()) out[p.id] = 'Donnez un nom à la période.';
      else if (!p.start_date || !p.end_date) out[p.id] = 'Choisissez la date de début et de fin.';
      else if (p.end_date < p.start_date) out[p.id] = 'La fin doit être après le début.';
      else {
        const clash = sorted.find((q, j) => j !== i && q.start_date && q.end_date && q.start_date <= p.end_date && p.start_date <= q.end_date);
        if (clash) out[p.id] = `Chevauche « ${clash.name || 'sans nom'} » (${fmtDate(clash.start_date)} → ${fmtDate(clash.end_date)}). Une date ne peut avoir qu’un seul tarif.`;
        else {
          for (const m of Object.keys(p.tiers)) {
            const bad = p.tiers[m].some((r) => r.price === '' || !Number.isFinite(Number(r.price)) || Number(r.price) < 0);
            if (bad) { out[p.id] = `Un prix est vide pour ${MODELS[m]}.`; break; }
          }
        }
      }
    });
    return out;
  }, [sorted]);
  const hasProblems = Object.keys(problems).length > 0;

  if (!periods) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Chargement…</div>;

  const patch = (id, change) => { setPeriods(periods.map((p) => (p.id === id ? { ...p, ...change } : p))); setStatus(null); };
  const setGrid = (p, model, rows) => patch(p.id, { tiers: { ...p.tiers, [model]: rows } });
  const dropGrid = (p, model) => { const t = { ...p.tiers }; delete t[model]; patch(p.id, { tiers: t }); };

  const addPeriod = () => {
    const id = crypto.randomUUID();
    setPeriods([...periods, {
      id, name: '', start_date: '', end_date: '',
      tiers: Object.fromEntries(PRICING_MODELS.map((m) => [m, toRows(standard[m])])),
    }]);
    setOpenId(id); setStatus(null);
  };
  const duplicate = (p) => {
    const shift = (s) => (s ? `${Number(s.slice(0, 4)) + 1}${s.slice(4)}` : '');
    const id = crypto.randomUUID();
    setPeriods([...periods, { ...clone(p), id, name: p.name, start_date: shift(p.start_date), end_date: shift(p.end_date) }]);
    setOpenId(id); setStatus(null);
  };
  const remove = (p) => {
    if (!window.confirm(`Supprimer « ${p.name || 'cette période'} » ? Les prix standard s’appliqueront à ces dates une fois enregistré.`)) return;
    setPeriods(periods.filter((x) => x.id !== p.id)); setStatus(null);
  };

  const applyPercent = (p, model, pct) => {
    const f = 1 + pct / 100;
    setGrid(p, model, toRows(standard[model]).map((r) => ({ ...r, price: String(Math.round(Number(r.price) * f)) })));
  };
  const setBase = (p, model, value) => {
    const rows = p.tiers[model];
    const refBase = Number(rows.find((r) => r.days === BASE_DAYS)?.price);
    const v = Number(value);
    if (value === '' || !Number.isFinite(v) || v < 0 || !refBase) {
      setGrid(p, model, rows.map((r) => (r.days === BASE_DAYS ? { ...r, price: value } : r)));
    } else {
      setGrid(p, model, rows.map((r) => ({ ...r, price: String(Math.round((Number(r.price) * v) / refBase)) })));
    }
  };

  const save = async () => {
    setSaving(true); setStatus(null);
    try {
      const body = sorted.map((p) => ({
        id: p.id, name: p.name.trim(), start_date: p.start_date, end_date: p.end_date,
        tiers: Object.fromEntries(Object.entries(p.tiers).map(([m, rows]) => {
          const t = toNumeric(rows).sort((a, b) => a.days - b.days);
          const base = t.find((x) => x.days === BASE_DAYS);
          return [m, base ? [{ days: 1, price: base.price }, ...t] : t];
        })),
      }));
      const res = await fetch('/api/admin/pricing/periods', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periods: body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? 'Session expirée : reconnectez-vous.' : data.error || 'Échec de l’enregistrement.');
      setSaved(clone(periods));
      setStatus({ type: 'ok', text: 'Périodes enregistrées et en ligne.' });
    } catch (e) { setStatus({ type: 'error', text: e.message }); }
    finally { setSaving(false); }
  };

  // Aperçu : même règle que la page de réservation (la date de départ décide de la grille).
  const preview = (() => {
    const days = Number(test.days);
    if (!test.date || !days || days < 1) return null;
    const live = toPeriodsForLookup(sorted);
    const period = live.find((p) => p.start_date <= test.date && test.date <= p.end_date) ?? null;
    return {
      period,
      prices: PRICING_MODELS.map((m) => [m, computeRentalPrice(tiersForRental(standard, live, m, test.date), days)]),
    };
  })();

  const colorOf = (id) => COLORS[sorted.findIndex((p) => p.id === id) % COLORS.length];
  const yStart = `${year}-01-01`, yEnd = `${year}-12-31`;
  const yDays = dayCount(yStart, yEnd);
  const today = todayStr();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">Tarifs de location</h1>
          <a href="/admin/ok" className={`text-sm text-gray-500 hover:text-gray-900 rounded ${focus}`}>← Tableau de bord</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 pb-36 space-y-6">
        <ViewSwitch view={view} onChange={onViewChange} />

        <p className="text-sm text-gray-600">
          Hors périodes, les <strong>prix standard</strong> s’appliquent. Pour chaque période, choisissez des dates et des prix.
          Le tarif dépend de la <strong>date de départ</strong> de la location.
        </p>

        {/* Calendrier annuel */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setYear(year - 1)} aria-label="Année précédente" className={`w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 ${focus}`}>‹</button>
            <h2 className="font-semibold tabular-nums">{year}</h2>
            <button type="button" onClick={() => setYear(year + 1)} aria-label="Année suivante" className={`w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 ${focus}`}>›</button>
          </div>
          <div className="relative h-10 rounded-lg bg-gray-100 overflow-hidden">
            {sorted.filter((p) => p.start_date && p.end_date && p.end_date >= p.start_date && p.start_date <= yEnd && p.end_date >= yStart).map((p) => {
              const s = p.start_date < yStart ? yStart : p.start_date;
              const e = p.end_date > yEnd ? yEnd : p.end_date;
              const left = ((dayCount(yStart, s) - 1) / yDays) * 100;
              const width = (dayCount(s, e) / yDays) * 100;
              return (
                <button key={p.id} type="button" onClick={() => setOpenId(p.id)} title={`${p.name || 'Sans nom'} · ${fmtDate(p.start_date)} → ${fmtDate(p.end_date)}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  className={`absolute inset-y-0 ${colorOf(p.id)} border-x border-white/60 text-[11px] font-bold text-gray-900 overflow-hidden whitespace-nowrap px-1 ${focus}`}>
                  {p.name}
                </button>
              );
            })}
            {today >= yStart && today <= yEnd && (
              <div className="absolute inset-y-0 w-0.5 bg-gray-900 pointer-events-none" style={{ left: `${((dayCount(yStart, today) - 1) / yDays) * 100}%` }} title="Aujourd’hui" />
            )}
          </div>
          <div className="flex mt-1.5" aria-hidden="true">
            {MONTHS.map((m) => <span key={m} className="flex-1 text-[10px] text-gray-400 text-center">{m}</span>)}
          </div>
          <p className="text-xs text-gray-400 mt-2">Zones grises : prix standard.</p>
        </section>

        {/* Liste */}
        <section className="space-y-3">
          {sorted.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Aucune période. Les prix standard s’appliquent toute l’année.
            </div>
          )}
          {sorted.map((p) => {
            const open = openId === p.id;
            const problem = problems[p.id];
            return (
              <div key={p.id} className={`bg-white rounded-2xl border ${problem ? 'border-red-300' : 'border-gray-200'}`}>
                <button type="button" onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open}
                  className={`w-full flex items-center gap-3 p-4 text-left rounded-2xl ${focus}`}>
                  <span className={`w-3 h-10 rounded-full shrink-0 ${colorOf(p.id)}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{p.name || 'Nouvelle période'}</span>
                    <span className="block text-sm text-gray-500">
                      {p.start_date && p.end_date ? `${fmtDate(p.start_date)} → ${fmtDate(p.end_date)} · ${dayCount(p.start_date, p.end_date)} jours` : 'Dates à choisir'}
                    </span>
                  </span>
                  <span className="hidden sm:flex flex-col items-end text-xs text-gray-500 tabular-nums">
                    {PRICING_MODELS.map((m) => {
                      const mine = p.tiers[m]?.find((r) => r.days === BASE_DAYS);
                      const std = standard[m].find((t) => t.days === BASE_DAYS);
                      const diff = mine && std && Number(mine.price) ? Math.round((Number(mine.price) / std.price - 1) * 100) : null;
                      return <span key={m}>{MODELS[m].split(' ').slice(-1)[0]} {diff == null ? 'standard' : diff === 0 ? '=' : `${diff > 0 ? '+' : ''}${diff} %`}</span>;
                    })}
                  </span>
                  <span className="text-gray-400" aria-hidden="true">{open ? '▴' : '▾'}</span>
                </button>

                {problem && !open && <p role="alert" className="px-4 pb-3 -mt-1 text-sm font-medium text-red-600">{problem}</p>}

                {open && (
                  <div className="border-t border-gray-100 p-4 space-y-5">
                    <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Nom</span>
                        <input type="text" value={p.name} maxLength={80} placeholder="ex. Haute saison, Carnaval, Noël"
                          onChange={(e) => patch(p.id, { name: e.target.value })} className={`${input} mt-1 w-full px-3 py-2.5 font-medium`} />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Du</span>
                        <input type="date" value={p.start_date} onChange={(e) => patch(p.id, { start_date: e.target.value, end_date: p.end_date && p.end_date < e.target.value ? e.target.value : p.end_date })}
                          className={`${input} mt-1 w-full px-3 py-2.5`} />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Au (inclus)</span>
                        <input type="date" value={p.end_date} min={p.start_date || undefined} onChange={(e) => patch(p.id, { end_date: e.target.value })}
                          className={`${input} mt-1 w-full px-3 py-2.5`} />
                      </label>
                    </div>

                    {PRICING_MODELS.map((m) => (
                      <GridEditor key={m} model={m} period={p} standard={standard[m]}
                        onPercent={(pct) => applyPercent(p, m, pct)} onBase={(v) => setBase(p, m, v)}
                        onRow={(i, v) => setGrid(p, m, p.tiers[m].map((r, idx) => (idx === i ? { ...r, price: v } : r)))}
                        onUse={() => setGrid(p, m, toRows(standard[m]))} onDrop={() => dropGrid(p, m)} />
                    ))}

                    {problem && <p role="alert" className="text-sm font-medium text-red-600">{problem}</p>}

                    <div className="flex items-center justify-between pt-1">
                      <button type="button" onClick={() => duplicate(p)} className={`text-sm font-semibold text-yellow-700 hover:text-yellow-800 rounded ${focus}`}>Dupliquer pour l’an prochain</button>
                      <button type="button" onClick={() => remove(p)} className={`text-sm text-gray-400 hover:text-red-600 rounded ${focus}`}>Supprimer</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" onClick={addPeriod}
            className={`w-full rounded-2xl border-2 border-dashed border-gray-300 py-4 text-sm font-semibold text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50 ${focus}`}>
            + Nouvelle période
          </button>
        </section>

        {/* Essai */}
        <section className="rounded-2xl bg-yellow-50 border border-yellow-200 px-6 py-4 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-medium">Départ le</span>
            <input type="date" value={test.date} onChange={(e) => setTest({ ...test, date: e.target.value })} aria-label="Date de départ à tester" className={`${input} px-3 py-2`} />
            <span className="font-medium">pour</span>
            <input type="number" min="1" value={test.days} onChange={(e) => setTest({ ...test, days: e.target.value })} aria-label="Nombre de jours à tester" className={`${input} w-20 text-center py-2`} />
            <span className="font-medium">jours</span>
          </div>
          {preview ? (
            <p className="text-sm text-gray-700">
              {preview.period ? <>Période « <strong>{preview.period.name || 'sans nom'}</strong> » : </> : <>Prix standard : </>}
              {preview.prices.map(([m, v], i) => <span key={m}>{i > 0 && ' · '}{MODELS[m]} <strong className="tabular-nums">{fmt(v)}</strong></span>)}
              <span className="text-gray-500"> (avant taxes et frais)</span>
            </p>
          ) : <p className="text-sm text-gray-500">Choisissez une date pour voir quel tarif s’applique.</p>}
        </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0 text-sm" role="status" aria-live="polite">
            {status ? <span className={`font-semibold ${status.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{status.text}</span>
              : hasProblems ? <span className="text-red-600 font-medium">Corrigez les périodes en rouge pour enregistrer.</span>
              : dirty ? <span className="text-gray-700">Modifications non enregistrées</span>
              : <span className="text-gray-400">Aucune modification</span>}
          </div>
          {dirty && <button type="button" onClick={() => { setPeriods(clone(saved)); setStatus(null); }} className={`px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 ${focus}`}>Annuler</button>}
          <button type="button" onClick={save} disabled={!dirty || hasProblems || saving}
            className={`px-6 py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${focus}`}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Valid periods in the API shape, for the preview.
function toPeriodsForLookup(list) {
  return list.filter((p) => p.start_date && p.end_date).map((p) => ({
    ...p, tiers: Object.fromEntries(Object.entries(p.tiers).map(([m, rows]) => {
      const t = toNumeric(rows).filter((r) => Number.isFinite(r.price));
      const base = t.find((x) => x.days === BASE_DAYS);
      return [m, base ? [{ days: 1, price: base.price }, ...t] : t];
    })),
  }));
}

function GridEditor({ model, period, standard, onPercent, onBase, onRow, onUse, onDrop }) {
  const rows = period.tiers[model];
  const [pct, setPct] = useState('20');
  const [showAll, setShowAll] = useState(false);
  const std = (days) => standard.find((t) => t.days === days)?.price;

  if (!rows) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">{MODELS[model]}</p>
          <p className="text-sm text-gray-500">Prix standard pendant cette période.</p>
        </div>
        <button type="button" onClick={onUse} className={`text-sm font-semibold text-yellow-700 hover:text-yellow-800 rounded ${focus}`}>Définir un prix</button>
      </div>
    );
  }

  const base = rows.find((r) => r.days === BASE_DAYS);
  const stdBase = std(BASE_DAYS);
  const diff = base && stdBase && base.price !== '' ? Math.round((Number(base.price) / stdBase - 1) * 100) : null;

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-sm">{MODELS[model]}</p>
        <button type="button" onClick={onDrop} className={`text-xs text-gray-400 hover:text-gray-700 rounded ${focus}`}>Revenir au prix standard</button>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="block">
          <span className="text-sm text-gray-600">Prix pour {BASE_DAYS} jours</span>
          <div className="relative mt-1 w-36">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
            <input type="number" min="0" step="1" value={base?.price ?? ''} onChange={(e) => onBase(e.target.value)} className={`${input} w-full pl-7 pr-3 py-2.5 text-lg`} />
          </div>
          <span className="block text-xs text-gray-400 mt-1">
            Standard : {stdBase != null ? fmt(stdBase) : '—'}{diff != null && diff !== 0 && <> · <strong className={diff > 0 ? 'text-amber-600' : 'text-sky-600'}>{diff > 0 ? '+' : ''}{diff} %</strong></>}
          </span>
        </label>

        <div>
          <span className="text-sm text-gray-600">Ou : standard</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative w-24">
              <input type="number" step="1" value={pct} onChange={(e) => setPct(e.target.value)} aria-label="Pourcentage" className={`${input} w-full pl-3 pr-8 py-2.5`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span>
            </div>
            <button type="button" disabled={pct === '' || !Number.isFinite(Number(pct))} onClick={() => onPercent(Number(pct))}
              className={`px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:text-gray-300 ${focus}`}>Appliquer</button>
          </div>
          <span className="block text-xs text-gray-400 mt-1">Recalcule toutes les durées (−10 pour une baisse).</span>
        </div>
      </div>

      <button type="button" onClick={() => setShowAll(!showAll)} aria-expanded={showAll} className={`text-sm font-semibold text-gray-600 hover:text-gray-900 rounded ${focus}`}>
        {showAll ? '▴ Masquer le détail' : '▾ Détail par durée'}
      </button>
      {showAll && (
        <ul className="divide-y divide-gray-100">
          {rows.map((r, i) => {
            const s = std(r.days);
            return (
              <li key={r.days} className="flex items-center gap-3 py-2">
                <span className="w-20 text-sm text-gray-600 tabular-nums">{r.days} jours</span>
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input type="number" min="0" step="0.01" value={r.price} aria-label={`Prix pour ${r.days} jours`} onChange={(e) => onRow(i, e.target.value)} className={`${input} w-full pl-7 pr-3 py-2`} />
                </div>
                <span className="w-24 text-right text-xs text-gray-400 tabular-nums">{s != null ? `std ${fmt(s)}` : ''}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
