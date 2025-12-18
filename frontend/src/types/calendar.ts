import type { Idea } from '../api/getIdeas'

export type CalendarEvent = {
  id: string
  title: string
  start?: string
  date?: string
  description?: string | null
  status?: 'NOT_STARTED' | 'PREPARING' | 'READY' | 'POSTED'
  idea: Idea
}
