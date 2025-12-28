import { useState } from 'react'
import s from './ExportImport.module.css'

type ImportMode = 'sync' | 'replace'

type ExportedPost = {
  id?: string
  ideaId?: string
  date: string
  description?: string | null
  status?: string
  createdAt?: string
}

type ExportedIdea = {
  id?: string
  title: string
  description?: string | null
  platform?: string
  status?: string
  difficulty?: number
  scheduledPosts?: ExportedPost[]
  createdAt?: string
  updatedAt?: string
}

type ExportPayload = {
  ideas?: ExportedIdea[]
  scheduledPosts?: ExportedPost[]
}

type PendingData = {
  raw: ExportPayload
  counts: { ideas: number; posts: number }
}

type Props = {
  onImportComplete?: () => void
}

export const ExportImport: React.FC<Props> = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // preview / selection states
  const [pendingData, setPendingData] = useState<PendingData | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [mode, setMode] = useState<ImportMode>('sync')
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)
  const [pruneMissing, setPruneMissing] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('http://localhost:3001/export', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Export failed')

      const data = await res.json()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ideas-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setMessage('✓ Export successful')
    } catch {
      setMessage('✗ Export failed')
    } finally {
      setLoading(false)
    }
  }

  const openImportPreview = async (file: File) => {
    setMessage(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown

      // try to shape the parsed data into ExportPayload
      const data = (parsed && typeof parsed === 'object') ? (parsed as ExportPayload) : {}

      // basic counts for preview
      const ideas: ExportedIdea[] = Array.isArray(data.ideas) ? data.ideas : (Array.isArray(parsed) ? (parsed as ExportedIdea[]) : [])
      const posts: ExportedPost[] = Array.isArray(data.scheduledPosts)
        ? data.scheduledPosts
        : ideas.flatMap((i: ExportedIdea) => (Array.isArray(i.scheduledPosts) ? i.scheduledPosts : []))

      setPendingData({ raw: data, counts: { ideas: ideas.length, posts: posts.length } })
      setPreviewOpen(true)
    } catch (e) {
      setMessage(`✗ Import failed: ${e instanceof Error ? e.message : 'Invalid JSON'}`)
    }
  }

  const performBackup = async () => {
    try {
      const res = await fetch('http://localhost:3001/export', { credentials: 'include' })
      if (!res.ok) throw new Error('Backup failed')
      const data = await res.json()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-before-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const runImport = async (data: ExportPayload, chosenMode: ImportMode) => {
    setLoading(true)
    setIsImporting(true)
    setMessage(null)

    try {
      if (chosenMode === 'replace' && autoBackup) {
        const ok = await performBackup()
        if (!ok) {
          setMessage('✗ Backup failed — import aborted')
          return
        }
      }

      const res = await fetch('http://localhost:3001/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, mode: chosenMode, prune: pruneMissing }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Import failed')

      let successMsg = `${result.message}`
      if (result.deletedPosts && typeof result.deletedPosts === 'number' && result.deletedPosts > 0) {
        successMsg += ` Deleted ${result.deletedPosts} scheduled post${result.deletedPosts > 1 ? 's' : ''}.`
      }
      if (result.deletedIdeas && typeof result.deletedIdeas === 'number' && result.deletedIdeas > 0) {
        successMsg += ` Deleted ${result.deletedIdeas} idea${result.deletedIdeas > 1 ? 's' : ''}.`
      }

      setMessage(`✓ ${successMsg}`)
      // notify parent to refresh calendar view
      try {
        onImportComplete?.()
      } catch {
        // ignore
      }
    } catch (err) {
      setMessage(`✗ Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setIsImporting(false)
      setPreviewOpen(false)
      setPendingData(null)
      setConfirmReplace(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    openImportPreview(file)
  }

  return (
    <div className={s.container}>
      <h3 className={s.title}>Data Management</h3>
      <div className={s.buttons}>
        <button onClick={handleExport} disabled={loading} className={s.button}>
          {loading && isImporting === false ? 'Exporting…' : 'Export as JSON'}
        </button>
        <label className={s.button}>
          <input
            type="file"
            accept=".json"
            onChange={onFileChange}
            disabled={loading}
            style={{ display: 'none' }}
          />
          {loading && isImporting ? 'Importing…' : 'Import from JSON'}
        </label>
      </div>

      {previewOpen && pendingData && (
        <div className={s.preview}>
          <h4>Import preview</h4>
          <p>{pendingData.counts.ideas} ideas, {pendingData.counts.posts} scheduled posts</p>

          <div>
            <label>
              <input type="radio" name="mode" checked={mode === 'sync'} onChange={() => setMode('sync')} /> Sync (update/create)
            </label>
            <label style={{ marginLeft: 12 }}>
              <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace (delete & restore)
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>
              <input type="checkbox" checked={pruneMissing} onChange={(e) => setPruneMissing(e.target.checked)} /> Prune missing posts (delete posts not present in import)
            </label>
          </div>

          {mode === 'replace' && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block' }}>
                <input type="checkbox" checked={confirmReplace} onChange={(e) => setConfirmReplace(e.target.checked)} /> I understand this will replace the current data
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                <input type="checkbox" checked={autoBackup} onChange={(e) => setAutoBackup(e.target.checked)} /> Automatically download a backup before replacing
              </label>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button className={s.button} disabled={loading} onClick={() => { setPreviewOpen(false); setPendingData(null) }}>Cancel</button>
            <button
              className={s.button}
              style={{ marginLeft: 8 }}
              disabled={loading || (mode === 'replace' && !confirmReplace)}
              onClick={() => runImport(pendingData.raw, mode)}
            >
              {mode === 'replace' ? 'Confirm Replace' : 'Import (Sync)'}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`${s.message} ${message.startsWith('✓') ? s.success : s.error}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default ExportImport
