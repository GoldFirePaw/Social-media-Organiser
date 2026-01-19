import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "../types/calendar";
import type { Idea } from "../api/getIdeas";
import { DrawerView } from "./DrawerView";
import s from "./MobileDrawer.module.css";

type MobileDrawerProps = {
  setIsDrawerOpen: (isOpen: boolean) => void;
  setSelectedIdea: (idea: Idea | null) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  date?: string;
  idea: Idea | null;
  dateIdeas: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  onIdeaUpdated?: (idea: Idea) => void;
  onEventUpdated?: (updatedEvent: CalendarEvent) => void;
  onEventSelect?: (calendarEvent: CalendarEvent) => void;
  onEventsChange?: () => void;
};

type MobileView = "day" | "post" | "idea";

const getInitialView = (idea: Idea | null, event: CalendarEvent | null): MobileView => {
  if (event) return "post";
  if (idea) return "idea";
  return "day";
};

export function MobileDrawer({
  setIsDrawerOpen,
  setSelectedIdea,
  setSelectedEvent,
  date,
  idea,
  dateIdeas,
  selectedEvent,
  onIdeaUpdated,
  onEventUpdated,
  onEventSelect,
  onEventsChange,
}: MobileDrawerProps) {
  const [view, setView] = useState<MobileView>(() => getInitialView(idea, selectedEvent));

  useEffect(() => {
    if (!selectedEvent && !idea) {
      setView("day");
      return;
    }
    if (!selectedEvent && idea) {
      setView("idea");
      return;
    }
    if (selectedEvent && view === "day") {
      setView("post");
    }
  }, [idea, selectedEvent, view]);

  const handleClose = () => {
    setIsDrawerOpen(false);
  };

  const handleBack = () => {
    if (view === "idea" && selectedEvent) {
      setView("post");
      return;
    }
    if (view === "post") {
      setSelectedEvent(null);
      setSelectedIdea(null);
      setView("day");
      return;
    }
    if (view === "idea") {
      setIsDrawerOpen(false);
      return;
    }
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const headerTitle = useMemo(() => {
    switch (view) {
      case "post":
        return "Scheduled post";
      case "idea":
        return "Idea details";
      default:
        return "Day overview";
    }
  }, [view]);

  return (
    <div
      className={s.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className={s.sheet} role="dialog" aria-modal="true">
        <div className={s.handle} />
        <div className={s.header}>
          {view !== "day" ? (
            <button type="button" className={s.backButton} onClick={handleBack}>
              Back
            </button>
          ) : (
            <span className={s.headerSpacer} />
          )}
          <span className={s.headerTitle}>{headerTitle}</span>
          <button type="button" className={s.closeButton} onClick={handleClose}>
            Close
          </button>
        </div>
        <div className={s.content}>
          <DrawerView
            setIsDrawerOpen={setIsDrawerOpen}
            date={date}
            idea={idea}
            dateIdeas={dateIdeas}
            selectedEvent={selectedEvent}
            plannerWidth={0}
            onIdeaUpdated={onIdeaUpdated}
            onEventUpdated={onEventUpdated}
            onEventSelect={onEventSelect}
            onEventsChange={onEventsChange}
            variant="mobile"
            showCloseButton={false}
            showIdeaSection={view === "idea"}
            showScheduledSection={view === "post"}
            showDayList={view === "day"}
            onViewIdea={view === "post" ? () => setView("idea") : undefined}
          />
        </div>
      </div>
    </div>
  );
}
