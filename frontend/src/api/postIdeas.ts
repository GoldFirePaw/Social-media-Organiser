export type IdeaData = {
  title: string
  description?: string | null
  platform: 'BOOKTOK' | 'DEVTOK'
  difficulty: 1 | 2 | 3
  themes?: string[]
}

export const postIdeas = async (data: IdeaData) => {
  console.log('Posting idea:', data)
  const response = await fetch("/api/ideas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to post idea')
  }

  return response.json()
}
