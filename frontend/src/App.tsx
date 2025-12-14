import { DisplayIdeas } from "./components/DisplayIdeas";
import { AddIdeasForm } from "./components/AddIdeasForm";
import { IdeasProvider } from "./context/IdeasProvider";
import { CalendarView } from "./components/CalendarView";
import { useState } from "react";
import { DrawerView } from "./components/DrawerView";
import s from "./App.module.css";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  return (
    <IdeasProvider>
      <div className={s.App}>
        <div>
          <CalendarView setIsDrawerOpen={setIsDrawerOpen} setSelectedDate={setSelectedDate} />
          <DisplayIdeas />
          <AddIdeasForm />
        </div>
        {isDrawerOpen && <DrawerView setIsDrawerOpen={setIsDrawerOpen} date={selectedDate} />}
      </div>
    </IdeasProvider>
  );
}

export default App;
