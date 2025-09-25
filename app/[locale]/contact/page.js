import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Navigation from '../../../components/Navigation';
import LocaleSwitcher from '../../../components/LocaleSwitcher';

export async function generateMetadata({ params }) {
  const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ContactPage' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ContactPage() {
  const t = useTranslations('ContactPage');

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