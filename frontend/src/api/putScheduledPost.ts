export const putScheduledPost = async (postId: string, date: string) => {
  const response = await fetch(
    `http://localhost:3001/scheduled-posts/${postId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update scheduled post");
  }

  return response.json();
};
