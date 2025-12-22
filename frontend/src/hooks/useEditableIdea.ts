import { useEffect, useState } from "react";
import type { Idea } from "../api/getIdeas";
import { updateIdea } from "../api/updateIdea";
import { useIdeas } from "./useIdeas";

export type EditableField =
  | "title"
  | "description"
  | "platform"
  | "status"
  | "difficulty";

type EditableValues = {
  title: string;
  description: string;
  platform: Idea["platform"];
  status: Idea["status"];
  difficulty: Idea["difficulty"];
};

const getInitialValues = (idea: Idea | null): EditableValues => ({
  title: idea?.title ?? "",
  description: idea?.description ?? "",
  platform: idea?.platform ?? "BOOKTOK",
  status: idea?.status ?? "IDEA",
  difficulty: idea?.difficulty ?? 2,
});

type UseEditableIdeaOptions = {
  onSave?: (idea: Idea) => void;
};

export function useEditableIdea(
  idea: Idea | null,
  { onSave }: UseEditableIdeaOptions = {},
) {
  const { refresh } = useIdeas();
  const [values, setValues] = useState<EditableValues>(() =>
    getInitialValues(idea),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(getInitialValues(idea));
    setIsEditing(false);
    setError(null);
  }, [idea?.id]);

  const handleChange = <T extends EditableField>(
    field: T,
    newValue: EditableValues[T],
  ) => {
    setValues((previous) => ({
      ...previous,
      [field]: newValue,
    }));
  };

  const cancelEdit = () => {
    setValues(getInitialValues(idea));
    setIsEditing(false);
    setError(null);
  };

  const save = async () => {
    if (!idea) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: values.title.trim(),
        description:
          values.description.trim() === "" ? null : values.description.trim(),
        platform: values.platform,
        status: values.status,
        difficulty: values.difficulty,
      };
      const updatedIdea = await updateIdea(idea.id, payload);
      await refresh();
      onSave?.(updatedIdea);
      setValues(getInitialValues(updatedIdea));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update idea");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    values,
    isEditing,
    isSaving,
    error,
    handleChange,
    startEditing: () => setIsEditing(true),
    cancelEdit,
    save,
    clearError: () => setError(null),
  };
}
