export const removeIdeaFromCalendar = async (scheduledPostId: string) => {
  const response = await fetch(
    `http://localhost:3001/scheduled-posts/${scheduledPostId}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error('Failed to remove idea from calendar')
  }

  return response.text()
}
