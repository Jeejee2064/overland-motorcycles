'use client';

import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

const MODEL_OPTIONS = [
  { value: 'Himalayan', label: 'Royal Enfield Himalayan 450', maxBikes: 6 },
  { value: 'CFMoto700', label: 'CF Moto 700 CL-X',           maxBikes: 1 },
];

const LOCALES = [
  { value: 'en', label: '🇺🇸 English',    prefix: '' },
  { value: 'es', label: '🇪🇸 Español',    prefix: '/es' },
  { value: 'fr', label: '🇫🇷 Français',   prefix: '/fr' },
  { value: 'pt', label: '🇧🇷 Português',  prefix: '/pt' },
];

const BookingLinkGeneratorTab = () => {
  const [model, setModel]     = useState('Himalayan');
  const [locale, setLocale]   = useState('en');
  const [start, setStart]     = useState('');
  const [end, setEnd]         = useState('');
  const [bikes, setBikes]     = useState('1');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied]   = useState(false);

  const selectedModel  = MODEL_OPTIONS.find(m => m.value === model) || MODEL_OPTIONS[0];
  const selectedLocale = LOCALES.find(l => l.value === locale) || LOCALES[0];
  const bikeOptions    = Array.from({ length: selectedModel.maxBikes }, (_, i) => i + 1);

  useEffect(() => {
    if (!start || !end) { setGenerated(''); return; }
    const base = `https://overland-motorcycles.com${selectedLocale.prefix}/Booking`;
    const params = new URLSearchParams({ model, start, end, bikes });
    setGenerated(`${base}?${params.toString()}`);
  }, [model, locale, start, end, bikes]);

  useEffect(() => {
    if (model === 'CFMoto700') setBikes('1');
  }, [model]);

  const copyToClipboard = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Booking Link Generator</h2>
      <p className="text-sm text-gray-500 mb-5">Generates a link that skips to the personal info step.</p>

      <div className="space-y-5">

        {/* Model */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Motorcycle Model</label>
          <div className="grid grid-cols-2 gap-3">
            {MODEL_OPTIONS.map(m => (
              <button key={m.value} type="button" onClick={() => setModel(m.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  model === m.value ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-400'
                }`}>
                <div className="font-bold text-sm text-gray-900">{m.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">Max {m.maxBikes} bike{m.maxBikes > 1 ? 's' : ''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Language</label>
          <div className="grid grid-cols-4 gap-2">
            {LOCALES.map(l => (
              <button key={l.value} type="button" onClick={() => setLocale(l.value)}
                className={`p-2.5 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                  locale === l.value ? 'border-yellow-400 bg-yellow-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Start Date</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none" />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">End Date</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none" />
        </div>

        {/* Bikes */}
        {model !== 'CFMoto700' && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Number of Bikes</label>
            <select value={bikes} onChange={(e) => setBikes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none">
              {bikeOptions.map(n => (
                <option key={n} value={n}>{n} Bike{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Generated Link */}
        {generated && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 break-all mb-3">{generated}</p>
            <button onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
              {copied ? <><CheckCircle size={18} className="text-green-400" /> Copied!</> : <><Copy size={18} /> Copy Link</>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingLinkGeneratorTab;
