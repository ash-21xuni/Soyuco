// The Soyucoin: a gold coin with a raised rim and an "S" for Soyuco. Flat
// fills only (no gradient ids), so any number can share a page safely, and the
// colours are fixed so the coin reads as gold on every theme.
export function SoyucoinIcon({ size = 16, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      {/* Edge, then the rim sitting slightly high to suggest thickness. */}
      <circle cx="12" cy="12" r="11.25" fill="#b8770d" />
      <circle cx="12" cy="11.4" r="10.6" fill="#e3a21f" />
      {/* Face. */}
      <circle cx="12" cy="11.4" r="8.1" fill="#f7c843" stroke="#cf8f17" strokeWidth="0.9" />
      {/* Shine. */}
      <path
        d="M6.2 9.6a6.4 6.4 0 0 1 5-4.6"
        fill="none"
        stroke="#fff3c4"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* The S. */}
      <path
        d="M14.7 8.9c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 1.9 0 2.6 5.4 1.4 5.4 4.1 0 1.2-1.2 2-2.8 2-1.3 0-2.3-.6-2.8-1.5"
        fill="none"
        stroke="#9a5f08"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
