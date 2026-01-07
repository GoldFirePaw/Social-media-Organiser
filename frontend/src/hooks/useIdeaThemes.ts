import { useMemo } from 'react'
import type { Idea } from '../api/getIdeas'
import { tokenize } from '../utils/similarity'

type OverusedKeyword = { keyword: string; count: number; ratio: number }

export const useIdeaThemes = (ideas: Idea[]) => {
  return useMemo(() => {
    const themes = new Map<string, string | null>()
    ideas.forEach((idea) => {
      if (idea.themes && idea.themes.length) {
        themes.set(idea.id, idea.themes[0])
      } else {
        const tokens = tokenize(`${idea.title} ${idea.description ?? ''}`)
        if (!tokens.length) {
          themes.set(idea.id, null)
          return
        }
        const freq = tokens.reduce((map, token) => {
          map.set(token, (map.get(token) ?? 0) + 1)
          return map
        }, new Map<string, number>())
        const [topToken] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
        themes.set(idea.id, topToken ?? null)
      }
    })
    return themes
  }, [ideas])
}

export const useOverusedKeywords = (ideas: Idea[], topN = 10) => {
  return useMemo(() => {
    if (!ideas.length) return { list: [] as OverusedKeyword[], map: new Map<string, OverusedKeyword>() }
    const freq = new Map<string, number>()
    ideas.forEach((idea) =>
      tokenize(`${idea.title} ${idea.description ?? ''}`).forEach((token) =>
        freq.set(token, (freq.get(token) ?? 0) + 1),
      ),
    )
    const list = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([keyword, count]) => ({ keyword, count, ratio: count / ideas.length }))
    const map = new Map(list.map((entry) => [entry.keyword, entry]))
    return { list, map }
  }, [ideas, topN])
}
