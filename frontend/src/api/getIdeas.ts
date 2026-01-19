export type Idea = {
  id: string
  title: string
  description?: string | null
  platform: 'BOOKTOK' | 'DEVTOK'
  status: 'IDEA' | 'PLANNED' | 'DONE'
  difficulty: 1 | 2 | 3
  scheduledPostsCount?: number
  lastScheduledPostDate?: string | null
  themes?: string[]
}

export async function getIdeas(): Promise<Idea[]> {
  const response = await fetch('/api/ideas')
  if (!response.ok) {
    throw new Error('Failed to fetch ideas')
  }

  return response.json()
}

export async function fetchIdeas() {
  try {
    const data = await getIdeas()
    return { data, error: null as string | null }
  } catch (error) {
    return {
      data: [] as Idea[],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
