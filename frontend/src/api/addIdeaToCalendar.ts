import type { CalendarEvent } from '../types/calendar'

export const AddIdeaToCalendar = async (date: string, ideaId: string): Promise<CalendarEvent> => {
  const response = await fetch(`/api/scheduled-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ ideaId, date }),
  });

  if (!response.ok) {
    throw new Error("Failed to add idea to calendar");
  }

  return response.json();
};
