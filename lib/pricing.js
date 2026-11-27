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

// Price of a rental of `days` days from one tier grid (1 day = price of 2 days).
export function computeRentalPrice(tiers, days) {
  if (!days || !tiers?.length) return 0;
  const sorted = [...tiers].sort((a, b) => a.days - b.days);
  const exact = sorted.find((p) => p.days === days);
  if (exact) return exact.price;
  const next = sorted.find((p) => p.days > days);
  if (next) return next.price;
  const last = sorted[sorted.length - 1];
  return Math.round((last.price / last.days) * days);
}

// The period (if any) whose date range contains `date` (YYYY-MM-DD).
export function findPeriod(periods, date) {
  if (!date) return null;
  return (periods ?? []).find((p) => p.start_date <= date && date <= p.end_date) ?? null;
}

// Grid that applies to a rental starting on `startDate`: the period's grid if the
// start date falls in a period that prices this model, otherwise the standard one.
export function tiersForRental(pricing, periods, model, startDate) {
  const base = pricing?.[model] ?? DEFAULT_PRICING[model] ?? DEFAULT_PRICING.Himalayan;
  const period = findPeriod(periods, startDate);
  const own = period?.tiers?.[model];
  return Array.isArray(own) && own.length > 0 ? own : base;
}

// Fetches live prices and seasonal periods; `pricing` is always a complete
// { model: tiers[] } map, `periods` is always an array.
export async function fetchPricingData() {
  try {
    const res = await fetch('/api/pricing');
    if (!res.ok) throw new Error('bad status');
    const { pricing, periods } = await res.json();
    const out = { ...DEFAULT_PRICING };
    for (const m of PRICING_MODELS) {
      if (Array.isArray(pricing?.[m]) && pricing[m].length > 0) out[m] = pricing[m];
    }
    return { pricing: out, periods: Array.isArray(periods) ? periods : [] };
  } catch {
    return { pricing: DEFAULT_PRICING, periods: [] };
  }
}

export async function fetchPricing() {
  return (await fetchPricingData()).pricing;
}
