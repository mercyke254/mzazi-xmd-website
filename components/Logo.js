// MZAZI XMD — brand mark.
//
// The same bolt-in-a-frame the MZAZI TECH site uses, so the two sites read as one
// family, with the wordmark changed to this bot's name. It is drawn from design
// tokens, so it themes itself in light and dark mode without a second asset.
//
// The gradient id comes from the caller: the mark renders in the header AND in
// the drawer at the same time, and duplicate SVG ids in one document make the
// second one resolve to whichever definition the browser saw first. An explicit
// id keeps the two apart. It is a prop rather than a counter because a value that
// changes between the server and the client render breaks hydration.
export default function Logo({ size = 34, withText = false, id = 'xmd-bolt' }) {
  const gid = id;

  return (
    <span className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        style={{ display: 'block', flexShrink: 0 }}
        role="img"
        aria-label="MZAZI XMD"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="52%" stopColor="var(--pink)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>

        {/* Rounded frame with a brand gradient border */}
        <rect
          x="2.5" y="2.5" width="43" height="43" rx="11"
          fill="var(--surface)"
          stroke={`url(#${gid})`}
          strokeWidth="2.2"
        />
        {/* Bolt */}
        <path
          d="M27.2 8.5 L15.5 26.5 L22.4 26.5 L20.4 39.5 L32.8 20.8 L25.6 20.8 Z"
          fill={`url(#${gid})`}
        />
        {/* Corner accents */}
        <circle cx="8.5" cy="8.5" r="1.5" fill="var(--yellow)" />
        <circle cx="39.5" cy="39.5" r="1.5" fill="var(--pink)" />
      </svg>

      {withText && (
        <span
          className="display"
          style={{
            fontSize: size > 40 ? 19 : 16,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
          }}
        >
          MZAZI<span style={{ color: 'var(--brand)' }}>.</span>XMD
        </span>
      )}
    </span>
  );
}
