import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

type CalendarViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void
    setSelectedDate: (date: string | undefined) => void
}

export const CalendarView = ({setIsDrawerOpen, setSelectedDate}: CalendarViewProps) => {
    const openDrawer = (dateStr: string) => {
        setSelectedDate(dateStr);
        setIsDrawerOpen(true);
        // Logique pour ouvrir le drawer et passer la date sélectionnée
        console.log("Ouvrir le drawer pour la date :", dateStr);
      }
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      selectable
      dateClick={(info) => {
        openDrawer(info.dateStr)
        console.log('Date cliquée:', info.dateStr)
      }}
      events={[]}
    />
  )
}