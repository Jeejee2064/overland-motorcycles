'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Users, MousePointerClick, Eye, TrendingDown, ExternalLink } from 'lucide-react';
import { getAnalyticsSummary } from '@/lib/supabase/analytics';

const fmt = (n) => new Intl.NumberFormat('en-US').format(n || 0);
const pctFmt = (n) => `${((n || 0) * 100).toFixed(1)}%`;

const DEVICE_LABELS = { mobile: 'Mobile', desktop: 'Desktop', tablet: 'Tablet', unknown: 'Unknown' };

// ─── Traffic line chart (chart.js, same pattern as RevenueTab's MonthBarChart) ──

function TrafficChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.date.slice(5)), // MM-DD
          datasets: [
            {
              label: 'Pageviews',
              data: data.map(d => d.pageviews),
              borderColor: '#FACC15',
              backgroundColor: 'rgba(250,204,21,0.12)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.3,
              fill: true,
            },
            {
              label: 'Unique visitors',
              data: data.map(d => d.visitors),
              borderColor: 'rgba(107,114,128,0.9)',
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + fmt(c.parsed.y) },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 0 } },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 11 }, precision: 0 },
              grid: { color: 'rgba(136,135,128,0.12)' },
            },
          },
        },
      });
    });

    return () => { chartRef.current?.destroy(); };
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, highlight }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-yellow-400' : 'bg-white border border-gray-100 shadow-sm'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${highlight ? 'text-yellow-800' : 'text-gray-400'}`}>
          {label}
        </p>
        {Icon && <Icon size={16} className={highlight ? 'text-yellow-800' : 'text-gray-300'} />}
      </div>
      <p className={`text-3xl font-black leading-none mt-1 ${highlight ? 'text-yellow-900' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className={`text-[11px] mt-1 ${highlight ? 'text-yellow-800' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

// ─── Funnel ─────────────────────────────────────────────────────────────────

function FunnelSection({ funnel }) {
  const first = funnel[0]?.count || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Booking funnel — this period
      </p>
      <div className="space-y-2.5">
        {funnel.map((step, i) => {
          const pctOfFirst = first > 0 ? step.count / first : 0;
          const prevCount  = i > 0 ? funnel[i - 1].count : null;
          const dropOff    = prevCount && prevCount > 0 ? 1 - step.count / prevCount : null;

          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">{step.name}</span>
                <div className="flex items-center gap-2">
                  {dropOff !== null && dropOff > 0 && (
                    <span className="text-[10px] font-semibold text-red-500 flex items-center gap-0.5">
                      <TrendingDown size={11} /> -{(dropOff * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-sm font-black text-gray-900 tabular-nums">{fmt(step.count)}</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                  style={{ width: `${Math.max(pctOfFirst * 100, step.count > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Simple ranked list card ──────────────────────────────────────────────

function RankedList({ title, items, renderLabel, renderValue, empty }) {
  const max = Math.max(1, ...items.map(i => i.count));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-gray-700 truncate min-w-0">{renderLabel(item)}</span>
                <span className="text-xs font-bold text-gray-900 flex-shrink-0">{renderValue(item)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-900/70"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

const AnalyticsTab = () => {
  const [range, setRange]     = useState(30);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    getAnalyticsSummary(range)
      .then(res => { if (!cancelled) setData(res); })
      .catch(err => { if (!cancelled) setErrorMsg(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm">
        {errorMsg}
      </div>
    );
  }

  const { kpis, traffic_by_day, top_pages, top_links, referrers, devices } = data;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Traffic, link clicks, and the booking funnel — last {data.range_days} days
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                range === d ? 'bg-yellow-400 text-gray-900' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pageviews" value={fmt(kpis.pageviews)} icon={Eye} />
        <KpiCard label="Unique visitors" value={fmt(kpis.unique_visitors)} sub={`${fmt(kpis.sessions)} sessions`} icon={Users} />
        <KpiCard label="Link clicks" value={fmt(kpis.link_clicks)} icon={MousePointerClick} />
        <KpiCard
          label="Bookings confirmed"
          value={fmt(kpis.purchases)}
          sub={`${pctFmt(kpis.visitor_conversion_rate)} of visitors`}
          highlight
        />
      </div>

      {/* Traffic chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Traffic over time</p>
        </div>
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: '#FACC15' }} />
            <span className="text-[11px] text-gray-500">Pageviews</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: 'rgba(107,114,128,0.9)' }} />
            <span className="text-[11px] text-gray-500">Unique visitors</span>
          </div>
        </div>
        {traffic_by_day.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">No traffic recorded yet.</p>
        ) : (
          <TrafficChart data={traffic_by_day} />
        )}
      </div>

      {/* Funnel + Devices */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <FunnelSection funnel={data.funnel} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Checkout conversion</p>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-black text-gray-900 leading-none">{pctFmt(kpis.checkout_conversion_rate)}</p>
              <p className="text-[11px] text-gray-400 mt-1">checkout started → confirmed</p>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Devices</p>
              {devices.length === 0 ? (
                <p className="text-xs text-gray-400">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {devices.map(d => (
                    <div key={d.device_type} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{DEVICE_LABELS[d.device_type] || d.device_type}</span>
                      <span className="font-bold text-gray-900">{fmt(d.count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top pages / links / referrers */}
      <div className="grid md:grid-cols-3 gap-4">
        <RankedList
          title="Top pages"
          items={top_pages.map(p => ({ count: p.views, ...p }))}
          renderLabel={(p) => p.path}
          renderValue={(p) => fmt(p.views)}
          empty="No pageviews yet."
        />
        <RankedList
          title="Most clicked links"
          items={top_links.map(l => ({ count: l.clicks, ...l }))}
          renderLabel={(l) => (
            <span className="flex items-center gap-1">
              {l.is_external && <ExternalLink size={10} className="text-gray-400 flex-shrink-0" />}
              {l.text || l.href}
            </span>
          )}
          renderValue={(l) => fmt(l.clicks)}
          empty="No link clicks yet."
        />
        <RankedList
          title="Traffic sources"
          items={referrers.map(r => ({ count: r.count, ...r }))}
          renderLabel={(r) => r.referrer}
          renderValue={(r) => fmt(r.count)}
          empty="No referrer data yet."
        />
      </div>

    </div>
  );
};

export default AnalyticsTab;
