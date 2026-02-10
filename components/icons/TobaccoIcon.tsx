'use client'

export function TobaccoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Puck/Tin shape */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 8c0 1.66-4.03 3-9 3s-9-1.34-9-3c0-1.66 4.03-3 9-3s9 1.34 9 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8v6c0 1.66 4.03 3 9 3s9-1.34 9-3V8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 10c0 1.66 4.03 3 9 3s9-1.34 9-3"
        opacity="0.5"
      />
    </svg>
  )
}
