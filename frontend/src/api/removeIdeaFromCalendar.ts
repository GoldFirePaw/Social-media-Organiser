export const removeIdeaFromCalendar = async (scheduledPostId: string) => {
  const response = await fetch(
    `http://localhost:3001/scheduled-posts/${scheduledPostId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error('Failed to remove idea from calendar')
  }

  return response.text()
}
