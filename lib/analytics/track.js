// lib/analytics/track.js
//
// Best-effort client-side behavior tracking. Never throws, never blocks the
// UI — a lost analytics event is fine, a broken page is not. Writes go to
// /api/track (public, service-role insert server-side) since the anon
// Supabase client has no table access post RLS-hardening.

'use client';

const STORAGE_VISITOR = 'om_visitor_id';
const STORAGE_SESSION = 'om_session_id';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Persists across visits (localStorage) — identifies a returning browser.
export function getVisitorId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(STORAGE_VISITOR);
    if (!id) {
      id = makeId();
      window.localStorage.setItem(STORAGE_VISITOR, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

// Resets each tab session (sessionStorage) — identifies one visit.
export function getSessionId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.sessionStorage.getItem(STORAGE_SESSION);
    if (!id) {
      id = makeId();
      window.sessionStorage.setItem(STORAGE_SESSION, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

function getUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source:   params.get('utm_source')   || undefined,
      utm_medium:   params.get('utm_medium')   || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
    };
  } catch {
    return {};
  }
}

function getDeviceType() {
  try {
    const ua = navigator.userAgent || '';
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
  } catch {
    return 'unknown';
  }
}

export function trackEvent(eventType, eventName, metadata = {}) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      event_type: eventType,
      event_name: eventName,
      path:       window.location.pathname,
      locale:     document.documentElement.lang || undefined,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      referrer:   document.referrer || undefined,
      device_type: getDeviceType(),
      ...getUtm(),
      metadata,
    };
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
    } else {
      fetch('/api/track', {
        method:     'POST',
        headers:    { 'Content-Type': 'application/json' },
        body,
        keepalive:  true,
      }).catch(() => {});
    }
  } catch {
    // Tracking is best-effort — never let it break the page.
  }
}

export function trackPageview() {
  trackEvent('pageview', 'pageview');
}
