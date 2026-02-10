'use client'

export function HookahIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bowl */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 4h4M9 5h6M11 5v3"
      />
      {/* Tray */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 8h8"
      />
      {/* Stem */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v5M12 15v1"
      />
      {/* Connector */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 13h4"
      />
      {/* Base/Flask */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 16c-3.5 0-6 2.5-6 5.5V22h12v-0.5c0-3-2.5-5.5-6-5.5z"
      />
      {/* Hose */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14 14c2.5 0 4-1 4-4V5"
      />
      {/* Mouthpiece */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M18 5l1-2"
      />
    </svg>
  )
}
