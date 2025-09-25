import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Navigation from '../../../components/Navigation';
import LocaleSwitcher from '../../../components/LocaleSwitcher';

export async function generateMetadata({ params }) {
  // Await params to get locale (Next.js 15 requirement)
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AboutPage' });

  // Dynamic base URL - works in development and production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const currentUrl = locale === 'en' ? `${baseUrl}/about` : `${baseUrl}/${locale}/about`;

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: currentUrl,
      type: 'website',
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/about',
        'es-ES': '/es/about',
        'pt-BR': '/pt/about',
        'fr-FR': '/fr/about',
        'x-default': '/about'
      }
    }
  };
}

export default function AboutPage() {
  const t = useTranslations('AboutPage');

  return (
    <div>
      <header>
        <Navigation />
        <LocaleSwitcher />
      </header>
      <main>
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
        <div>
          <p>{t('content')}</p>
        </div>
      </main>
    </div>
  );
}