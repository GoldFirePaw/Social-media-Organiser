import type { CalendarEvent } from '../types/calendar'

export type UpdateScheduledPostPayload = {
  date?: string
  description?: string | null
  status?: 'NOT_STARTED' | 'PREPARING' | 'READY' | 'POSTED'
}

export const putScheduledPost = async (postId: string, payload: UpdateScheduledPostPayload): Promise<CalendarEvent> => {
  const response = await fetch(
    `/api/scheduled-posts/${postId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update scheduled post");
  }

  return response.json();
};
