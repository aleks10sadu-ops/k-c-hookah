/**
 * Utility function to format time in 24-hour format (Moscow timezone)
 * Always returns time in HH:MM format (24-hour, no AM/PM)
 */
export function formatMoscowTime(date: Date | string): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date passed to formatMoscowTime:', date)
    return ''
  }
  
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // CRITICAL: This ensures 24-hour format, not AM/PM
    timeZone: 'Europe/Moscow'
  })
  
  const formatted = formatter.format(dateObj)
  
  // Double-check: if somehow AM/PM got through, log it
  if (formatted.includes('AM') || formatted.includes('PM') || formatted.includes('am') || formatted.includes('pm')) {
    console.error('WARNING: formatMoscowTime returned AM/PM format:', formatted, 'for date:', date)
  }
  
  return formatted
}

/**
 * Utility function to format date and time in Russian format (Moscow timezone)
 */
export function formatMoscowDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow'
  })
  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  })
  return `${dateFormatter.format(dateObj)} ${timeFormatter.format(dateObj)}`
}

