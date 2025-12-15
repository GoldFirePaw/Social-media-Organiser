import { DisplayIdeas } from "./components/DisplayIdeas";
import { AddIdeasForm } from "./components/AddIdeasForm";
import { IdeasProvider } from "./context/IdeasProvider";
import { CalendarView } from "./components/CalendarView";
import { useState } from "react";
import { DrawerView } from "./components/DrawerView";
import s from "./App.module.css";
import type { Idea } from "./api/getIdeas";
import type { CalendarEvent } from "./types/calendar";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [selectedDateIdeas, setSelectedDateIdeas] = useState<CalendarEvent[]>(
    []
  );
  const [calendarRefreshToken, setCalendarRefreshToken] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleEventSelect = (calendarEvent: CalendarEvent) => {
    const eventDate = calendarEvent.date ?? calendarEvent.start ?? null;
    setSelectedEvent(calendarEvent);
    setSelectedIdea(calendarEvent.idea);
    setSelectedDate(eventDate ? eventDate.slice(0, 10) : undefined);
    if (!isDrawerOpen) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <IdeasProvider>
      <div className={s.App}>
        <div className={s.container}>
          <CalendarView
            setSelectedDateIdeas={setSelectedDateIdeas}
            setSelectedIdea={setSelectedIdea}
            setSelectedEvent={setSelectedEvent}
            setIsDrawerOpen={setIsDrawerOpen}
            setSelectedDate={setSelectedDate}
            refreshToken={calendarRefreshToken}
          />
          <DisplayIdeas
            onIdeaSelect={(idea) => {
              setSelectedDate(undefined);
              setSelectedDateIdeas([]);
              setSelectedIdea(idea);
              setSelectedEvent(null);
              setIsDrawerOpen(true);
            }}
          />
          <AddIdeasForm />
        </div>
        {isDrawerOpen && (
          <DrawerView
            setIsDrawerOpen={setIsDrawerOpen}
            date={selectedDate}
            idea={selectedIdea}
            dateIdeas={selectedDateIdeas}
            selectedEvent={selectedEvent}
            onIdeaUpdated={(updatedIdea) => {
              setSelectedIdea(updatedIdea);
              setSelectedEvent((event) =>
                event ? { ...event, idea: updatedIdea } : null
              );
              setSelectedDateIdeas((events) =>
                events.map((event) =>
                  event.idea.id === updatedIdea.id
                    ? { ...event, idea: updatedIdea }
                    : event
                )
              );
              setCalendarRefreshToken((token) => token + 1);
            }}
            onEventUpdated={(updatedEvent) => {
              const updatedDate = updatedEvent.date ?? updatedEvent.start ?? null;
              setSelectedEvent(updatedEvent);
              setSelectedIdea(updatedEvent.idea);
              setSelectedDate(updatedDate ? updatedDate.slice(0, 10) : undefined);
              setSelectedDateIdeas((events) =>
                events.map((event) =>
                  event.id === updatedEvent.id ? updatedEvent : event
                )
              );
              setCalendarRefreshToken((token) => token + 1);
            }}
            onEventSelect={handleEventSelect}
          />
        )}
      </div>
    </IdeasProvider>
  );
}

export default App;
