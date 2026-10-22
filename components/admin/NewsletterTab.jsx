'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Copy, Check, Trash2 } from 'lucide-react';

const LANGUAGES = {
  en: { flag: '🇬🇧', name: 'English' },
  es: { flag: '🇪🇸', name: 'Español' },
  fr: { flag: '🇫🇷', name: 'Français' },
  pt: { flag: '🇧🇷', name: 'Português' },
};

const NewsletterTab = ({ notify, withConfirm }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/newsletter');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load subscribers');
      setSubscribers(data.subscribers || []);
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => subscribers.filter(s => s.email.toLowerCase().includes(searchTerm.toLowerCase())),
    [subscribers, searchTerm]
  );

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1500);
    } catch {
      notify('Could not copy to clipboard', 'error');
    }
  };

  // Comma-separated so it pastes straight into a mail client's To/Bcc field.
  const copyAll = () => copy(filtered.map(s => s.email).join(', '), 'all');

  const handleDelete = (id) => {
    withConfirm('Remove this subscriber?', async () => {
      try {
        const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete');
        setSubscribers(prev => prev.filter(s => s.id !== id));
        notify('Subscriber removed.');
      } catch (e) {
        notify('Error: ' + e.message, 'error');
      }
    });
  };

  if (loading) return <p className="text-gray-500">Loading subscribers...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <button
          onClick={copyAll}
          disabled={filtered.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50"
        >
          {copiedKey === 'all' ? <Check size={18} /> : <Copy size={18} />}
          {copiedKey === 'all' ? 'Copied!' : `Copy all (${filtered.length})`}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="p-6 text-gray-500 text-center">No subscribers yet.</p>
        )}
        {filtered.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex items-center gap-3">
              <span
                className="text-3xl leading-none flex-shrink-0"
                title={LANGUAGES[s.locale]?.name || s.locale || 'Unknown'}
              >
                {LANGUAGES[s.locale]?.flag || '🌐'}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{s.email}</p>
                <p className="text-sm font-semibold text-gray-600">
                  {LANGUAGES[s.locale]?.name || s.locale || 'Unknown language'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString()}
                  {s.source ? ` · ${s.source}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => copy(s.email, s.id)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
              >
                {copiedKey === s.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === s.id ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                aria-label="Delete subscriber"
                className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsletterTab;
