import type { Idea } from '../api/getIdeas'

export type CalendarEvent = {
  id: string
  title: string
  start?: string
  date?: string
  idea: Idea
}
