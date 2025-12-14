export const AddIdeaToCalendar = async (date: string, ideaId: string) => {
  const response = await fetch(`http://localhost:3001/scheduled-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ideaId, date }),
  });

  if (!response.ok) {
    throw new Error("Failed to add idea to calendar");
  }

  return response.json();
};
