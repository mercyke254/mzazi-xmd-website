'use client';

// MZAZI TECH — global ambient background.
//
// One fixed, non-interactive layer behind every page. It is intentionally
// quiet: two slow purple/blue glows, a faint grid, and a soft vignette that
// protects text contrast (especially in dark mode).
//
// Pages that need their own treatment add <AppBackground variant="…" />, which
// composes on top of this rather than replacing it.
//
// Cost: no images, no JS animation loop — only CSS gradients and one blurred
// layer each, with `prefers-reduced-motion` honoured via .anim-drift-*.

export default function TechBackground() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Faint grid, masked so it fades out before it reaches the content */}
      <div
        className="grid-bg"
        style={{
          position: 'absolute', inset: 0,
          maskImage: 'radial-gradient(75% 60% at 50% 0%, #000 0%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(75% 60% at 50% 0%, #000 0%, transparent 78%)',
          opacity: 0.55,
        }}
      />

      {/* Brand glow — top left */}
      <div
        className="anim-drift-a"
        style={{
          position: 'absolute', top: '-22%', left: '-12%',
          width: '58vw', height: '58vw', minWidth: 380, minHeight: 380,
          borderRadius: '50%', filter: 'blur(100px)', opacity: 0.30,
          background: 'radial-gradient(circle at 40% 40%, var(--brand) 0%, transparent 66%)',
        }}
      />
      {/* Secondary blue glow — bottom right */}
      <div
        className="anim-drift-b"
        style={{
          position: 'absolute', bottom: '-26%', right: '-14%',
          width: '60vw', height: '60vw', minWidth: 400, minHeight: 400,
          borderRadius: '50%', filter: 'blur(110px)', opacity: 0.26,
          background: 'radial-gradient(circle at 60% 60%, var(--blue) 0%, transparent 66%)',
        }}
      />
      {/* Pink accent — keeps the middle from feeling empty on wide screens */}
      <div
        className="anim-drift-c"
        style={{
          position: 'absolute', top: '38%', right: '18%',
          width: '26vw', height: '26vw', minWidth: 200, minHeight: 200,
          borderRadius: '50%', filter: 'blur(90px)', opacity: 0.18,
          background: 'radial-gradient(circle at 50% 50%, var(--pink) 0%, transparent 68%)',
        }}
      />
      {/* Yellow spark — small, low opacity, top right */}
      <div
        className="anim-drift-a"
        style={{
          position: 'absolute', top: '6%', right: '8%',
          width: '14vw', height: '14vw', minWidth: 140, minHeight: 140,
          borderRadius: '50%', filter: 'blur(80px)', opacity: 0.12,
          background: 'radial-gradient(circle at 50% 50%, var(--yellow) 0%, transparent 70%)',
        }}
      />

      {/* Vignette — pulls the edges down so foreground text keeps its contrast */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(120% 90% at 50% 40%, transparent 45%, var(--bg) 100%)',
        }}
      />
    </div>
  );
}
