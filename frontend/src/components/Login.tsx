import { useState } from 'react'

type Props = {
  onLogin?: () => void
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('sm_logged_in') === '1'
    } catch (e) {
      return false
    }
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.message || 'Login failed')
        setLoading(false)
        return
      }

      localStorage.setItem('sm_logged_in', '1')
      setLoggedIn(true)
      onLogin?.()
      setPassword('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const onLogout = async () => {
    await fetch('http://localhost:3001/logout', { method: 'POST', credentials: 'include' })
    localStorage.removeItem('sm_logged_in')
    setLoggedIn(false)
    onLogin?.()
  }

  if (loggedIn) {
    return (
      <div style={{ padding: 8 }}>
        <div style={{ marginBottom: 8 }}>You are logged in</div>
        <button onClick={onLogout}>Logout</button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: 8 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>Admin password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  )
}

export default Login
