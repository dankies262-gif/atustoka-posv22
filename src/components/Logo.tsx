// AtuStoka POS Logo — dark green + white, trolley + dollar sign

interface LogoProps {
  size?: number;
  /** show the wordmark beside the icon */
  withText?: boolean;
  /** override icon bg; defaults to dark-green */
  bgColor?: string;
}

export function Logo({ size = 36, withText = false, bgColor = '#166534' }: LogoProps) {
  const r = size * 0.22;

  const icon = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(22,101,52,0.35)',
      }}
    >
      {/* Shopping trolley + dollar sign SVG */}
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Trolley handle / pole */}
        <line x1="3" y1="4" x2="6.5" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        {/* Trolley body base */}
        <path
          d="M6.5 4 L8 14 H21 L23 7 H8"
          stroke="white"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Trolley base line */}
        <line x1="8" y1="14" x2="21" y2="14" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
        {/* Left wheel */}
        <circle cx="10.5" cy="17.5" r="2" fill="white" />
        {/* Right wheel */}
        <circle cx="19" cy="17.5" r="2" fill="white" />
        {/* Dollar sign — sits inside the trolley basket area */}
        <text
          x="15.5"
          y="12.5"
          textAnchor="middle"
          fontSize="7"
          fontWeight="bold"
          fill="#4ade80"
          fontFamily="Arial, sans-serif"
        >
          $
        </text>
      </svg>
    </div>
  );

  if (!withText) return icon;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28 }}>
      {icon}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: size * 0.44,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          AtuStoka
        </span>
        <span
          style={{
            fontSize: size * 0.26,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Point of Sale
        </span>
      </div>
    </div>
  );
}
