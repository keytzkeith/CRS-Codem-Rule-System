export const DEFAULT_SESSION_TIMEZONE = 'Africa/Nairobi'
export const SESSION_OPTIONS = ['Asia', 'London', 'New York']

export function deriveSessionLabel(value, fallback = 'London', timezone = DEFAULT_SESSION_TIMEZONE) {
  const hour = extractSessionHour(value, timezone)

  if (hour === null) {
    return fallback
  }

  if (hour < 10) {
    return 'Asia'
  }

  if (hour < 16) {
    return 'London'
  }

  return 'New York'
}

function extractSessionHour(value, timezone) {
  const text = String(value || '').trim()

  if (!text) {
    return null
  }

  const normalized = text.replace(' ', 'T')
  const localMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)

  if (localMatch) {
    return Number(localMatch[2])
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone || DEFAULT_SESSION_TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  })

  const hourPart = formatter.formatToParts(parsed).find((part) => part.type === 'hour')
  if (!hourPart) {
    return null
  }

  return Number(hourPart.value)
}
