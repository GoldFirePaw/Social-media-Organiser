import type { CalendarEvent } from '../types/calendar'

export const getScheduledPosts = async (): Promise<CalendarEvent[]> => {
  const response = await fetch('http://localhost:3001/scheduled-posts')

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled posts')
  }

  return response.json()
}
