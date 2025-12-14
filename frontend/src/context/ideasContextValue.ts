import { createContext } from 'react'
import type { Idea } from '../api/getIdeas'

export type IdeasContextValue = {
  ideas: Idea[]
  error: string | null
  refresh: () => Promise<void>
}

export const IdeasContext = createContext<IdeasContextValue | undefined>(undefined)
