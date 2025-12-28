import { useCallback, useEffect, useMemo, useState } from 'react'
import { getScheduledPosts } from '../api/getScheduledPosts'
import type { CalendarEvent } from '../types/calendar'
import { Card } from './reusableComponents/Card'
import { Tag } from './reusableComponents/Tag'
import s from './FilmingQueue.module.css'

type FilmingQueueProps = {
  refreshToken: number
  variant?: 'standalone' | 'embedded'
}

type QueueItem = {
  event: CalendarEvent
  isoDate: string | null
  date: Date | null
  sortKey: number
}

const filmingStatuses: Array<NonNullable<CalendarEvent['status']>> = ['NOT_STARTED', 'PREPARING']

const statusLabels: Record<NonNullable<CalendarEvent['status']>, string> = {
  NOT_STARTED: 'Not started',
  PREPARING: 'Preparing',
  READY: 'Ready to post',
  POSTED: 'Posted',
}

const platformLabelMap = {
  BOOKTOK: 'BookTok',
  DEVTOK: 'DevTok',
} as const

const statusClassMap: Record<NonNullable<CalendarEvent['status']>, string> = {
  NOT_STARTED: s.statusNotStarted,
  PREPARING: s.statusPreparing,
  READY: s.statusReady,
  POSTED: s.statusPosted,
}

export function FilmingQueue({ refreshToken, variant = 'standalone' }: FilmingQueueProps) {
  const [posts, setPosts] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getScheduledPosts()
      setPosts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts().catch(() => {
      // Errors handled in state
    })
  }, [loadPosts, refreshToken])

  const queueItems = useMemo<QueueItem[]>(() => {
    return posts
      .filter((event) => {
        const status = event.status ?? 'NOT_STARTED'
        return filmingStatuses.includes(status)
      })
      .map((event) => {
        const isoDate = event.date ?? event.start ?? null
        const date = isoDate ? new Date(isoDate) : null
        const sortKey = date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.MAX_SAFE_INTEGER
        return { event, isoDate, date, sortKey }
      })
      .sort((a, b) => a.sortKey - b.sortKey)
  }, [posts])

  const formatQueueDate = (isoDate: string | null) => {
    if (!isoDate) {
      return { label: 'No date', relative: 'Set a date to plan filming' }
    }
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) {
      return { label: 'No date', relative: 'Set a date to plan filming' }
    }
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

    let relative: string
    if (diffDays === 0) relative = 'Today'
    else if (diffDays === 1) relative = 'Tomorrow'
    else if (diffDays === -1) relative = 'Yesterday'
    else if (diffDays > 1) relative = `In ${diffDays} days`
    else relative = `${Math.abs(diffDays)} days ago`

    const label = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })

    return { label, relative }
  }

  const handleManualRefresh = () => {
    loadPosts().catch(() => {
      // Errors handled in state
    })
  }

  const refreshButton = (
    <button type="button" className={s.refreshButton} onClick={handleManualRefresh} disabled={loading}>
      {loading ? 'Refreshing…' : 'Refresh'}
    </button>
  )

  const queueBody = (() => {
    if (error && !loading) {
      return null
    }
    if (!error && queueItems.length === 0) {
      return <p className={s.emptyState}>{loading ? 'Loading queue…' : 'Everything scheduled is ready to post 🎉'}</p>
    }
    if (!error && queueItems.length > 0) {
      return (
        <ul className={s.queueList}>
          {queueItems.map(({ event, isoDate }) => {
            const status = event.status ?? 'NOT_STARTED'
            const { label, relative } = formatQueueDate(isoDate)
            const badgeClass = statusClassMap[status] ?? statusClassMap.NOT_STARTED
            return (
              <li key={event.id} className={s.queueItem}>
                <div className={s.queueHeader}>
                  <div className={s.queueDate}>
                    <span className={s.dateLabel}>{label}</span>
                    <span className={s.dateRelative}>{relative}</span>
                  </div>
                  <span className={`${s.statusBadge} ${badgeClass}`}>{statusLabels[status]}</span>
                </div>
                <div className={s.queueBody}>
                  <div className={s.titleRow}>
                    <p className={s.ideaTitle}>{event.idea.title}</p>
                    <Tag
                      label={platformLabelMap[event.idea.platform] ?? event.idea.platform}
                      color={event.idea.platform === 'BOOKTOK' ? 'blue' : 'pink'}
                    />
                  </div>
                  {event.description && <p className={s.notes}>{event.description}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )
    }
    return null
  })()

  const queueBodyWithScroll =
    queueBody && variant === 'embedded' ? <div className={s.embeddedScroll}>{queueBody}</div> : queueBody

  const content = (
    <>
      <div className={s.summary}>
        <div>
          <p className={s.summaryLabel}>Scheduled & not ready</p>
          <p className={s.summaryValue}>
            {queueItems.length} {queueItems.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
        <p className={s.summaryHint}>Shows posts marked as Not started or Preparing.</p>
      </div>
      {error && !loading && <p className={s.error}>{error}</p>}
      {queueBodyWithScroll}
    </>
  )

  if (variant === 'embedded') {
    return (
      <div className={s.embeddedWrapper}>
        <div className={s.embeddedHeader}>
          <h3 className={s.embeddedTitle}>Needs filming</h3>
          {refreshButton}
        </div>
        {content}
      </div>
    )
  }

  return (
    <Card title="Needs filming" actions={refreshButton}>
      {content}
    </Card>
  )
}
