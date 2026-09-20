// MZAZI XMD — the page furniture.
//
// Four pages in this site are "a heading, then numbered sections, with a contents
// list beside them" (privacy, terms, FAQ, how-to-use), and the rest are "a heading
// then some blocks". Both are defined once here so the pages themselves only carry
// their words — which is also what keeps the typography identical from page to
// page without anyone remembering to copy it.

/** The heading block every page opens with. */
export function PageHero({ eyebrow, title, lede, meta, children }) {
  return (
    <section style={{ paddingTop: 56, paddingBottom: 24 }}>
      <div className="container-site">
        <div style={{ maxWidth: 780 }}>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="headline" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.1rem)', marginTop: 14 }}>
            {title}
          </h1>
          {lede && (
            <p className="lede" style={{ marginTop: 16, maxWidth: 640 }}>
              {lede}
            </p>
          )}
          {meta && (
            <p className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dim)', marginTop: 16 }}>
              {meta}
            </p>
          )}
          {children && <div style={{ marginTop: 24 }}>{children}</div>}
        </div>
      </div>
    </section>
  );
}

/** A block of content on a normal page. */
export function Section({ id, title, description, children, narrow = false, style }) {
  return (
    <section id={id} className={id ? 'scroll-mt-32' : undefined} style={{ paddingTop: 34, paddingBottom: 34, ...style }}>
      <div className="container-site" style={narrow ? { maxWidth: 820 } : undefined}>
        {title && (
          <h2 className="section-title" style={{ marginBottom: description ? 10 : 18 }}>
            <span className="bar" aria-hidden="true" />
            {title}
          </h2>
        )}
        {description && (
          <p className="lede" style={{ marginBottom: 20, maxWidth: 660 }}>{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}

/**
 * The numbered-sections page: a sticky contents list beside the body, which is how
 * a long legal page stays navigable on a phone once it is a single column.
 */
export function ProsePage({ sections }) {
  return (
    <section className="section" style={{ paddingTop: 8, paddingBottom: 96 }}>
      <div className="container-site">
        <div className="grid lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3">
            <nav aria-label="Contents" className="card card-pad lg:sticky" style={{ top: 96 }}>
              <p className="eyebrow" style={{ marginBottom: 14 }}>Contents</p>
              <div style={{ display: 'grid', gap: 6 }}>
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 13.5, lineHeight: 1.5 }}
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <div className="lg:col-span-9">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-32"
                style={{ padding: '26px 8px', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)' }}
              >
                <div className="grid sm:grid-cols-12 gap-4">
                  <span className="mono" style={{ color: 'var(--brand)', fontSize: 12, paddingTop: 4 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="sm:col-span-10">
                    <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 12 }}>{s.title}</h2>
                    <div style={{ color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.75, display: 'grid', gap: 12 }}>
                      {s.body}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A quote/CTA band used at the bottom of a few pages. */
export function CallToAction({ title, body, primary, secondary }) {
  return (
    <Section>
      <div className="card card-pad glow-card" style={{ padding: '34px 26px', textAlign: 'center' }}>
        <h2 className="section-title" style={{ justifyContent: 'center', marginBottom: 10 }}>{title}</h2>
        <p className="lede" style={{ margin: '0 auto 22px', maxWidth: 560 }}>{body}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {primary}
          {secondary}
        </div>
      </div>
    </Section>
  );
}
