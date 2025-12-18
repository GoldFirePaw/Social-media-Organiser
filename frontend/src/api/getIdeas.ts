export type Idea = {
  id: string
  title: string
  description?: string | null
  platform: 'BOOKTOK' | 'DEVTOK'
  status: 'IDEA' | 'PLANNED' | 'DONE'
  difficulty: 1 | 2 | 3
}

export async function getIdeas(): Promise<Idea[]> {
  const response = await fetch('http://localhost:3001/ideas')
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
