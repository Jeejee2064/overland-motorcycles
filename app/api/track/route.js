import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public, unauthenticated endpoint — hit from every page via sendBeacon.
// event_type/event_name are allowlisted (not trusted free text) since this
// is reachable from any browser and feeds straight into the admin dashboard.
const ALLOWED_EVENT_TYPES = new Set(['pageview', 'click', 'funnel']);
const ALLOWED_EVENT_NAMES = new Set([
  'pageview',
  'link_click',
  'wizard_step_1',
  'wizard_step_2',
  'wizard_step_3',
  'wizard_step_4',
  'wizard_step_5',
  'wizard_step_6',
]);

const MAX_LEN = 300;
const MAX_METADATA_LEN = 2000;

const clip = (v) => (typeof v === 'string' ? v.slice(0, MAX_LEN) : undefined);

export async function POST(request) {
  try {
    const body = await request.json();

    const eventType = typeof body?.event_type === 'string' ? body.event_type : null;
    const eventName = typeof body?.event_name === 'string' ? body.event_name : null;
    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ success: false }, { status: 200 });
    }
    if (!eventName || !ALLOWED_EVENT_NAMES.has(eventName)) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const sessionId = typeof body?.session_id === 'string' ? body.session_id.slice(0, 100) : null;
    const visitorId = typeof body?.visitor_id === 'string' ? body.visitor_id.slice(0, 100) : null;
    if (!sessionId || !visitorId) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    let metadata = {};
    if (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
      if (JSON.stringify(body.metadata).length <= MAX_METADATA_LEN) {
        metadata = body.metadata;
      }
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_type:   eventType,
      event_name:   eventName,
      path:         clip(body?.path),
      locale:       clip(body?.locale),
      session_id:   sessionId,
      visitor_id:   visitorId,
      referrer:     clip(body?.referrer),
      utm_source:   clip(body?.utm_source),
      utm_medium:   clip(body?.utm_medium),
      utm_campaign: clip(body?.utm_campaign),
      device_type:  clip(body?.device_type),
      metadata,
    });

    if (error) console.error('Analytics insert failed:', error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Analytics tracking failed:', err);
    // Tracking is best-effort — never surface this as an error to the visitor.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
