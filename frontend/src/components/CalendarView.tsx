import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { AddIdeaToCalendar } from "../api/addIdeaToCalendar";
import { getScheduledPosts } from "../api/getScheduledPosts";
import type { CalendarEvent } from "../types/calendar";
import { putScheduledPost } from "../api/putScheduledPost";
import { removeIdeaFromCalendar } from "../api/removeIdeaFromCalendar";
import s from "./CalendarView.module.css";

type CalendarViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void;
  setSelectedDate: (date: string | undefined) => void;
};

export const CalendarView = ({
  setIsDrawerOpen,
  setSelectedDate,
}: CalendarViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const trashRef = useRef<HTMLDivElement | null>(null);

  const refreshScheduledPosts = useCallback(async () => {
    const data = await getScheduledPosts();
    setEvents(data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getScheduledPosts();
        if (active) {
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to load scheduled posts", error);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openDrawer = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDrawerOpen(true);
  };

  const handleEventDrop = async (
    info: Parameters<
      NonNullable<React.ComponentProps<typeof FullCalendar>["eventDrop"]>
    >[0]
  ) => {
    if (!info.event.id || !info.event.startStr) {
      return;
    }

    try {
      await putScheduledPost(info.event.id, info.event.startStr);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === info.event.id
            ? {
                ...event,
                start: info.event.startStr,
                date: info.event.startStr,
              }
            : event
        )
      );
    } catch (error) {
      console.error("Failed to update scheduled post", error);
      info.revert();
    }
  };

  const handleDrop = (date: string, id: string | undefined) => {
    if (!id) return;
    AddIdeaToCalendar(date, id)
      .then((newEvent) => {
        setEvents((prev) => [
          ...prev,
          {
            id: newEvent.id,
            title: newEvent.idea.title,
            start: newEvent.date,
            idea: newEvent.idea,
          },
        ]);
      })
      .catch((error) => {
        console.error("Failed to add idea to calendar", error);
      });
  };
  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        editable
        droppable
        eventDrop={handleEventDrop}
        drop={(info) => {
          handleDrop(info.dateStr, info.draggedEl.dataset?.id);
        }}
        dateClick={(info) => {
          openDrawer(info.dateStr);
        }}
        eventDragStart={() => {
          setIsDragging(true);
        }}
        eventDragStop={async (info) => {
          const target = trashRef.current;
          const jsEvent = info.jsEvent;
          setIsDragging(false);

          if (!target || !jsEvent) return;

          const rect = target.getBoundingClientRect();
          const { clientX, clientY } = jsEvent;

          const isInside =
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom;

          if (!isInside) return;

          const eventToRemove = events.find(
            (event) => event.id === info.event.id
          );
          if (!eventToRemove) return;

          try {
            await removeIdeaFromCalendar(eventToRemove.id);
            await refreshScheduledPosts();
          } catch (error) {
            console.error("Failed to remove idea from calendar", error);
          }
        }}
        events={events.map((event) => ({
          id: event.id,
          title: event.idea.title ?? event.title,
          start: event.date ?? event.start,
        }))}
      />
      {isDragging && (
        <div className={s.trashBin} ref={trashRef}>
          🗑️ Supprimer
        </div>
      )}
    </>
  );
};
