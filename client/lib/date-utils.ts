import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays, isValid } from 'date-fns'

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, formatStr: string = 'MMM dd, yyyy'): string {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return dateString
    return format(date, formatStr)
  } catch {
    return dateString
  }
}

/**
 * Format time string (HH:mm) to 12-hour format
 */
export function formatTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return timeString
  }
}

/**
 * Get time until a scheduled class
 */
export function getTimeUntilClass(scheduledDate: string, startTime: string) {
  try {
    const classDateTime = parseISO(`${scheduledDate.split('T')[0]}T${startTime}`)
    const now = new Date()
    const minutesUntil = differenceInMinutes(classDateTime, now)

    if (minutesUntil < 0) {
      return {
        text: 'Started',
        canJoin: true,
        color: 'text-green-500',
        minutes: minutesUntil,
      }
    }

    if (minutesUntil <= 10) {
      return {
        text: 'Starting soon',
        canJoin: true,
        color: 'text-orange-500 animate-pulse',
        minutes: minutesUntil,
      }
    }

    if (minutesUntil < 60) {
      return {
        text: `in ${minutesUntil}m`,
        canJoin: false,
        color: 'text-orange-500',
        minutes: minutesUntil,
      }
    }

    const hoursUntil = differenceInHours(classDateTime, now)
    if (hoursUntil < 24) {
      return {
        text: `in ${hoursUntil}h`,
        canJoin: false,
        color: 'text-slate-400',
        minutes: minutesUntil,
      }
    }

    const daysUntil = differenceInDays(classDateTime, now)
    return {
      text: `in ${daysUntil}d`,
      canJoin: false,
      color: 'text-slate-400',
      minutes: minutesUntil,
    }
  } catch {
    return {
      text: 'Soon',
      canJoin: false,
      color: 'text-slate-400',
      minutes: 0,
    }
  }
}

/**
 * Check if a class is currently live
 */
export function isClassLive(scheduledDate: string, startTime: string, durationMinutes: number): boolean {
  try {
    const classDateTime = parseISO(`${scheduledDate.split('T')[0]}T${startTime}`)
    const now = new Date()
    const endTime = new Date(classDateTime.getTime() + durationMinutes * 60 * 1000)
    
    return now >= classDateTime && now <= endTime
  } catch {
    return false
  }
}

/**
 * Get countdown display for a class
 */
export function getCountdownDisplay(scheduledDate: string, startTime: string) {
  try {
    const classDateTime = parseISO(`${scheduledDate.split('T')[0]}T${startTime}`)
    const now = new Date()
    const minutesUntil = differenceInMinutes(classDateTime, now)

    if (minutesUntil < 0) return 'Started'
    if (minutesUntil === 0) return 'Starting now'
    if (minutesUntil < 60) return `${minutesUntil} min`
    
    const hoursUntil = Math.floor(minutesUntil / 60)
    const remainingMinutes = minutesUntil % 60
    
    if (hoursUntil < 24) {
      return remainingMinutes > 0 
        ? `${hoursUntil}h ${remainingMinutes}m`
        : `${hoursUntil}h`
    }

    const daysUntil = Math.floor(hoursUntil / 24)
    return `${daysUntil}d`
  } catch {
    return 'Soon'
  }
}
