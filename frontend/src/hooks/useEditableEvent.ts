import { useEffect, useState } from "react";
import type { CalendarEvent } from "../types/calendar";
import { putScheduledPost } from "../api/putScheduledPost";

export type EventField = "notes" | "status";
export type ScheduledPostStatus =
  | "NOT_STARTED"
  | "PREPARING"
  | "READY"
  | "POSTED";

type UseEditableEventOptions = {
  onSave?: (event: CalendarEvent) => void;
};

export function useEditableEvent(
  event: CalendarEvent | null,
  { onSave }: UseEditableEventOptions = {},
) {
  const [description, setDescription] = useState(event?.description ?? "");
  const [status, setStatus] = useState<ScheduledPostStatus>(
    event?.status ?? "NOT_STARTED",
  );
  const [editingField, setEditingField] = useState<EventField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDescription(event?.description ?? "");
    setStatus(event?.status ?? "NOT_STARTED");
    setEditingField(null);
    setError(null);
  }, [event?.id]);

  const cancel = () => {
    setDescription(event?.description ?? "");
    setStatus(event?.status ?? "NOT_STARTED");
    setEditingField(null);
    setError(null);
  };

  const save = async () => {
    if (!event) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        description: description.trim() === "" ? null : description.trim(),
        status: status ?? "NOT_STARTED",
      };
      const updatedEvent = await putScheduledPost(event.id, payload);
      onSave?.(updatedEvent);
      setDescription(updatedEvent.description ?? "");
      setStatus(updatedEvent.status ?? "NOT_STARTED");
      setEditingField(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    description,
    setDescription,
    status,
    setStatus,
    editingField,
    setEditingField,
    isSaving,
    error,
    cancel,
    save,
  };
}
