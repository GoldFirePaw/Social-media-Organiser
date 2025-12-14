export type IdeaData = {
  title: string
  description?: string | null
  platform: 'BOOKTOK' | 'DEVTOK'
}

export const postIdeas = async (data: IdeaData) => {
  console.log('Posting idea:', data)
  const response = await fetch('http://localhost:3001/ideas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to post idea')
  }

  return response.json()
}
