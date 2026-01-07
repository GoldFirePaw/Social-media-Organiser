import { useMemo } from 'react'
import type { Idea } from '../api/getIdeas'
import { findSimilarIdeas } from '../utils/similarity'

export type SimilarIdea = { idea: Idea; score: number }

export const useIdeaSimilarities = (ideas: Idea[], threshold = 0.35) => {
  return useMemo(() => {
    if (!ideas.length) return new Map<string, SimilarIdea[]>()
    const pairs = findSimilarIdeas(ideas, threshold)
    const map = new Map<string, SimilarIdea[]>()

    pairs.forEach(({ a, b, score }) => {
      map.set(a.id, [...(map.get(a.id) ?? []), { idea: b, score }])
      map.set(b.id, [...(map.get(b.id) ?? []), { idea: a, score }])
    })

    return map
  }, [ideas, threshold])
}
