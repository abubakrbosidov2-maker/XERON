export function LogoMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="xeron-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6db3ff" />
          <stop offset="1" stopColor="#b69cff" />
        </linearGradient>
        <filter id="xeron-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#xeron-glow)" fill="none" stroke="url(#xeron-g)" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" strokeWidth="3" />
        <path d="M31 30 L69 70" strokeWidth="8" />
        <path d="M69 30 L31 70" strokeWidth="8" />
      </g>
      <rect x="45" y="45" width="10" height="10" transform="rotate(45 50 50)" fill="#ffffff" />
    </svg>
  );
}

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-xl font-bold tracking-[0.3em] text-white">XERON</span>
    </span>
  );
}