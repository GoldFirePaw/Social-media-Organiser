import { useContext } from 'react'
import { IdeasContext } from '../context/ideasContextValue'

export function useIdeas() {
  const context = useContext(IdeasContext)
  if (!context) {
    throw new Error('useIdeas must be used within an IdeasProvider')
  }
  return context
}
