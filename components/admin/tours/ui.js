// Shared class names for the tours admin (same look as the pricing editor).
export const focus = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2';
export const field =
  'w-full rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/25';
export const btnPrimary = `inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 sm:px-6 py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${focus}`;
export const btnSecondary = `inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 sm:px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${focus}`;
export const btnGhost = `inline-flex items-center justify-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 ${focus}`;

export const priceFmt = (n) =>
  `${(Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $`;
