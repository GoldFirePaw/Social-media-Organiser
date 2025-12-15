import { useEffect, useMemo, useState } from 'react'
import { CloseButton } from './reusableComponents/CloseButton'
import s from './DrawerView.module.css'
import type { CalendarEvent } from '../types/calendar'
import type { Idea } from '../api/getIdeas'
import { updateIdea } from '../api/updateIdea'
import { useIdeas } from '../hooks/useIdeas'
import { putScheduledPost } from '../api/putScheduledPost'

type EditableField = 'title' | 'description' | 'platform' | 'status'

type EditableValues = {
  title: string
  description: string
  platform: Idea['platform']
  status: Idea['status']
}

const getInitialValues = (idea: Idea | null): EditableValues => ({
  title: idea?.title ?? '',
  description: idea?.description ?? '',
  platform: idea?.platform ?? 'BOOKTOK',
  status: idea?.status ?? 'IDEA',
})

type DrawerViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void
  date?: string
  idea: Idea | null
  dateIdeas: CalendarEvent[]
  selectedEvent: CalendarEvent | null
  onIdeaUpdated?: (idea: Idea) => void
  onEventUpdated?: (updatedEvent: CalendarEvent) => void
  onEventSelect?: (calendarEvent: CalendarEvent) => void
}

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
  const hasDateIdeas = dateIdeas.length > 0
  const { refresh } = useIdeas()
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [values, setValues] = useState<EditableValues>(() => getInitialValues(idea))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventDescription, setEventDescription] = useState(selectedEvent?.description ?? '')
  const [eventEditing, setEventEditing] = useState(false)
  const [eventSaving, setEventSaving] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)

  useEffect(() => {
    setEditingField(null)
    setValues(getInitialValues(idea))
    setError(null)
  }, [idea?.id])

  useEffect(() => {
    setEventEditing(false)
    setEventDescription(selectedEvent?.description ?? '')
    setEventError(null)
  }, [selectedEvent?.id])

  const hasIdea = Boolean(idea)

  const handleChange = <T extends EditableField>(field: T, newValue: EditableValues[T]) => {
    setValues((prev) => ({
      ...prev,
      [field]: newValue,
    }))
  }

  const handleSave = async () => {
    if (!idea) {
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() === '' ? null : values.description.trim(),
        platform: values.platform,
        status: values.status,
      }
      const updatedIdea = await updateIdea(idea.id, payload)
      await refresh()
      onIdeaUpdated?.(updatedIdea)
      setValues(getInitialValues(updatedIdea))
      setEditingField(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update idea')
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    setValues(getInitialValues(idea))
    setEditingField(null)
    setError(null)
  }

  const handleEventSave = async () => {
    if (!selectedEvent) {
      return
    }
    setEventSaving(true)
    setEventError(null)
    try {
      const payload = {
        description: eventDescription.trim() === '' ? null : eventDescription.trim(),
      }
      const updatedEvent = await putScheduledPost(selectedEvent.id, payload)
      onEventUpdated?.(updatedEvent)
      setEventDescription(updatedEvent.description ?? '')
      setEventEditing(false)
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Failed to update scheduled post')
    } finally {
      setEventSaving(false)
    }
  }

  const cancelEventEdit = () => {
    setEventDescription(selectedEvent?.description ?? '')
    setEventEditing(false)
    setEventError(null)
  }

  const renderValue = (field: EditableField) => {
    if (!idea) {
      return '—'
    }
    if (field === 'description') {
      return idea.description && idea.description.trim().length > 0 ? idea.description : 'No description yet'
    }
    return idea[field]
  }

  const editButtonsDisabled = !hasIdea || isSaving

  const editButton = (field: EditableField) => (
    <button
      type="button"
      className={s.editButton}
      disabled={editButtonsDisabled}
      onClick={() => setEditingField(field)}
      aria-label={`Edit ${field}`}
    >
      ✏️
    </button>
  )

  const fieldForm = (field: EditableField) => {
    const commonActions = (
      <div className={s.fieldActions}>
        <button type="button" onClick={handleSave} disabled={isSaving} className={s.saveButton}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={cancelEdit} disabled={isSaving}>
          Cancel
        </button>
      </div>
    )

    if (field === 'title') {
      return (
        <div className={s.fieldForm}>
          <input
            type="text"
            value={values.title}
            onChange={(event) => handleChange('title', event.target.value)}
            className={s.textInput}
          />
          {commonActions}
        </div>
      )
    }

    if (field === 'description') {
      return (
        <div className={s.fieldForm}>
          <textarea
            value={values.description}
            onChange={(event) => handleChange('description', event.target.value)}
            className={s.textArea}
            rows={4}
          />
          {commonActions}
        </div>
      )
    }

    if (field === 'platform') {
      return (
        <div className={s.fieldForm}>
          <select
            value={values.platform}
            onChange={(event) => handleChange('platform', event.target.value as Idea['platform'])}
            className={s.selectInput}
          >
            <option value="BOOKTOK">BookTok</option>
            <option value="DEVTOK">DevTok</option>
          </select>
          {commonActions}
        </div>
      )
    }

    return (
      <div className={s.fieldForm}>
        <select
          value={values.status}
          onChange={(event) => handleChange('status', event.target.value as Idea['status'])}
          className={s.selectInput}
        >
          <option value="IDEA">Idea</option>
          <option value="PLANNED">Planned</option>
          <option value="DONE">Done</option>
        </select>
        {commonActions}
      </div>
    )
  }

  const fields = useMemo(
    () =>
      [
        { field: 'title' as const, label: 'Title' },
        { field: 'description' as const, label: 'Description' },
        { field: 'platform' as const, label: 'Platform' },
        { field: 'status' as const, label: 'Status' },
      ] satisfies Array<{ field: EditableField; label: string }>,
    [],
  )

  return (
    <div className={s.drawerView}>
      <CloseButton onClick={() => setIsDrawerOpen(false)} />
      <div className={s.drawerHeader}>{date ?? 'Select a date'}</div>
      {idea && (
        <div className={s.ideaDetails}>
          {fields.map(({ field, label }) => (
            <div key={field} className={s.fieldRow}>
              <div className={s.fieldLabel}>{label}</div>
              <div className={s.fieldContent}>
                {editingField === field ? (
                  fieldForm(field)
                ) : (
                  <>
                    <span className={s.fieldValue}>{renderValue(field)}</span>
                    {editButton(field)}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className={s.errorMessage}>{error}</p>}
      {selectedEvent && (
        <div className={s.scheduledSection}>
          <h3>Scheduled Post</h3>
          <div className={s.fieldRow}>
            <div className={s.fieldLabel}>Date</div>
            <div className={s.fieldContent}>
              <span className={s.fieldValue}>
                {selectedEvent.date || selectedEvent.start
                  ? new Date(selectedEvent.date ?? selectedEvent.start ?? '').toLocaleDateString()
                  : '—'}
              </span>
            </div>
          </div>
          <div className={s.fieldRow}>
            <div className={s.fieldLabel}>Post notes</div>
            <div className={s.fieldContent}>
              {eventEditing ? (
                <div className={s.fieldForm}>
                  <textarea
                    value={eventDescription}
                    onChange={(event) => setEventDescription(event.target.value)}
                    className={s.textArea}
                    rows={4}
                  />
                  <div className={s.fieldActions}>
                    <button type="button" onClick={handleEventSave} disabled={eventSaving} className={s.saveButton}>
                      {eventSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={cancelEventEdit} disabled={eventSaving}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={s.fieldValue}>
                    {selectedEvent.description && selectedEvent.description.trim().length > 0
                      ? selectedEvent.description
                      : 'No notes yet'}
                  </span>
                  <button
                    type="button"
                    className={s.editButton}
                    onClick={() => setEventEditing(true)}
                    disabled={eventSaving}
                    aria-label="Edit post notes"
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
          <h3>Ideas scheduled this day</h3>
          <ul>
            {dateIdeas.map((calendarEvent) => (
              <li key={calendarEvent.id}>
                <button
                  type="button"
                  className={`${s.eventListButton} ${
                    selectedEvent?.id === calendarEvent.id ? s.eventListButtonActive : ''
                  }`}
                  onClick={() => onEventSelect?.(calendarEvent)}
                >
                  <strong>{calendarEvent.idea.title}</strong>
                  <p>{calendarEvent.description ?? calendarEvent.idea.description ?? 'No description yet'}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!hasDateIdeas && !idea && <p>No idea scheduled for this date.</p>}
    </div>
  )
}
