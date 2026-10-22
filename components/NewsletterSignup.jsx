'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, X } from 'lucide-react';

// Button that opens a modal asking for the visitor's email.
// variant "primary" = big yellow button (home page), "link" = subtle (footer).
const NewsletterSignup = ({ source, variant = 'primary' }) => {
  const t = useTranslations('Newsletter');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const close = () => {
    setOpen(false);
    setEmail('');
    setStatus('idle');
    setMessage('');
    setIsError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMessage('');
    setIsError(false);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400) {
        setIsError(true);
        setMessage(t('invalid'));
        setStatus('idle');
        return;
      }
      if (!res.ok) throw new Error('failed');
      setMessage(data.alreadySubscribed ? t('already') : t('success'));
      setStatus('done');
    } catch {
      setIsError(true);
      setMessage(t('error'));
      setStatus('idle');
    }
  };

  const triggerClass =
    variant === 'primary'
      ? 'px-8 py-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform min-w-[200px]'
      : 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-accent/50 text-accent font-semibold hover:bg-accent/10 transition-colors';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {variant === 'link' && <Mail size={18} />}
        {t('cta')}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 px-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
            className="relative w-full max-w-md rounded-2xl bg-background border border-accent/40 p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label={t('close')}
              className="absolute top-4 right-4 text-gris hover:text-white transition-colors"
            >
              <X size={22} />
            </button>

            <div className="w-14 h-14 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
              <Mail className="text-accent" size={26} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('title')}</h3>
            <p className="text-gris mb-6">{t('desc')}</p>

            {status === 'done' ? (
              <p className="text-accent font-semibold">{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('placeholder')}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-gris/30 text-white placeholder-gris focus:outline-none focus:border-accent"
                />
                {message && (
                  <p className={`text-sm ${isError ? 'text-red-400' : 'text-accent'}`}>{message}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full px-6 py-3 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 font-bold rounded-lg disabled:opacity-60"
                >
                  {status === 'sending' ? t('sending') : t('submit')}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default NewsletterSignup;
