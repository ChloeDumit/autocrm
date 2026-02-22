interface RodarLogoProps {
  variant?: 'default' | 'light' | 'dark' | 'mono-white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  className?: string
}

const sizes = {
  sm: { width: 80, height: 32, fontSize: 22, accentY: 26, tagSize: 7, tagY: 32 },
  md: { width: 110, height: 44, fontSize: 30, accentY: 35, tagSize: 9, tagY: 44 },
  lg: { width: 140, height: 56, fontSize: 38, accentY: 44, tagSize: 11, tagY: 55 },
  xl: { width: 180, height: 70, fontSize: 50, accentY: 57, tagSize: 14, tagY: 70 },
}

export function RodarLogo({
  variant = 'default',
  size = 'md',
  showTagline = false,
  className = '',
}: RodarLogoProps) {
  const s = sizes[size]
  const taglineHeight = showTagline ? s.tagSize + 8 : 0
  const totalHeight = s.height + taglineHeight

  // Color scheme per variant
  const textColor = {
    default: 'currentColor',
    light: '#0f172a',
    dark: '#f8fafc',
    'mono-white': '#ffffff',
  }[variant]

  const accentColor = {
    default: '#3b82f6',
    light: '#3b82f6',
    dark: '#60a5fa',
    'mono-white': '#ffffff',
  }[variant]


  return (
    <svg
      width={s.width}
      height={totalHeight}
      viewBox={`0 0 ${s.width} ${totalHeight}`}
      fill="none"
      className={className}
      aria-label="Rodar"
    >
      {/* Main wordmark "rodar" */}
      <text
        x="0"
        y={s.fontSize * 0.82}
        fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
        fontSize={s.fontSize}
        fontWeight="800"
        fill={textColor}
        letterSpacing="-0.02em"
      >
        rodar
      </text>

      {/* Accent road line */}
      <rect
        x="0"
        y={s.accentY}
        width={s.width * 0.35}
        height={s.fontSize * 0.08}
        rx={s.fontSize * 0.04}
        fill={accentColor}
      />

      {/* Optional tagline */}
      {showTagline && (
        <text
          x="0"
          y={s.tagY + taglineHeight * 0.4}
          fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
          fontSize={s.tagSize}
          fontWeight="400"
          fill={accentColor}
          letterSpacing="0.08em"
          opacity="0.85"
        >
          software para automotoras
        </text>
      )}
    </svg>
  )
}

export function RodarLogoIcon({
  size = 24,
  color = '#3b82f6',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="Rodar"
    >
      {/* Stylized "R" mark with wheel motif */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill={color} opacity="0.1" />
      <text
        x="16"
        y="22"
        fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif"
        fontSize="20"
        fontWeight="800"
        fill={color}
        textAnchor="middle"
        letterSpacing="-0.02em"
      >
        r.
      </text>
    </svg>
  )
}
