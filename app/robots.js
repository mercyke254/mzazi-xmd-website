// robots.txt
//
// The Link Bot page is allowed: it is the page people arrive for. Only the API
// surface and the error paths are kept out of the index, since a crawler has no
// use for either and the API requires a session anyway.
import site from '@/lib/site';

export default function robots() {
  const base = String(site.url).replace(/\/+$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/link-bot?', '/*?requestId='],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
