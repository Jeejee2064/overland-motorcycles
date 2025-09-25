import { locales } from '../../navigation';

export default function sitemap() {
  // Dynamic base URL - works in development and production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const routes = ['', '/about', '/contact'];
  
  const sitemapEntries = [];
  
  // Add entries for each locale and route
  locales.forEach(locale => {
    routes.forEach(route => {
      const url = locale === 'en' 
        ? `${baseUrl}${route}` 
        : `${baseUrl}/${locale}${route}`;
        
      sitemapEntries.push({
        url: url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: locales.reduce((acc, loc) => {
            const altUrl = loc === 'en' 
              ? `${baseUrl}${route}` 
              : `${baseUrl}/${loc}${route}`;
            acc[loc] = altUrl;
            return acc;
          }, {})
        }
      });
    });
  });

  return sitemapEntries;
}