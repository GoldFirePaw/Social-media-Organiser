export const GetScheduledPosts = async () => {
  const response = await fetch('http://localhost:3001/ideas/scheduled-posts', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled posts')
  }

  return response.json()
}