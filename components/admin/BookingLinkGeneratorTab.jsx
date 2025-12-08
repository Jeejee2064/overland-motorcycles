'use client';

import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

const BookingLinkGeneratorTab = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [bikes, setBikes] = useState('1');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const BASE_URL = 'https://overland-motorcycles.com/Booking';

  // Auto-generate link on change
  useEffect(() => {
    if (!start || !end) {
      setGenerated('');
      return;
    }
    const url = `${BASE_URL}?start=${start}&end=${end}&bikes=${bikes}`;
    setGenerated(url);
  }, [start, end, bikes]);

  const copyToClipboard = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Booking Link Generator
      </h2>

      <div className="space-y-5">

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none"
          />
        </div>

        {/* Bikes */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Number of Bikes
          </label>
          <select
            value={bikes}
            onChange={(e) => setBikes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none"
          >
            <option value="1">1 Bike</option>
            <option value="2">2 Bikes</option>
            <option value="3">3 Bikes</option>
            <option value="4">4 Bikes</option>
          </select>
        </div>

        {/* Auto-Generated Link Section */}
        {generated && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 break-all mb-3">{generated}</p>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              {copied ? (
                <>
                  <CheckCircle size={18} className="text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy Link
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingLinkGeneratorTab;
