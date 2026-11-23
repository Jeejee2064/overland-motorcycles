// Fallback prices, used only if the pricing_tiers table is unreachable.
// The source of truth is the Supabase table (edited from /admin/lepetitcoindecharly).
export const PRICING_MODELS = ['Himalayan', 'CFMoto700'];

export const DEFAULT_PRICING = {
  Himalayan: [
    { days: 1, price: 280 }, { days: 2, price: 280 }, { days: 3, price: 400 },
    { days: 4, price: 530 }, { days: 5, price: 660 }, { days: 6, price: 790 },
    { days: 7, price: 899 }, { days: 8, price: 1010 }, { days: 9, price: 1175 },
    { days: 10, price: 1230 }, { days: 11, price: 1290 }, { days: 12, price: 1350 },
    { days: 13, price: 1380 }, { days: 14, price: 1420 }, { days: 21, price: 1800 },
  ],
  CFMoto700: [
    { days: 1, price: 340 }, { days: 2, price: 340 }, { days: 3, price: 480 },
    { days: 4, price: 640 }, { days: 5, price: 790 }, { days: 6, price: 950 },
    { days: 7, price: 1080 }, { days: 8, price: 1210 }, { days: 9, price: 1410 },
    { days: 10, price: 1480 }, { days: 11, price: 1550 }, { days: 12, price: 1620 },
    { days: 13, price: 1660 }, { days: 14, price: 1700 }, { days: 21, price: 2160 },
  ],
};

// Fetches live prices; always resolves to a complete { model: tiers[] } map.
export async function fetchPricing() {
  try {
    const res = await fetch('/api/pricing');
    if (!res.ok) throw new Error('bad status');
    const { pricing } = await res.json();
    const out = { ...DEFAULT_PRICING };
    for (const m of PRICING_MODELS) {
      if (Array.isArray(pricing?.[m]) && pricing[m].length > 0) out[m] = pricing[m];
    }
    return out;
  } catch {
    return DEFAULT_PRICING;
  }
}
