import { DisplayIdeas } from "./components/DisplayIdeas";
import { AddIdeasForm } from "./components/AddIdeasForm";
import { IdeasProvider } from "./context/IdeasProvider";
import { CalendarView } from "./components/CalendarView";
import { useState } from "react";
import { DrawerView } from "./components/DrawerView";
import s from "./App.module.css";
import type { CalendarEvent } from "./types/calendar";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [selectedIdea, setSelectedIdea] = useState<CalendarEvent | null>(null);
  const [selectedDateIdeas, setSelectedDateIdeas] = useState<CalendarEvent[]>(
    []
  );

  return (
    <IdeasProvider>
      <div className={s.App}>
        <div className={s.container}>
          <CalendarView
            setSelectedDateIdeas={setSelectedDateIdeas}
            setSelectedIdea={setSelectedIdea}
            setIsDrawerOpen={setIsDrawerOpen}
            setSelectedDate={setSelectedDate}
          />
          <DisplayIdeas />
          <AddIdeasForm />
        </div>
        {isDrawerOpen && (
          <DrawerView
            setIsDrawerOpen={setIsDrawerOpen}
            date={selectedDate}
            idea={selectedIdea}
            dateIdeas={selectedDateIdeas}
          />
        )}
      </div>
    </IdeasProvider>
  );
}

export default App;
