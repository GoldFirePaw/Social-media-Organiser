export const deleteIdeas = async (id: string) => {
  const response = await fetch(`http://localhost:3001/ideas?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error('Failed to delete idea')
  }

  return response.json()
}