import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CloseButton } from "./reusableComponents/CloseButton";
import s from "./DrawerView.module.css";
import type { CalendarEvent } from "../types/calendar";
import type { Idea } from "../api/getIdeas";
import { updateIdea } from "../api/updateIdea";
import { useIdeas } from "../hooks/useIdeas";
import { putScheduledPost } from "../api/putScheduledPost";

type EditableField =
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

type ScheduledPostStatus = "NOT_STARTED" | "PREPARING" | "READY" | "POSTED";

const getInitialValues = (idea: Idea | null): EditableValues => ({
  title: idea?.title ?? "",
  description: idea?.description ?? "",
  platform: idea?.platform ?? "BOOKTOK",
  status: idea?.status ?? "IDEA",
  difficulty: idea?.difficulty ?? 2,
});

const formatDrawerDate = (dateString?: string) => {
  if (!dateString) {
    return { primary: "Select a date", secondary: "Pick a day in the calendar" };
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return { primary: dateString, secondary: "" };
  }

  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const targetMidnight = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let primary: string;
  if (diffDays === 0) {
    primary = "Today";
  } else if (diffDays === -1) {
    primary = "Yesterday";
  } else if (diffDays === 1) {
    primary = "Tomorrow";
  } else {
    primary = parsed.toLocaleDateString(undefined, {
      weekday: "long",
    });
  }

  const secondary = parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: parsed.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });

  return { primary, secondary };
};

type DrawerViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void;
  date?: string;
  idea: Idea | null;
  dateIdeas: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  onIdeaUpdated?: (idea: Idea) => void;
  onEventUpdated?: (updatedEvent: CalendarEvent) => void;
  onEventSelect?: (calendarEvent: CalendarEvent) => void;
};

export const DrawerView = ({
  setIsDrawerOpen,
  date,
  idea,
  dateIdeas,
  selectedEvent,
  onIdeaUpdated,
  onEventUpdated,
  onEventSelect,
}: DrawerViewProps) => {
  const hasDateIdeas = dateIdeas.length > 0;
  const { refresh } = useIdeas();
  const [isEditingIdea, setIsEditingIdea] = useState(false);
  const [values, setValues] = useState<EditableValues>(() =>
    getInitialValues(idea)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventDescription, setEventDescription] = useState(
    selectedEvent?.description ?? ""
  );
  const [eventStatus, setEventStatus] = useState<ScheduledPostStatus>(
    selectedEvent?.status ?? "NOT_STARTED"
  );
  const [eventEditingField, setEventEditingField] = useState<
    "notes" | "status" | null
  >(null);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditingIdea(false);
    setValues(getInitialValues(idea));
    setError(null);
  }, [idea?.id, idea]);

  useEffect(() => {
    setEventEditingField(null);
    setEventDescription(selectedEvent?.description ?? "");
    setEventStatus(selectedEvent?.status ?? "NOT_STARTED");
    setEventError(null);
  }, [selectedEvent?.id, selectedEvent]);

  const handleChange = <T extends EditableField>(
    field: T,
    newValue: EditableValues[T]
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const handleSave = async () => {
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
      onIdeaUpdated?.(updatedIdea);
      setValues(getInitialValues(updatedIdea));
      setIsEditingIdea(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update idea");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setValues(getInitialValues(idea));
    setIsEditingIdea(false);
    setError(null);
  };

  const handleEventSave = async () => {
    if (!selectedEvent) {
      return;
    }
    setEventSaving(true);
    setEventError(null);
    try {
      const payload = {
        description:
          eventDescription.trim() === "" ? null : eventDescription.trim(),
        status: eventStatus ?? "NOT_STARTED",
      };
      const updatedEvent = await putScheduledPost(selectedEvent.id, payload);
      onEventUpdated?.(updatedEvent);
      setEventDescription(updatedEvent.description ?? "");
      setEventStatus(updatedEvent.status ?? "NOT_STARTED");
      setEventEditingField(null);
    } catch (err) {
      setEventError(
        err instanceof Error ? err.message : "Failed to update scheduled post"
      );
    } finally {
      setEventSaving(false);
    }
  };

  const cancelEventEdit = () => {
    setEventDescription(selectedEvent?.description ?? "");
    setEventStatus(selectedEvent?.status ?? "NOT_STARTED");
    setEventEditingField(null);
    setEventError(null);
  };

  const difficultyOptions: { value: Idea["difficulty"]; label: string }[] = [
    { value: 1, label: "Easy (1)" },
    { value: 2, label: "Medium (2)" },
    { value: 3, label: "Hard (3)" },
  ];

  const getDifficultyLabel = (value?: Idea["difficulty"]) =>
    difficultyOptions.find((option) => option.value === value)?.label ??
    "Medium (2)";

  const statusOptions: { value: ScheduledPostStatus; label: string }[] = [
    { value: "NOT_STARTED", label: "Not started" },
    { value: "PREPARING", label: "Preparing" },
    { value: "READY", label: "Ready to post" },
    { value: "POSTED", label: "Posted" },
  ];

  const getStatusLabel = (value?: ScheduledPostStatus) =>
    statusOptions.find((option) => option.value === value)?.label ??
    "Not started";

  const formatLastPostedDate = (dateString?: string | null) => {
    if (!dateString) {
      return "Never";
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "Never";
    }
    return date.toLocaleDateString();
  };

  const renderDescriptionContent = (
    description?: string,
    emptyLabel = "No description yet"
  ): ReactNode => {
    if (!description || description.trim().length === 0) {
      return <span className={s.emptyDescription}>{emptyLabel}</span>;
    }

    const lines = description.split(/\r?\n/);
    const nodes: ReactNode[] = [];
    let listItems: string[] = [];
    let paragraphLines: string[] = [];
    let keyIndex = 0;

    const flushParagraph = () => {
      if (paragraphLines.length === 0) {
        return;
      }
      nodes.push(
        <p key={`paragraph-${keyIndex++}`} className={s.descriptionParagraph}>
          {paragraphLines.map((line, index) => (
            <span key={index}>
              {line}
              {index < paragraphLines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
      paragraphLines = [];
    };

    const flushList = () => {
      if (listItems.length === 0) {
        return;
      }
      nodes.push(
        <ul key={`list-${keyIndex++}`} className={s.descriptionList}>
          {listItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
      if (bulletMatch) {
        flushParagraph();
        listItems.push(bulletMatch[1]);
        return;
      }

      flushList();
      paragraphLines.push(line);
    });

    flushParagraph();
    flushList();

    return nodes;
  };

  const renderFieldInput = (field: EditableField) => {
    if (field === "title") {
      return (
        <input
          type="text"
          value={values.title}
          onChange={(event) => handleChange("title", event.target.value)}
          className={s.textInput}
        />
      );
    }

    if (field === "description") {
      return (
        <textarea
          value={values.description}
          onChange={(event) => handleChange("description", event.target.value)}
          className={s.textArea}
          rows={4}
        />
      );
    }

    if (field === "difficulty") {
      return (
        <select
          value={values.difficulty}
          onChange={(event) =>
            handleChange(
              "difficulty",
              Number(event.target.value) as Idea["difficulty"]
            )
          }
          className={s.selectInput}
        >
          {difficultyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field === "platform") {
      return (
        <select
          value={values.platform}
          onChange={(event) =>
            handleChange("platform", event.target.value as Idea["platform"])
          }
          className={s.selectInput}
        >
          <option value="BOOKTOK">BookTok</option>
          <option value="DEVTOK">DevTok</option>
        </select>
      );
    }

    return (
      <select
        value={values.status}
        onChange={(event) =>
          handleChange("status", event.target.value as Idea["status"])
        }
        className={s.selectInput}
      >
        <option value="IDEA">Idea</option>
        <option value="PLANNED">Planned</option>
        <option value="DONE">Done</option>
      </select>
    );
  };

  const renderIdeaForm = () => (
    <div className={s.ideaEditForm}>
      <label className={s.formControl}>
        <span>Title</span>
        {renderFieldInput("title")}
      </label>
      <label className={s.formControl}>
        <span>Description</span>
        {renderFieldInput("description")}
      </label>
      <label className={s.formControl}>
        <span>Platform</span>
        {renderFieldInput("platform")}
      </label>
      <label className={s.formControl}>
        <span>Difficulty</span>
        {renderFieldInput("difficulty")}
      </label>
      <label className={s.formControl}>
        <span>Status</span>
        {renderFieldInput("status")}
      </label>
    </div>
  );

  const formattedDate = useMemo(() => formatDrawerDate(date), [date]);

  return (
    <div className={s.drawerView}>
      <CloseButton
        onClick={(event) => {
          event.preventDefault();
          setIsDrawerOpen(false);
        }}
      />
      <div className={s.drawerHeader}>
        <span className={s.drawerHeaderPrimary}>{formattedDate.primary}</span>
        {formattedDate.secondary && (
          <span className={s.drawerHeaderSecondary}>
            {formattedDate.secondary}
          </span>
        )}
      </div>
      {idea && (
        <div className={s.ideaDetails}>
          <div className={s.ideaSummary}>
            <div className={s.ideaSummaryTop}>
              <div className={s.ideaSummaryInfo}>
                <p className={s.sectionLabel}>Idea overview</p>
                <h2 className={s.ideaTitle}>{idea.title || "Untitled idea"}</h2>
                <div className={s.ideaSummaryTags}>
                  <span
                    className={`${s.badge} ${
                      idea.platform === "BOOKTOK"
                        ? s.badgeBooktok
                        : s.badgeDevtok
                    }`}
                  >
                    {idea.platform === "BOOKTOK" ? "BookTok" : "DevTok"}
                  </span>
                  <span className={`${s.badge} ${s.badgeStatus}`}>
                    {idea.status}
                  </span>
                  <span className={`${s.badge} ${s.badgeDifficulty}`}>
                    {getDifficultyLabel(idea.difficulty)}
                  </span>
                </div>
                <div className={s.ideaDescriptionBlock}>
                  {idea.description ? (
                    <div className={s.descriptionRichText}>
                      {renderDescriptionContent(idea.description)}
                    </div>
                  ) : (
                    <span className={s.emptyDescription}>
                      No description yet
                    </span>
                  )}
                </div>
              </div>
              <div className={s.ideaSummaryStats}>
                <div>
                  <span className={s.statsLabel}>Times posted</span>
                  <strong>{idea.scheduledPostsCount ?? 0}</strong>
                </div>
                <div>
                  <span className={s.statsLabel}>Last posted</span>
                  <strong>
                    {formatLastPostedDate(idea.lastScheduledPostDate)}
                  </strong>
                </div>
              </div>
            </div>
            {isEditingIdea && renderIdeaForm()}
            <div className={s.ideaSummaryActions}>
              {isEditingIdea ? (
                <button
                  type="button"
                  className={s.summaryButton}
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                className={`${s.summaryButton} ${s.summaryButtonPrimary}`}
                onClick={() => {
                  if (!isEditingIdea) {
                    setIsEditingIdea(true);
                    setError(null);
                  } else {
                    handleSave();
                  }
                }}
                disabled={isSaving}
              >
                {isEditingIdea
                  ? isSaving
                    ? "Saving…"
                    : "Save idea"
                  : "Edit idea"}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className={s.errorMessage}>{error}</p>}
      {selectedEvent && (
        <div className={s.scheduledSection}>
          <h3 className={s.sectionHeading}>Scheduled Post</h3>
          <div className={s.fieldRow}>
            <div className={s.fieldLabel}>Date</div>
            <div className={s.fieldContent}>
              <span className={s.fieldValue}>
                {selectedEvent.date || selectedEvent.start
                  ? new Date(
                      selectedEvent.date ?? selectedEvent.start ?? ""
                    ).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
          <div className={s.fieldRow}>
            <div className={s.fieldLabel}>Post notes</div>
            <div className={s.fieldContent}>
              {eventEditingField === "notes" ? (
                <div className={s.fieldForm}>
                  <textarea
                    value={eventDescription}
                    onChange={(event) =>
                      setEventDescription(event.target.value)
                    }
                    className={s.textArea}
                    rows={4}
                  />
                  <div className={s.fieldActions}>
                    <button
                      type="button"
                      onClick={handleEventSave}
                      disabled={eventSaving}
                      className={s.saveButton}
                    >
                      {eventSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEventEdit}
                      disabled={eventSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={s.descriptionRichText}>
                    {renderDescriptionContent(
                      selectedEvent.description ?? "",
                      "No notes yet"
                    )}
                  </div>
                  <button
                    type="button"
                    className={s.editButton}
                    onClick={() => setEventEditingField("notes")}
                    disabled={eventSaving}
                    aria-label="Edit post notes"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          </div>
          <div className={s.fieldRow}>
            <div className={s.fieldLabel}>Post status</div>
            <div className={s.fieldContent}>
              {eventEditingField === "status" ? (
                <div className={s.fieldForm}>
                  <select
                    value={eventStatus}
                    onChange={(event) =>
                      setEventStatus(event.target.value as ScheduledPostStatus)
                    }
                    className={s.selectInput}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className={s.fieldActions}>
                    <button
                      type="button"
                      onClick={handleEventSave}
                      disabled={eventSaving}
                      className={s.saveButton}
                    >
                      {eventSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEventEdit}
                      disabled={eventSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={s.fieldValue}>
                    {getStatusLabel(eventStatus ?? "NOT_STARTED")}
                  </span>
                  <button
                    type="button"
                    className={s.editButton}
                    onClick={() => setEventEditingField("status")}
                    disabled={eventSaving}
                    aria-label="Edit post status"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {eventError && <p className={s.errorMessage}>{eventError}</p>}
      {hasDateIdeas && (
        <div className={s.ideaList}>
          <h3 className={s.sectionHeading}>Ideas scheduled this day</h3>
          <ul>
            {dateIdeas.map((calendarEvent) => (
              <li key={calendarEvent.id}>
                <button
                  type="button"
                  className={`${s.eventListButton} ${
                    selectedEvent?.id === calendarEvent.id
                      ? s.eventListButtonActive
                      : ""
                  }`}
                  onClick={() => onEventSelect?.(calendarEvent)}
                >
                  <strong>{calendarEvent.idea.title}</strong>
                  <p>
                    {calendarEvent.description ??
                      calendarEvent.idea.description ??
                      "No description yet"}
                  </p>
                  <span className={s.eventStatusText}>
                    Status:{" "}
                    {getStatusLabel(calendarEvent.status ?? "NOT_STARTED")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!hasDateIdeas && !idea && <p>No idea scheduled for this date.</p>}
    </div>
  );
};
