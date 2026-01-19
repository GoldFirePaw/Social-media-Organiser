export const removeIdeaFromCalendar = async (scheduledPostId: string) => {
  const response = await fetch(
    `/api/scheduled-posts/${scheduledPostId}`,
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
