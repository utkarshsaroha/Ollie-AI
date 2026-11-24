interface OllieMarkProps {
  size?: number;
  color?: string;
  pulse?: boolean;
}

/** Ollie's mark: an orbit ring with a satellite dot — echoes the status dots used
 * everywhere else in the UI (online indicator, cache badge) instead of a stock icon. */
export default function OllieMark({ size = 14, color = "currentColor", pulse = false }: OllieMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={pulse ? "ollie-mark-pulse" : undefined}
    >
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="1.6" />
      <circle cx="12" cy="4.6" r="2.1" fill={color} />
    </svg>
  );
}
