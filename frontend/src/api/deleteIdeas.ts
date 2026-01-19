export const deleteIdeas = async (id: string) => {
  const response = await fetch(`/api/ideas?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error('Failed to delete idea')
  }

  return response.json()
}