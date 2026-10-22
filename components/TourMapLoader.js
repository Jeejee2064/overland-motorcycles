'use client'
import dynamic from 'next/dynamic';

// Leaflet touches `window`, so the map is only rendered in the browser.
const TourMapLoader = dynamic(() => import('./TourMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[480px] md:h-[560px] rounded-2xl bg-gray-800/40 animate-pulse" />,
});

export default TourMapLoader;
