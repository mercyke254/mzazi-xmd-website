// ─────────────────────────────────────────────────────────────────────────────
// Reading a URL out of the environment, carefully.
//
// These are the public addresses this site puts in its own pages: the canonical
// URL, the sitemap, the links to the main site. They end up in `new URL()`, which
// THROWS on anything malformed — and a throw while building metadata takes every
// page down, not one form.
//
// So a value is read the way a person meant it (trimmed, quotes stripped, a
// missing protocol added, trailing slashes removed) and, if it still cannot be
// parsed, the caller falls back to a literal rather than the broken value. The
// specific failure being designed out is `NEXT_PUBLIC_SITE_URL` pasted with the
// quotation marks from an .env file still on it.
// ─────────────────────────────────────────────────────────────────────────────

/** Characters that survive a copy-paste and break a URL. */
const INVISIBLE = /[\u200B-\u200D\uFEFF\u00A0]/g;
// The same class without /g: a global regex carries lastIndex between .test()
// calls, so testing with it gives alternating answers for identical input.
const HAS_INVISIBLE = /[\u200B-\u200D\uFEFF\u00A0]/;

/** The value as a person meant it, without deciding whether it is usable. */
export function cleanEnvValue(raw) {
  if (raw === undefined || raw === null) return '';
  return String(raw)
    .replace(INVISIBLE, '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
}

/**
 * A usable absolute URL, or the reason there is not one.
 *
 * @returns {{ url: string|null, error: string|null, notes: string[] }}
 *   `notes` are the corrections applied, reported rather than hidden so the
 *   health check can show what the deployment is really using.
 */
export function normaliseUrl(raw, { fallback = '' } = {}) {
  const notes = [];
  let value = cleanEnvValue(raw);

  if (raw !== undefined && raw !== null) {
    const original = String(raw);
    if (/^["']|["']$/.test(original.replace(INVISIBLE, '').trim())) {
      notes.push('removed the quotation marks around the value');
    }
    if (HAS_INVISIBLE.test(original)) {
      notes.push('removed invisible characters from the value');
    }
  }

  if (!value) {
    const fallbackValue = cleanEnvValue(fallback);
    if (!fallbackValue) return { url: null, error: 'No address is configured.', notes };
    if (cleanEnvValue(raw) !== fallbackValue) notes.push('using the default address');
    value = fallbackValue;
  }

  if (/^\/\//.test(value)) {
    value = `https:${value}`;
    notes.push('added a missing https: protocol');
  } else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = `https://${value}`;
    notes.push('added a missing https: protocol');
  }

  if (/^http:\/\//i.test(value) && process.env.NODE_ENV === 'production') {
    notes.push('set over http, which browsers will block in production');
  }

  const trimmed = value.replace(/\/+$/, '');
  if (trimmed !== value) notes.push('removed a trailing slash');
  value = trimmed;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { url: null, error: 'That is not a valid URL.', notes };
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return { url: null, error: 'That address must start with https://.', notes };
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { url: null, error: `That address has no real host name ("${parsed.hostname || value}").`, notes };
  }

  return { url: value, error: null, notes };
}

export default normaliseUrl;
