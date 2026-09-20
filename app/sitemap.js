// sitemap.xml
//
// Built from the same navigation the drawer renders, so a page can never be
// missing from the sitemap because someone forgot to add it in a second place.
import site from '@/lib/site';

export default function sitemap() {
  const base = String(site.url).replace(/\/+$/, '');
  const now = new Date().toISOString().split('T')[0];

  const routes = [
    ...site.footerNav.map((l) => l.href),
    ...site.legalNav.map((l) => l.href),
  ];

  return [...new Set(routes)].map((route) => ({
    url: `${base}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/link-bot' ? 0.9 : 0.6,
  }));
}
