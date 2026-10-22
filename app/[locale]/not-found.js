import { useTranslations } from 'next-intl';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <html>
      <body>
        <div>
          <h1>404 - {t('title')}</h1>
          <p>{t('description')}</p>
        </div>
      </body>
    </html>
  );
}