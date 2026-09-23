import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_RANGES = new Set([7, 30, 90]);

// Ordered booking-wizard funnel steps, from first page view to conversion.
const FUNNEL_STEPS = [
  { key: 'booking_pageview',   label: 'Booking page view' },
  { key: 'wizard_step_1',      label: 'Step 1 · Location' },
  { key: 'wizard_step_2',      label: 'Step 2 · Model' },
  { key: 'wizard_step_3',      label: 'Step 3 · Quantity' },
  { key: 'wizard_step_4',      label: 'Step 4 · Dates' },
  { key: 'wizard_step_5',      label: 'Step 5 · Contact info' },
  { key: 'wizard_step_6',      label: 'Step 6 · Review & pay' },
  { key: 'checkout_initiated', label: 'Checkout started' },
  { key: 'purchase',           label: 'Booking confirmed' },
];

const dayKey = (iso) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Panama' }); // YYYY-MM-DD

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const topN = (map, n = 10) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));

export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid || role === 'coronado') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedRange = parseInt(searchParams.get('range'), 10);
    const rangeDays = ALLOWED_RANGES.has(requestedRange) ? requestedRange : 30;

    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('event_type, event_name, path, referrer, device_type, utm_source, session_id, visitor_id, metadata, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20000);

    if (error) {
      console.error('Error fetching analytics events:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const rows = events || [];

    // ── KPIs ──────────────────────────────────────────────────────────────
    const visitors = new Set();
    const sessions  = new Set();
    let pageviews  = 0;
    let linkClicks = 0;

    const trafficByDay = new Map();
    const pageCounts   = new Map();
    const linkCounts   = new Map();
    const referrerCounts = new Map();
    const deviceCounts   = new Map();
    const utmSourceCounts = new Map();
    const funnelCounts = new Map(FUNNEL_STEPS.map(s => [s.key, 0]));

    for (const row of rows) {
      if (row.visitor_id && row.visitor_id !== 'server') visitors.add(row.visitor_id);
      if (row.session_id && row.session_id !== 'server') sessions.add(row.session_id);

      if (row.event_type === 'pageview') {
        pageviews += 1;

        const day = dayKey(row.created_at);
        const dayEntry = trafficByDay.get(day) || { pageviews: 0, visitors: new Set() };
        dayEntry.pageviews += 1;
        if (row.visitor_id) dayEntry.visitors.add(row.visitor_id);
        trafficByDay.set(day, dayEntry);

        if (row.path) {
          pageCounts.set(row.path, (pageCounts.get(row.path) || 0) + 1);
          if (row.path.startsWith('/Booking') && !row.path.startsWith('/Booking/success')) {
            funnelCounts.set('booking_pageview', (funnelCounts.get('booking_pageview') || 0) + 1);
          }
        }

        const ref = row.referrer ? hostOf(row.referrer) : null;
        const refKey = ref || 'Direct';
        referrerCounts.set(refKey, (referrerCounts.get(refKey) || 0) + 1);

        if (row.utm_source) {
          utmSourceCounts.set(row.utm_source, (utmSourceCounts.get(row.utm_source) || 0) + 1);
        }
      }

      if (row.event_type === 'click' && row.event_name === 'link_click') {
        linkClicks += 1;
        const href = row.metadata?.href;
        if (href) {
          const entry = linkCounts.get(href) || {
            count: 0,
            text: row.metadata?.text || '',
            isExternal: !!row.metadata?.is_external,
          };
          entry.count += 1;
          linkCounts.set(href, entry);
        }
      }

      if (row.event_type === 'funnel' && funnelCounts.has(row.event_name)) {
        funnelCounts.set(row.event_name, funnelCounts.get(row.event_name) + 1);
      }

      if (row.device_type) {
        deviceCounts.set(row.device_type, (deviceCounts.get(row.device_type) || 0) + 1);
      }
    }

    const purchases = funnelCounts.get('purchase') || 0;
    const checkoutsInitiated = funnelCounts.get('checkout_initiated') || 0;

    const traffic_by_day = [...trafficByDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, pageviews: v.pageviews, visitors: v.visitors.size }));

    const top_pages = topN(pageCounts, 10).map(({ key, count }) => ({ path: key, views: count }));

    const top_links = [...linkCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([href, v]) => ({ href, text: v.text, is_external: v.isExternal, clicks: v.count }));

    const referrers = topN(referrerCounts, 8).map(({ key, count }) => ({ referrer: key, count }));
    const devices    = topN(deviceCounts, 5).map(({ key, count }) => ({ device_type: key, count }));
    const utm_sources = topN(utmSourceCounts, 8).map(({ key, count }) => ({ source: key, count }));

    const funnel = FUNNEL_STEPS.map(s => ({ key: s.key, name: s.label, count: funnelCounts.get(s.key) || 0 }));

    return NextResponse.json({
      range_days: rangeDays,
      kpis: {
        pageviews,
        unique_visitors: visitors.size,
        sessions: sessions.size,
        link_clicks: linkClicks,
        checkouts_initiated: checkoutsInitiated,
        purchases,
        visitor_conversion_rate: visitors.size > 0 ? purchases / visitors.size : 0,
        checkout_conversion_rate: checkoutsInitiated > 0 ? purchases / checkoutsInitiated : 0,
      },
      traffic_by_day,
      top_pages,
      top_links,
      referrers,
      devices,
      utm_sources,
      funnel,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/analytics:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
