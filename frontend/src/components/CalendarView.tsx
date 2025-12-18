import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AddIdeaToCalendar } from '../api/addIdeaToCalendar'
import { getScheduledPosts } from '../api/getScheduledPosts'
import { putScheduledPost } from '../api/putScheduledPost'
import { removeIdeaFromCalendar } from '../api/removeIdeaFromCalendar'
import type { Idea } from '../api/getIdeas'
import type { CalendarEvent } from '../types/calendar'
import s from './CalendarView.module.css'

type CalendarViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void
  setSelectedDate: (date: string | undefined) => void
  setSelectedIdea: (idea: Idea | null) => void
  setSelectedEvent: (event: CalendarEvent | null) => void
  setSelectedDateIdeas: (ideas: CalendarEvent[]) => void
  refreshToken: number
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const getDateKey = (date: Date) => {
  const timezoneAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
  return timezoneAdjusted.toISOString().split('T')[0]
}

const toISODate = (dateKey: string) => `${dateKey}T00:00:00.000Z`

const statusLabelMap: Record<NonNullable<CalendarEvent['status']>, string> = {
  NOT_STARTED: 'Not started',
  PREPARING: 'Preparing',
  READY: 'Ready to post',
  POSTED: 'Posted',
}

const buildCalendarDays = (reference: Date) => {
  const startOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const startDay = startOfMonth.getDay()
  const firstGridDate = new Date(startOfMonth)
  firstGridDate.setDate(1 - startDay)

  const days: Date[] = []
  const cursor = new Date(firstGridDate)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function CalendarView({
  setIsDrawerOpen,
  setSelectedDate,
  setSelectedIdea,
  setSelectedEvent,
  setSelectedDateIdeas,
  refreshToken,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null)
  const trashRef = useRef<HTMLDivElement | null>(null)

  const refreshScheduledPosts = useCallback(async () => {
    const data = await getScheduledPosts()
    setEvents(data)
  }, [])

  useEffect(() => {
    refreshScheduledPosts().catch((error) => {
      console.error('Failed to load scheduled posts', error)
    })
  }, [refreshScheduledPosts, refreshToken])

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const key = (event.date ?? event.start ?? '').slice(0, 10)
      if (!key) {
        return
      }
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    })
    return map
  }, [events])

  const openDrawer = (dateKey: string, event?: CalendarEvent) => {
    setSelectedDate(dateKey)
    const dayEvents = eventsByDate.get(dateKey) ?? []
    setSelectedDateIdeas(dayEvents)

    if (event) {
      setSelectedIdea(event.idea)
      setSelectedEvent(event)
    } else {
      setSelectedIdea(null)
      setSelectedEvent(null)
    }

    setIsDrawerOpen(true)
  }

  const handleDayDrop = async (event: React.DragEvent<HTMLDivElement>, dateKey: string) => {
    event.preventDefault()
    const calendarEventId = event.dataTransfer.getData('application/calendar-event')
    const ideaId = event.dataTransfer.getData('application/idea-id')
    const isoDate = toISODate(dateKey)

    if (calendarEventId) {
      try {
        await putScheduledPost(calendarEventId, { date: isoDate })
        setEvents((prev) =>
          prev.map((existing) =>
            existing.id === calendarEventId ? { ...existing, start: isoDate, date: isoDate } : existing,
          ),
        )
      } catch (error) {
        console.error('Failed to update scheduled post', error)
      }
      return
    }

    if (ideaId) {
      try {
        const newEvent = await AddIdeaToCalendar(isoDate, ideaId)
        setEvents((prev) => [
          ...prev,
          {
            id: newEvent.id,
            title: newEvent.idea.title,
            start: newEvent.date,
            date: newEvent.date,
            description: newEvent.description,
            status: newEvent.status,
            idea: newEvent.idea,
          },
        ])
      } catch (error) {
        console.error('Failed to add idea to calendar', error)
      }
    }
  }

  const handleEventDragStart = (eventObj: CalendarEvent, dragEvent: React.DragEvent<HTMLButtonElement>) => {
    setDraggingEventId(eventObj.id)
    dragEvent.dataTransfer.setData('application/calendar-event', eventObj.id)
    dragEvent.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggingEventId(null)
  }

  const handleTrashDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!draggingEventId) {
      return
    }
    try {
      await removeIdeaFromCalendar(draggingEventId)
      await refreshScheduledPosts()
    } catch (error) {
      console.error('Failed to remove idea from calendar', error)
    } finally {
      setDraggingEventId(null)
    }
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const todayKey = getDateKey(new Date())

  const getStatusDotClass = (status?: CalendarEvent['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return s.statusDotNotStarted
      case 'PREPARING':
        return s.statusDotPreparing
      case 'READY':
        return s.statusDotReady
      case 'POSTED':
        return s.statusDotPosted
      default:
        return ''
    }
  }

  const getStatusLabel = (status?: CalendarEvent['status']) => {
    if (!status) {
      return 'No status yet'
    }
    return statusLabelMap[status] ?? 'No status yet'
  }

  return (
    <div className={s.calendarWrapper}>
      <header className={s.header}>
        <button type="button" onClick={() => changeMonth(-1)}>
          ‹
        </button>
        <div>
          {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
        </div>
        <button type="button" onClick={() => changeMonth(1)}>
          ›
        </button>
      </header>
      <div className={s.weekdays}>
        {dayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={s.grid}>
        {calendarDays.map((day) => {
          const dateKey = getDateKey(day)
          const dayEvents = eventsByDate.get(dateKey) ?? []
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isToday = dateKey === todayKey

          return (
            <div
              key={dateKey + day.getDate()}
              className={`${s.day} ${isCurrentMonth ? '' : s.outsideMonth} ${isToday ? s.today : ''}`}
              onClick={() => openDrawer(dateKey)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDayDrop(event, dateKey)}
            >
              <span className={s.dateNumber}>{day.getDate()}</span>
              <div className={s.events}>
                {dayEvents.map((eventItem) => {
                  const baseTitle = (eventItem.idea.title ?? eventItem.title ?? '').trim()
                  const shouldShowDescription =
                    Boolean(eventItem.description) && /^(review|unboxing)$/i.test(baseTitle)
                  return (
                    <button
                      key={eventItem.id}
                      className={`${s.event} ${
                        eventItem.idea.platform === 'BOOKTOK' ? s.booktok : s.devtok
                      }`}
                      title={`${eventItem.idea.title} • ${getStatusLabel(eventItem.status)}`}
                      draggable
                      onDragStart={(dragEvent) => handleEventDragStart(eventItem, dragEvent)}
                      onDragEnd={handleDragEnd}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        const date = (eventItem.date ?? eventItem.start)?.slice(0, 10) ?? dateKey
                        openDrawer(date, eventItem)
                      }}
                    >
                      <span className={`${s.statusDot} ${getStatusDotClass(eventItem.status)}`} aria-hidden="true" />
                      <span className={s.eventTitle}>
                        {eventItem.idea.title}
                        {shouldShowDescription && (
                          <span className={s.eventDescription}>{eventItem.description}</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {draggingEventId && (
        <div className={s.trashBin} ref={trashRef} onDragOver={(event) => event.preventDefault()} onDrop={handleTrashDrop}>
          🗑️ Supprimer
        </div>
      )}
    </div>
  )
}
