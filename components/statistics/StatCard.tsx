'use client'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="bg-telegram-secondary-bg rounded-lg p-4">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <p className="text-sm text-telegram-hint mb-1">{title}</p>
      <p className="text-2xl font-bold text-telegram-text">{value}</p>
      {subtitle && (
        <p className="text-xs text-telegram-hint mt-1">{subtitle}</p>
      )}
    </div>
  )
}

