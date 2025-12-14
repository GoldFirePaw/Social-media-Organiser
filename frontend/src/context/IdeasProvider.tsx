import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchIdeas } from '../api/getIdeas'
import type { Idea } from '../api/getIdeas'
import { IdeasContext, type IdeasContextValue } from './ideasContextValue'

function useIdeasState(): IdeasContextValue {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [error, setError] = useState<string | null>(null)
  const refreshRef = useRef<Promise<void> | null>(null)

  const refresh = useCallback(async () => {
    if (refreshRef.current) {
      await refreshRef.current
      return
    }

    refreshRef.current = (async () => {
      const { data, error: fetchError } = await fetchIdeas()
      if (fetchError) {
        setError(fetchError)
      } else {
        setIdeas(data)
      }
    })()

    try {
      await refreshRef.current
    } finally {
      refreshRef.current = null
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ideas, error, refresh }
}

export function IdeasProvider({ children }: { children: ReactNode }) {
  const value = useIdeasState()
  return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>
}
