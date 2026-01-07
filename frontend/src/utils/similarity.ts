import type { Idea } from '../api/getIdeas'

export const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'with',
  'at',
  'by',
  'from',
  'is',
  'it',
  'this',
  'that',
  'these',
  'those',
])

export const normalizeText = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

export const tokenize = (text: string) =>
  normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))

export const termFreq = (tokens: string[]) => {
  const map = new Map<string, number>()
  tokens.forEach((token) => map.set(token, (map.get(token) ?? 0) + 1))
  return map
}

const cosine = (a: Map<string, number>, b: Map<string, number>) => {
  let dot = 0
  let normA = 0
  let normB = 0

  a.forEach((valueA, key) => {
    normA += valueA * valueA
    const valueB = b.get(key)
    if (valueB) {
      dot += valueA * valueB
    }
  })
  b.forEach((valueB) => {
    normB += valueB * valueB
  })

  if (!normA || !normB) return 0
  return dot / Math.sqrt(normA * normB)
}

export const ideaSimilarity = (a: Idea, b: Idea) => {
  const textA = `${a.title} ${a.description ?? ''}`
  const textB = `${b.title} ${b.description ?? ''}`
  const tfA = termFreq(tokenize(textA))
  const tfB = termFreq(tokenize(textB))
  return cosine(tfA, tfB)
}

export const findSimilarIdeas = (
  ideas: Idea[],
  threshold = 0.35,
  maxPairs = 50,
): { a: Idea; b: Idea; score: number }[] => {
  const vectors = ideas.map((idea) => ({
    idea,
    tf: termFreq(tokenize(`${idea.title} ${idea.description ?? ''}`)),
  }))

  const results: { a: Idea; b: Idea; score: number }[] = []
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const score = cosine(vectors[i].tf, vectors[j].tf)
      if (score >= threshold) {
        results.push({ a: vectors[i].idea, b: vectors[j].idea, score })
      }
    }
  }

  return results.sort((x, y) => y.score - x.score).slice(0, maxPairs)
}
