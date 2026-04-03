import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Dashboard from './Dashboard'

const HARDCODED_USER = 'admin'
const HARDCODED_PASS = 'rcoach@aifund'

export default function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (username === HARDCODED_USER && password === HARDCODED_PASS) {
        setLoggedIn(true)
      } else {
        setError('Invalid username or password')
      }
      setLoading(false)
    }, 800)
  }

  if (loggedIn) {
  return <Dashboard onLogout={() => setLoggedIn(false)} />
}

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo area */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>✦</div>
          <h1 style={styles.appName}>Research Coach</h1>
          <p style={styles.tagline}>Your research, your words, always.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="off"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                style={{ ...styles.input, ...styles.passwordInput }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                style={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={loading ? { ...styles.button, ...styles.buttonLoading } : styles.button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          AI Fund Prototype · Built for the next generation of researchers
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: '20px',
  },
  card: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logoIcon: {
    fontSize: '32px',
    color: '#6366f1',
    marginBottom: '12px',
  },
  appName: {
    color: '#f3f4f6',
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  tagline: {
    color: '#6b7280',
    fontSize: '13px',
    margin: 0,
    letterSpacing: '0.2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '0.3px',
  },
  input: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#f3f4f6',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    paddingRight: '42px',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '13px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.2s, transform 0.1s',
    letterSpacing: '0.2px',
  },
  buttonLoading: {
    background: '#4f46e5',
    cursor: 'not-allowed',
  },
  error: {
    color: '#f87171',
    fontSize: '13px',
    margin: '0',
    textAlign: 'center',
  },
  footer: {
    color: '#374151',
    fontSize: '11px',
    textAlign: 'center',
    marginTop: '32px',
    marginBottom: '0',
  },
}