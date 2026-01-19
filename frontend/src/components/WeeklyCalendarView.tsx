import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getScheduledPosts } from "../api/getScheduledPosts";
import type { CalendarEvent } from "../types/calendar";
import type { Idea } from "../api/getIdeas";
import s from "./WeeklyCalendarView.module.css";

type WeeklyCalendarViewProps = {
  setIsDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedDate: Dispatch<SetStateAction<string | undefined>>;
  setSelectedIdea: Dispatch<SetStateAction<Idea | null>>;
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>;
  setSelectedDateIdeas: Dispatch<SetStateAction<CalendarEvent[]>>;
  refreshToken: number;
};

const statusLabelMap: Record<NonNullable<CalendarEvent["status"]>, string> = {
  NOT_STARTED: "Not started",
  PREPARING: "Preparing",
  READY: "Ready to post",
  POSTED: "Posted",
};

const platformLabelMap = {
  BOOKTOK: "BookTok",
  DEVTOK: "DevTok",
} as const;

const getDateKey = (date: Date) => {
  const timezoneAdjusted = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000
  );
  return timezoneAdjusted.toISOString().split("T")[0];
};

const getWeekStart = (reference: Date) => {
  const day = reference.getDay();
  const diff = (day + 6) % 7;
  const start = new Date(reference);
  start.setDate(reference.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const buildWeekDays = (reference: Date) => {
  const start = getWeekStart(reference);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

export function WeeklyCalendarView({
  setIsDrawerOpen,
  setSelectedDate,
  setSelectedIdea,
  setSelectedEvent,
  setSelectedDateIdeas,
  refreshToken,
}: WeeklyCalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  const refreshScheduledPosts = useCallback(async () => {
    const data = await getScheduledPosts();
    setEvents(data);
  }, []);

  useEffect(() => {
    refreshScheduledPosts().catch((error) => {
      console.error("Failed to load scheduled posts", error);
    });
  }, [refreshScheduledPosts, refreshToken]);

  const weekDays = useMemo(() => buildWeekDays(referenceDate), [referenceDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = (event.date ?? event.start ?? "").slice(0, 10);
      if (!key) {
        return;
      }
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [events]);

  const openDrawer = (dateKey: string, event?: CalendarEvent) => {
    setSelectedDate(dateKey);
    const dayEvents = eventsByDate.get(dateKey) ?? [];
    setSelectedDateIdeas(dayEvents);

    if (event) {
      setSelectedIdea(event.idea);
      setSelectedEvent(event);
    } else {
      setSelectedIdea(null);
      setSelectedEvent(null);
    }

    setIsDrawerOpen(true);
  };

  const goToWeek = (delta: number) => {
    setReferenceDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return next;
    });
  };

  const today = new Date();
  const todayKey = getDateKey(today);
  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (!start || !end) return "";
    const startLabel = start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const endLabel = end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
    });
    const yearLabel =
      start.getFullYear() === end.getFullYear()
        ? ` ${start.getFullYear()}`
        : "";
    return `${startLabel} — ${endLabel}${yearLabel}`;
  }, [weekDays]);

  return (
    <div className={s.wrapper}>
      <header className={s.header}>
        <div className={s.headerControls}>
          <button type="button" onClick={() => goToWeek(-1)}>
            ‹
          </button>
          <div className={s.headerTitle}>{weekLabel}</div>
          <button type="button" onClick={() => goToWeek(1)}>
            ›
          </button>
        </div>
        <button
          type="button"
          className={s.todayButton}
          onClick={() => setReferenceDate(new Date())}
        >
          Today
        </button>
      </header>
      <div className={s.dayList}>
        {weekDays.map((day) => {
          const dateKey = getDateKey(day);
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const visibleEvents = dayEvents.slice(0, 3);
          const hiddenCount = Math.max(0, dayEvents.length - visibleEvents.length);
          const isToday = dateKey === todayKey;
          return (
            <div
              key={dateKey}
              className={`${s.dayCard} ${isToday ? s.dayCardToday : ""}`}
              onClick={() => openDrawer(dateKey)}
            >
              <div className={s.dayHeader}>
                <div className={s.dayTitle}>
                  <span className={s.dayName}>
                    {day.toLocaleDateString(undefined, { weekday: "long" })}
                  </span>
                  <span className={s.dayDate}>
                    {day.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span className={s.dayCount}>
                  {dayEvents.length} {dayEvents.length === 1 ? "post" : "posts"}
                </span>
              </div>
              <div className={s.eventList}>
                {visibleEvents.map((eventItem) => {
                  const statusLabel = eventItem.status
                    ? statusLabelMap[eventItem.status]
                    : "No status";
                  return (
                    <button
                      key={eventItem.id}
                      type="button"
                      className={s.eventChip}
                      onClick={(event) => {
                        event.stopPropagation();
                        const date =
                          (eventItem.date ?? eventItem.start)?.slice(0, 10) ??
                          dateKey;
                        openDrawer(date, eventItem);
                      }}
                    >
                      <span
                        className={`${s.statusDot} ${
                          eventItem.status
                            ? s[`status-${eventItem.status}`]
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                      <span className={s.eventTitle}>
                        {eventItem.idea.title}
                      </span>
                      <span className={s.platformTag}>
                        {platformLabelMap[eventItem.idea.platform]}
                      </span>
                      <span className={s.statusLabel}>{statusLabel}</span>
                    </button>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className={s.moreIndicator}>+{hiddenCount} more</div>
                )}
                {dayEvents.length === 0 && (
                  <div className={s.emptyState}>No scheduled posts</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
