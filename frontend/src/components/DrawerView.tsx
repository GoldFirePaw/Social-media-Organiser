import { CloseButton } from './reusableComponents/CloseButton'
import s from './DrawerView.module.css'
import type { CalendarEvent } from '../types/calendar'

type DrawerViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void
  date?: string
  idea: CalendarEvent | null
  dateIdeas: CalendarEvent[]
}

export const DrawerView = ({ setIsDrawerOpen, date, idea, dateIdeas }: DrawerViewProps) => {
  const showList = !idea && dateIdeas.length > 0

  return (
    <div className={s.drawerView}>
      <CloseButton onClick={() => setIsDrawerOpen(false)} />
      <div>{date ?? 'Select a date'}</div>
      {idea && (
        <div className={s.ideaDetails}>
          <h3>{idea.idea.title}</h3>
          {idea.idea.description && <p>{idea.idea.description}</p>}
          <p>
            <strong>Platform:</strong> {idea.idea.platform}
          </p>
          <p>
            <strong>Status:</strong> {idea.idea.status}
          </p>
        </div>
      )}
      {showList && (
        <div className={s.ideaList}>
          <h3>Ideas scheduled this day</h3>
          <ul>
            {dateIdeas.map((calendarEvent) => (
              <li key={calendarEvent.id}>
                <strong>{calendarEvent.idea.title}</strong>
                {calendarEvent.idea.description && <p>{calendarEvent.idea.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!idea && dateIdeas.length === 0 && <p>No idea scheduled for this date.</p>}
    </div>
  )
}
