export function HibernationLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="oklch(0.78 0.18 220)" />
          <stop offset="100%" stopColor="oklch(0.7 0.22 295)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" stroke="url(#hg)" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M28 22.5A10 10 0 0 1 17.5 12a8 8 0 1 0 10.5 10.5z"
        fill="url(#hg)"
      />
      <circle cx="30" cy="11" r="1.4" fill="oklch(0.85 0.12 260)" />
      <circle cx="33" cy="16" r="0.8" fill="oklch(0.85 0.12 260)" />
    </svg>
  );
}
