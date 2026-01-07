import type { Idea } from './getIdeas'

export type UpdateIdeaPayload = {
  title: string
  description?: string | null
  platform: 'BOOKTOK' | 'DEVTOK'
  status: 'IDEA' | 'PLANNED' | 'DONE'
  difficulty: 1 | 2 | 3
  themes?: string[]
}

export const updateIdea = async (id: string, payload: UpdateIdeaPayload): Promise<Idea> => {
  const response = await fetch(`http://localhost:3001/ideas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update idea')
  }

  return response.json()
}
