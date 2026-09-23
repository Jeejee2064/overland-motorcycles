'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent, trackPageview } from '@/lib/analytics/track';

// Mounted once in the root layout. Fires a pageview on every route change and
// records every link click on the page (internal + outbound) via a single
// delegated listener — no need to instrument individual <a> tags.
//
// Deliberately avoids next/navigation's useSearchParams here: that hook
// forces the whole route into dynamic rendering unless wrapped in Suspense,
// and pathname changes already cover virtually every navigation on this site.
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageview();
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let isExternal = false;
      try {
        const url = new URL(href, window.location.origin);
        isExternal = url.origin !== window.location.origin;
      } catch {
        return;
      }

      trackEvent('click', 'link_click', {
        href,
        text: (link.textContent || '').trim().slice(0, 120),
        is_external: isExternal,
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
