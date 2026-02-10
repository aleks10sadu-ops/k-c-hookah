/**
 * Utility functions for working with Moscow timezone
 */

/**
 * Get start of today (00:00:00) in Moscow timezone as UTC ISO string for database queries
 */
export function getMoscowTodayStart(): string {
  const now = new Date()
  
  // Get current date components in Moscow timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  // Create date string representing Moscow midnight, then convert to UTC
  // Moscow is UTC+3, so we create a date with +03:00 offset
  const moscowMidnight = `${year}-${month}-${day}T00:00:00+03:00`
  const utcDate = new Date(moscowMidnight)
  
  return utcDate.toISOString()
}

/**
 * Get date N days ago in Moscow timezone as UTC ISO string for database queries
 */
export function getMoscowDaysAgo(days: number): string {
  const now = new Date()
  
  // Get date N days ago in Moscow timezone
  const moscowFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  // Calculate target date
  const targetDate = new Date(now)
  targetDate.setUTCDate(targetDate.getUTCDate() - days)
  
  const parts = moscowFormatter.formatToParts(targetDate)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  // Create date string representing Moscow midnight
  const moscowMidnight = `${year}-${month}-${day}T00:00:00+03:00`
  const utcDate = new Date(moscowMidnight)
  
  return utcDate.toISOString()
}

/**
 * Get date N months ago in Moscow timezone as UTC ISO string for database queries
 */
export function getMoscowMonthsAgo(months: number): string {
  const now = new Date()
  
  // Get date N months ago in Moscow timezone
  const moscowFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  // Calculate target date
  const targetDate = new Date(now)
  targetDate.setUTCMonth(targetDate.getUTCMonth() - months)
  
  const parts = moscowFormatter.formatToParts(targetDate)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  // Create date string representing Moscow midnight
  const moscowMidnight = `${year}-${month}-${day}T00:00:00+03:00`
  const utcDate = new Date(moscowMidnight)
  
  return utcDate.toISOString()
}

/**
 * Check if a date (ISO string) is within today in Moscow timezone
 */
export function isMoscowToday(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  
  // Get current date in Moscow using Intl.DateTimeFormat to avoid locale issues
  const moscowFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const moscowNowParts = moscowFormatter.formatToParts(now)
  const moscowDateParts = moscowFormatter.formatToParts(date)
  
  // Compare dates (year, month, day)
  const moscowNowDate = `${moscowNowParts.find(p => p.type === 'year')?.value}-${moscowNowParts.find(p => p.type === 'month')?.value}-${moscowNowParts.find(p => p.type === 'day')?.value}`
  const moscowDateDate = `${moscowDateParts.find(p => p.type === 'year')?.value}-${moscowDateParts.find(p => p.type === 'month')?.value}-${moscowDateParts.find(p => p.type === 'day')?.value}`
  
  return moscowNowDate === moscowDateDate
}

/**
 * Check if a date (ISO string) is within N days ago in Moscow timezone
 */
export function isMoscowWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString)
  const now = new Date()
  
  // Get date N days ago in Moscow using proper timezone conversion
  const moscowFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Calculate target date (N days ago)
  const targetDate = new Date(now)
  targetDate.setUTCDate(targetDate.getUTCDate() - days)
  
  const moscowTargetParts = moscowFormatter.formatToParts(targetDate)
  const moscowDateParts = moscowFormatter.formatToParts(date)
  
  // Create comparable date strings
  const targetDateStr = `${moscowTargetParts.find(p => p.type === 'year')?.value}-${moscowTargetParts.find(p => p.type === 'month')?.value}-${moscowTargetParts.find(p => p.type === 'day')?.value}`
  const dateStr = `${moscowDateParts.find(p => p.type === 'year')?.value}-${moscowDateParts.find(p => p.type === 'month')?.value}-${moscowDateParts.find(p => p.type === 'day')?.value}`
  
  return dateStr >= targetDateStr
}

