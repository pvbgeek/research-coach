import { useEffect, useState } from 'react'
import ResearchIdeaCoach from './features/ResearchIdeaCoach'
import NoveltyValidator from './features/NoveltyValidator'
import LiteratureExplorer from './features/LiteratureExplorer'
import CitationValidator from './features/CitationValidator'
import RubricChecker from './features/RubricChecker'
import DraftReview from './features/DraftReview'
import DeepDive from './features/DeepDive'
import { featureMeta, tileOrder } from './data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const TILE_ICONS = {
  f1: '🧭',
  f2: '📚',
  f3: '🔬',
  f4: '🔎',
  f5: '📋',
  f6: '📝',
  f10: '🔍',
}

const SESSIONS_KEY = 'rc_sessions'
const ACTIVE_SESSION_KEY = 'rc_active_session'

const loadPrevSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

const savePrevSession = (id, date) => {
  const sessions = loadPrevSessions()
  sessions.unshift({ id, date, ended: false })
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

const markSessionEnded = (id) => {
  const sessions = loadPrevSessions()
  const updated = sessions.map((s) =>
    s.id === id ? { ...s, ended: true } : s
  )
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated))
}

const saveActiveSession = (id) => {
  localStorage.setItem(ACTIVE_SESSION_KEY, id)
}

const loadActiveSession = () => {
  return localStorage.getItem(ACTIVE_SESSION_KEY)
}

const clearActiveSession = () => {
  localStorage.removeItem(ACTIVE_SESSION_KEY)
}

async function autoEndAbandonedSession() {
  const activeSessionId = loadActiveSession()
  if (!activeSessionId) return

  try {
    await fetch(`${API_BASE}/session/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: activeSessionId }),
    })
  } catch (err) {
    // ignore backend failure, still clean browser state
  }

  markSessionEnded(activeSessionId)
  clearActiveSession()
}

export default function Dashboard({ onLogout }) {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [prevSessions, setPrevSessions] = useState(loadPrevSessions)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [prefilledResearchQuestion, setPrefilledResearchQuestion] = useState('')

  useEffect(() => {
    autoEndAbandonedSession().then(() => {
      setPrevSessions(loadPrevSessions())
    })
  }, [])

  const startSession = async () => {
    setLoadingSession(true)

    const newSessionId = `session_${Date.now()}`
    const now = new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    try {
      const response = await fetch(`${API_BASE}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'investor', session_id: newSessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      savePrevSession(newSessionId, now)
      saveActiveSession(newSessionId)
      setPrevSessions(loadPrevSessions())
      setSessionId(newSessionId)
      setSessionActive(true)
    } catch (err) {
      alert('Could not connect to backend. Check your tunnel URL.')
    }

    setLoadingSession(false)
  }

  const endSession = async () => {
    try {
      await fetch(`${API_BASE}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch (err) {
      // ignore
    }

    markSessionEnded(sessionId)
    clearActiveSession()
    setPrevSessions(loadPrevSessions())
    setSessionActive(false)
    setSessionId(null)
    setSelectedFeature(null)
    setPrefilledResearchQuestion('')
    setShowEndConfirm(false)
  }

  const handleLogout = async () => {
    if (sessionActive && sessionId) {
      try {
        await fetch(`${API_BASE}/session/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
      } catch (err) {
        // ignore
      }

      markSessionEnded(sessionId)
      clearActiveSession()
      setPrevSessions(loadPrevSessions())
      setSessionActive(false)
      setSessionId(null)
      setSelectedFeature(null)
      setPrefilledResearchQuestion('')
    }

    onLogout()
  }

  const resetBrowserHistory = () => {
    localStorage.removeItem(SESSIONS_KEY)
    localStorage.removeItem(ACTIVE_SESSION_KEY)
    setPrevSessions([])
  }

  const handleTileClick = (featureId) => {
    if (!sessionActive) return

    const wired = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f10']
    if (wired.includes(featureId)) {
      setSelectedFeature(featureId)
      if (!['f10', 'f2', 'f3'].includes(featureId)) {
        setPrefilledResearchQuestion('')
      }
      return
    }

    alert(`${featureMeta[featureId].title} screen will be connected next.`)
  }

  const handleBackToMenu = () => {
    setSelectedFeature(null)
  }

  const handleOpenValidator = (rq) => {
    setPrefilledResearchQuestion(rq || '')
    setSelectedFeature('f10')
  }

  const handleOpenLiteratureExplorer = (rq) => {
    setPrefilledResearchQuestion(rq || '')
    setSelectedFeature('f2')
  }

  const handleOpenDeepDive = (rq) => {
    setPrefilledResearchQuestion(rq || '')
    setSelectedFeature('f3')
  }

  if (selectedFeature === 'f1') {
    return (
      <ResearchIdeaCoach
        sessionId={sessionId}
        onBack={handleBackToMenu}
        onOpenValidator={handleOpenValidator}
      />
    )
  }

  if (selectedFeature === 'f10') {
    return (
      <NoveltyValidator
        sessionId={sessionId}
        onBack={handleBackToMenu}
        initialResearchQuestion={prefilledResearchQuestion}
        onOpenLiteratureExplorer={handleOpenLiteratureExplorer}
        onOpenDeepDive={handleOpenDeepDive}
      />
    )
  }

  if (selectedFeature === 'f2') {
    return (
      <LiteratureExplorer
        sessionId={sessionId}
        onBack={handleBackToMenu}
        initialResearchQuestion={prefilledResearchQuestion}
        onOpenDeepDive={handleOpenDeepDive}
      />
    )
  }

  if (selectedFeature === 'f3') {
    return (
      <DeepDive
        sessionId={sessionId}
        onBack={handleBackToMenu}
        initialResearchQuestion={prefilledResearchQuestion}
      />
    )
  }

  if (selectedFeature === 'f4') {
    return (
      <CitationValidator
        sessionId={sessionId}
        onBack={handleBackToMenu}
      />
    )
  }

  if (selectedFeature === 'f5') {
    return (
      <RubricChecker
        sessionId={sessionId}
        onBack={handleBackToMenu}
      />
    )
  }

  if (selectedFeature === 'f6') {
    return (
      <DraftReview
        sessionId={sessionId}
        onBack={handleBackToMenu}
      />
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.logoIcon}>✦</span>
          <span style={styles.logoText}>Research Coach</span>
        </div>

        <div style={styles.topRight}>
          {sessionActive && (
            <div style={styles.sessionBadge}>
              <span style={styles.sessionDot}></span>
              Session Active
            </div>
          )}

          {sessionActive && (
            <button style={styles.endBtn} onClick={() => setShowEndConfirm(true)}>
              End Session
            </button>
          )}

          <button style={styles.resetBtn} onClick={resetBrowserHistory}>
            Reset History
          </button>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {!sessionActive && (
          <div style={styles.startArea}>
            <h2 style={styles.startTitle}>Welcome back!</h2>
            <p style={styles.startSubtitle}>Start a session to unlock all research tools</p>
            <button
              style={loadingSession ? { ...styles.startBtn, opacity: 0.7 } : styles.startBtn}
              onClick={startSession}
              disabled={loadingSession}
            >
              {loadingSession ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        )}

        <div style={styles.grid}>
          {tileOrder.map((tileId) => {
            const tile = featureMeta[tileId]

            return (
              <div
                key={tile.id}
                style={sessionActive ? styles.tile : { ...styles.tile, ...styles.tileLocked }}
                onClick={() => handleTileClick(tile.id)}
              >
                {!sessionActive && <div style={styles.lockOverlay}>🔒</div>}
                <div style={styles.tileIcon}>{TILE_ICONS[tile.id]}</div>
                <div style={styles.tileName}>{tile.title}</div>
                <div style={styles.tileDesc}>{tile.shortDescription}</div>
              </div>
            )
          })}
        </div>

        <div style={styles.prevSection}>
          <div style={styles.prevHeaderRow}>
            <h3 style={styles.prevTitle}>Previous Sessions</h3>
            {prevSessions.length > 0 && (
              <button style={styles.clearTextBtn} onClick={resetBrowserHistory}>
                Clear Local History
              </button>
            )}
          </div>

          {prevSessions.length === 0 ? (
            <p style={styles.noSessions}>No previous sessions found.</p>
          ) : (
            <div style={styles.prevList}>
              {prevSessions.map((s) => (
                <div key={s.id} style={styles.prevCard}>
                  <span style={styles.prevDate}>📅 {s.date}</span>
                  {s.ended ? (
                    <a
                      href={`${API_BASE}/feature7/export/${s.id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.downloadBtn}
                    >
                      Download Report
                    </a>
                  ) : (
                    <span style={styles.pendingLabel}>In Progress</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEndConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>End Session?</h3>
            <p style={styles.modalText}>
              Do you want to download your authorship report before ending?
            </p>
            <div style={styles.modalButtons}>
              <button style={styles.confirmEndBtn} onClick={endSession}>
                End Session
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowEndConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f1117',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    background: '#1a1d25',
    borderBottom: '1px solid #2a2d3a',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    color: '#6366f1',
    fontSize: '20px',
  },
  logoText: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  sessionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '20px',
    padding: '4px 12px',
    color: '#10b981',
    fontSize: '12px',
    fontWeight: '500',
  },
  sessionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    display: 'inline-block',
  },
  endBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '8px 14px',
    color: '#ef4444',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  resetBtn: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
    padding: '8px 14px',
    color: '#f59e0b',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '8px 14px',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 32px',
  },
  startArea: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  startTitle: {
    color: '#f3f4f6',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  startSubtitle: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 24px 0',
  },
  startBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '48px',
  },
  tile: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s, transform 0.2s',
    width: '280px',
    flexGrow: 0,
  },
  tileLocked: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  lockOverlay: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    fontSize: '14px',
  },
  tileIcon: {
    fontSize: '28px',
    marginBottom: '12px',
  },
  tileName: {
    color: '#f3f4f6',
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  tileDesc: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  prevSection: {
    borderTop: '1px solid #2a2d3a',
    paddingTop: '32px',
  },
  prevHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  prevTitle: {
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    margin: 0,
  },
  clearTextBtn: {
    background: 'transparent',
    border: 'none',
    color: '#f59e0b',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
  },
  noSessions: {
    color: '#4b5563',
    fontSize: '13px',
  },
  prevList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  prevCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '10px',
    padding: '14px 20px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  prevDate: {
    color: '#9ca3af',
    fontSize: '13px',
  },
  downloadBtn: {
    color: '#6366f1',
    fontSize: '13px',
    textDecoration: 'none',
    fontWeight: '500',
  },
  pendingLabel: {
    color: '#6b7280',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '16px',
    padding: '36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
  },
  modalTitle: {
    color: '#f3f4f6',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 12px 0',
  },
  modalText: {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
  },
  modalButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  confirmEndBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '12px',
    color: '#9ca3af',
    fontSize: '14px',
    cursor: 'pointer',
  },
}










// import { useEffect, useState } from 'react'
// import ResearchIdeaCoach from './features/ResearchIdeaCoach'
// import NoveltyValidator from './features/NoveltyValidator'
// import LiteratureExplorer from './features/LiteratureExplorer'
// import CitationValidator from './features/CitationValidator'
// import RubricChecker from './features/RubricChecker'
// import DraftReview from './features/DraftReview'
// import DeepDive from './features/DeepDive'
// import { featureMeta, tileOrder } from './data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// const TILE_ICONS = {
//   f1: '🧭',
//   f2: '📚',
//   f3: '🔬',
//   f4: '🔎',
//   f5: '📋',
//   f6: '📝',
//   f10: '🔍',
// }

// const SESSIONS_KEY = 'rc_sessions'
// const ACTIVE_SESSION_KEY = 'rc_active_session'

// const loadPrevSessions = () => {
//   try {
//     return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
//   } catch {
//     return []
//   }
// }

// const savePrevSession = (id, date) => {
//   const sessions = loadPrevSessions()
//   sessions.unshift({ id, date, ended: false })
//   localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
// }

// const markSessionEnded = (id) => {
//   const sessions = loadPrevSessions()
//   const updated = sessions.map((s) =>
//     s.id === id ? { ...s, ended: true } : s
//   )
//   localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated))
// }

// const saveActiveSession = (id) => {
//   localStorage.setItem(ACTIVE_SESSION_KEY, id)
// }

// const loadActiveSession = () => {
//   return localStorage.getItem(ACTIVE_SESSION_KEY)
// }

// const clearActiveSession = () => {
//   localStorage.removeItem(ACTIVE_SESSION_KEY)
// }

// async function autoEndAbandonedSession() {
//   const activeSessionId = loadActiveSession()
//   if (!activeSessionId) return

//   try {
//     await fetch(`${API_BASE}/session/end`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ session_id: activeSessionId }),
//     })
//   } catch (err) {
//     // ignore backend failure, still clean browser state
//   }

//   markSessionEnded(activeSessionId)
//   clearActiveSession()
// }

// export default function Dashboard({ onLogout }) {
//   const [sessionActive, setSessionActive] = useState(false)
//   const [sessionId, setSessionId] = useState(null)
//   const [loadingSession, setLoadingSession] = useState(false)
//   const [showEndConfirm, setShowEndConfirm] = useState(false)
//   const [prevSessions, setPrevSessions] = useState(loadPrevSessions)
//   const [selectedFeature, setSelectedFeature] = useState(null)
//   const [prefilledResearchQuestion, setPrefilledResearchQuestion] = useState('')

//   useEffect(() => {
//     autoEndAbandonedSession().then(() => {
//       setPrevSessions(loadPrevSessions())
//     })
//   }, [])

//   const startSession = async () => {
//     setLoadingSession(true)

//     const newSessionId = `session_${Date.now()}`
//     const now = new Date().toLocaleString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric',
//       hour: 'numeric',
//       minute: '2-digit',
//     })

//     try {
//       const response = await fetch(`${API_BASE}/session/start`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ user: 'investor', session_id: newSessionId }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to start session')
//       }

//       savePrevSession(newSessionId, now)
//       saveActiveSession(newSessionId)
//       setPrevSessions(loadPrevSessions())
//       setSessionId(newSessionId)
//       setSessionActive(true)
//     } catch (err) {
//       alert('Could not connect to backend. Check your tunnel URL.')
//     }

//     setLoadingSession(false)
//   }

//   const endSession = async () => {
//     try {
//       await fetch(`${API_BASE}/session/end`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ session_id: sessionId }),
//       })
//     } catch (err) {
//       // ignore
//     }

//     markSessionEnded(sessionId)
//     clearActiveSession()
//     setPrevSessions(loadPrevSessions())
//     setSessionActive(false)
//     setSessionId(null)
//     setSelectedFeature(null)
//     setPrefilledResearchQuestion('')
//     setShowEndConfirm(false)
//   }

//   const handleLogout = async () => {
//     if (sessionActive && sessionId) {
//       try {
//         await fetch(`${API_BASE}/session/end`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ session_id: sessionId }),
//         })
//       } catch (err) {
//         // ignore
//       }

//       markSessionEnded(sessionId)
//       clearActiveSession()
//       setPrevSessions(loadPrevSessions())
//       setSessionActive(false)
//       setSessionId(null)
//       setSelectedFeature(null)
//       setPrefilledResearchQuestion('')
//     }

//     onLogout()
//   }

//   const resetBrowserHistory = () => {
//     localStorage.removeItem(SESSIONS_KEY)
//     localStorage.removeItem(ACTIVE_SESSION_KEY)
//     setPrevSessions([])
//   }

//   const handleTileClick = (featureId) => {
//     if (!sessionActive) return

//     const wired = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f10']
//     if (wired.includes(featureId)) {
//       setSelectedFeature(featureId)
//       if (!['f10', 'f2', 'f3'].includes(featureId)) {
//         setPrefilledResearchQuestion('')
//       }
//       return
//     }

//     alert(`${featureMeta[featureId].title} screen will be connected next.`)
//   }

//   const handleBackToMenu = () => {
//     setSelectedFeature(null)
//   }

//   const handleOpenValidator = (rq) => {
//     setPrefilledResearchQuestion(rq || '')
//     setSelectedFeature('f10')
//   }

//   const handleOpenLiteratureExplorer = (rq) => {
//     setPrefilledResearchQuestion(rq || '')
//     setSelectedFeature('f2')
//   }

//   const handleOpenDeepDive = (rq) => {
//     setPrefilledResearchQuestion(rq || '')
//     setSelectedFeature('f3')
//   }

//   // --- Feature Renders ---

//   if (selectedFeature === 'f1') {
//     return (
//       <ResearchIdeaCoach
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//         onOpenValidator={handleOpenValidator}
//       />
//     )
//   }

//   if (selectedFeature === 'f10') {
//     return (
//       <NoveltyValidator
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//         initialResearchQuestion={prefilledResearchQuestion}
//         onOpenLiteratureExplorer={handleOpenLiteratureExplorer}
//       />
//     )
//   }

//   if (selectedFeature === 'f2') {
//     return (
//       <LiteratureExplorer
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//         initialResearchQuestion={prefilledResearchQuestion}
//         onOpenDeepDive={handleOpenDeepDive}
//       />
//     )
//   }

//   if (selectedFeature === 'f3') {
//     return (
//       <DeepDive
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//         initialResearchQuestion={prefilledResearchQuestion}
//       />
//     )
//   }

//   if (selectedFeature === 'f4') {
//     return (
//       <CitationValidator
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//       />
//     )
//   }

//   if (selectedFeature === 'f5') {
//     return (
//       <RubricChecker
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//       />
//     )
//   }

//   if (selectedFeature === 'f6') {
//     return (
//       <DraftReview
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//       />
//     )
//   }

//   // --- Dashboard ---

//   return (
//     <div style={styles.page}>
//       <div style={styles.topBar}>
//         <div style={styles.topLeft}>
//           <span style={styles.logoIcon}>✦</span>
//           <span style={styles.logoText}>Research Coach</span>
//         </div>

//         <div style={styles.topRight}>
//           {sessionActive && (
//             <div style={styles.sessionBadge}>
//               <span style={styles.sessionDot}></span>
//               Session Active
//             </div>
//           )}

//           {sessionActive && (
//             <button style={styles.endBtn} onClick={() => setShowEndConfirm(true)}>
//               End Session
//             </button>
//           )}

//           <button style={styles.resetBtn} onClick={resetBrowserHistory}>
//             Reset History
//           </button>

//           <button style={styles.logoutBtn} onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       </div>

//       <div style={styles.content}>
//         {!sessionActive && (
//           <div style={styles.startArea}>
//             <h2 style={styles.startTitle}>Welcome back!</h2>
//             <p style={styles.startSubtitle}>Start a session to unlock all research tools</p>
//             <button
//               style={loadingSession ? { ...styles.startBtn, opacity: 0.7 } : styles.startBtn}
//               onClick={startSession}
//               disabled={loadingSession}
//             >
//               {loadingSession ? 'Starting...' : 'Start Session'}
//             </button>
//           </div>
//         )}

//         <div style={styles.grid}>
//           {tileOrder.map((tileId) => {
//             const tile = featureMeta[tileId]

//             return (
//               <div
//                 key={tile.id}
//                 style={sessionActive ? styles.tile : { ...styles.tile, ...styles.tileLocked }}
//                 onClick={() => handleTileClick(tile.id)}
//               >
//                 {!sessionActive && <div style={styles.lockOverlay}>🔒</div>}
//                 <div style={styles.tileIcon}>{TILE_ICONS[tile.id]}</div>
//                 <div style={styles.tileName}>{tile.title}</div>
//                 <div style={styles.tileDesc}>{tile.shortDescription}</div>
//               </div>
//             )
//           })}
//         </div>

//         <div style={styles.prevSection}>
//           <div style={styles.prevHeaderRow}>
//             <h3 style={styles.prevTitle}>Previous Sessions</h3>
//             {prevSessions.length > 0 && (
//               <button style={styles.clearTextBtn} onClick={resetBrowserHistory}>
//                 Clear Local History
//               </button>
//             )}
//           </div>

//           {prevSessions.length === 0 ? (
//             <p style={styles.noSessions}>No previous sessions found.</p>
//           ) : (
//             <div style={styles.prevList}>
//               {prevSessions.map((s) => (
//                 <div key={s.id} style={styles.prevCard}>
//                   <span style={styles.prevDate}>📅 {s.date}</span>
//                   {s.ended ? (
//                     <a
//                       href={`${API_BASE}/feature7/export/${s.id}`}
//                       target="_blank"
//                       rel="noreferrer"
//                       style={styles.downloadBtn}
//                     >
//                       Download Report
//                     </a>
//                   ) : (
//                     <span style={styles.pendingLabel}>In Progress</span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {showEndConfirm && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modal}>
//             <h3 style={styles.modalTitle}>End Session?</h3>
//             <p style={styles.modalText}>
//               Do you want to download your authorship report before ending?
//             </p>
//             <div style={styles.modalButtons}>
//               <button style={styles.confirmEndBtn} onClick={endSession}>
//                 End Session
//               </button>
//               <button style={styles.cancelBtn} onClick={() => setShowEndConfirm(false)}>
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   page: {
//     minHeight: '100vh',
//     background: '#0f1117',
//     fontFamily: "'Segoe UI', system-ui, sans-serif",
//   },
//   topBar: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: '16px 32px',
//     background: '#1a1d25',
//     borderBottom: '1px solid #2a2d3a',
//     position: 'sticky',
//     top: 0,
//     zIndex: 100,
//   },
//   topLeft: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//   },
//   logoIcon: {
//     color: '#6366f1',
//     fontSize: '20px',
//   },
//   logoText: {
//     color: '#f3f4f6',
//     fontSize: '16px',
//     fontWeight: '700',
//     letterSpacing: '-0.3px',
//   },
//   topRight: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     flexWrap: 'wrap',
//     justifyContent: 'flex-end',
//   },
//   sessionBadge: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '6px',
//     background: 'rgba(16, 185, 129, 0.1)',
//     border: '1px solid rgba(16, 185, 129, 0.2)',
//     borderRadius: '20px',
//     padding: '4px 12px',
//     color: '#10b981',
//     fontSize: '12px',
//     fontWeight: '500',
//   },
//   sessionDot: {
//     width: '6px',
//     height: '6px',
//     borderRadius: '50%',
//     background: '#10b981',
//     display: 'inline-block',
//   },
//   endBtn: {
//     background: 'rgba(239, 68, 68, 0.1)',
//     border: '1px solid rgba(239, 68, 68, 0.2)',
//     borderRadius: '8px',
//     padding: '8px 14px',
//     color: '#ef4444',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   resetBtn: {
//     background: 'rgba(245, 158, 11, 0.1)',
//     border: '1px solid rgba(245, 158, 11, 0.2)',
//     borderRadius: '8px',
//     padding: '8px 14px',
//     color: '#f59e0b',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   logoutBtn: {
//     background: 'transparent',
//     border: '1px solid #2a2d3a',
//     borderRadius: '8px',
//     padding: '8px 14px',
//     color: '#9ca3af',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   content: {
//     maxWidth: '1200px',
//     margin: '0 auto',
//     padding: '40px 32px',
//   },
//   startArea: {
//     textAlign: 'center',
//     marginBottom: '48px',
//   },
//   startTitle: {
//     color: '#f3f4f6',
//     fontSize: '28px',
//     fontWeight: '700',
//     margin: '0 0 8px 0',
//     letterSpacing: '-0.5px',
//   },
//   startSubtitle: {
//     color: '#6b7280',
//     fontSize: '14px',
//     margin: '0 0 24px 0',
//   },
//   startBtn: {
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: '8px',
//     background: '#6366f1',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '14px 32px',
//     fontSize: '15px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   grid: {
//     display: 'flex',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     gap: '16px',
//     marginBottom: '48px',
//   },
//   tile: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '24px',
//     cursor: 'pointer',
//     position: 'relative',
//     overflow: 'hidden',
//     transition: 'border-color 0.2s, transform 0.2s',
//     width: '280px',
//     flexGrow: 0,
//   },
//   tileLocked: {
//     opacity: 0.45,
//     cursor: 'not-allowed',
//   },
//   lockOverlay: {
//     position: 'absolute',
//     top: '16px',
//     right: '16px',
//     fontSize: '14px',
//   },
//   tileIcon: {
//     fontSize: '28px',
//     marginBottom: '12px',
//   },
//   tileName: {
//     color: '#f3f4f6',
//     fontSize: '15px',
//     fontWeight: '600',
//     marginBottom: '8px',
//   },
//   tileDesc: {
//     color: '#6b7280',
//     fontSize: '13px',
//     lineHeight: '1.6',
//   },
//   prevSection: {
//     borderTop: '1px solid #2a2d3a',
//     paddingTop: '32px',
//   },
//   prevHeaderRow: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     marginBottom: '16px',
//     flexWrap: 'wrap',
//   },
//   prevTitle: {
//     color: '#9ca3af',
//     fontSize: '13px',
//     fontWeight: '600',
//     letterSpacing: '0.5px',
//     textTransform: 'uppercase',
//     margin: 0,
//   },
//   clearTextBtn: {
//     background: 'transparent',
//     border: 'none',
//     color: '#f59e0b',
//     fontSize: '13px',
//     cursor: 'pointer',
//     padding: 0,
//   },
//   noSessions: {
//     color: '#4b5563',
//     fontSize: '13px',
//   },
//   prevList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   prevCard: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '10px',
//     padding: '14px 20px',
//     gap: '12px',
//     flexWrap: 'wrap',
//   },
//   prevDate: {
//     color: '#9ca3af',
//     fontSize: '13px',
//   },
//   downloadBtn: {
//     color: '#6366f1',
//     fontSize: '13px',
//     textDecoration: 'none',
//     fontWeight: '500',
//   },
//   pendingLabel: {
//     color: '#6b7280',
//     fontSize: '13px',
//     fontStyle: 'italic',
//   },
//   modalOverlay: {
//     position: 'fixed',
//     inset: 0,
//     background: 'rgba(0,0,0,0.7)',
//     backdropFilter: 'blur(4px)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 200,
//   },
//   modal: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '16px',
//     padding: '36px',
//     width: '100%',
//     maxWidth: '420px',
//     boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
//   },
//   modalTitle: {
//     color: '#f3f4f6',
//     fontSize: '20px',
//     fontWeight: '700',
//     margin: '0 0 12px 0',
//   },
//   modalText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     margin: '0 0 24px 0',
//     lineHeight: '1.6',
//   },
//   modalButtons: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   confirmEndBtn: {
//     background: 'rgba(239, 68, 68, 0.1)',
//     border: '1px solid rgba(239, 68, 68, 0.2)',
//     borderRadius: '8px',
//     padding: '12px',
//     color: '#ef4444',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   cancelBtn: {
//     background: 'transparent',
//     border: '1px solid #2a2d3a',
//     borderRadius: '8px',
//     padding: '12px',
//     color: '#9ca3af',
//     fontSize: '14px',
//     cursor: 'pointer',
//   },
// }








// import { useEffect, useState } from 'react'
// import ResearchIdeaCoach from './features/ResearchIdeaCoach'
// import { featureMeta, tileOrder } from './data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// const TILE_ICONS = {
//   f1: '🧭',
//   f2: '📚',
//   f3: '🔬',
//   f4: '✅',
//   f5: '📋',
//   f6: '📝',
//   f10: '🔍',
// }

// const SESSIONS_KEY = 'rc_sessions'
// const ACTIVE_SESSION_KEY = 'rc_active_session'

// const loadPrevSessions = () => {
//   try {
//     return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
//   } catch {
//     return []
//   }
// }

// const savePrevSession = (id, date) => {
//   const sessions = loadPrevSessions()
//   sessions.unshift({ id, date, ended: false })
//   localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
// }

// const markSessionEnded = (id) => {
//   const sessions = loadPrevSessions()
//   const updated = sessions.map((s) =>
//     s.id === id ? { ...s, ended: true } : s
//   )
//   localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated))
// }

// const saveActiveSession = (id) => {
//   localStorage.setItem(ACTIVE_SESSION_KEY, id)
// }

// const loadActiveSession = () => {
//   return localStorage.getItem(ACTIVE_SESSION_KEY)
// }

// const clearActiveSession = () => {
//   localStorage.removeItem(ACTIVE_SESSION_KEY)
// }

// async function autoEndAbandonedSession() {
//   const activeSessionId = loadActiveSession()
//   if (!activeSessionId) return

//   try {
//     await fetch(`${API_BASE}/session/end`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ session_id: activeSessionId }),
//     })
//   } catch (err) {
//     // ignore backend failure, still clean browser state
//   }

//   markSessionEnded(activeSessionId)
//   clearActiveSession()
// }

// export default function Dashboard({ onLogout }) {
//   const [sessionActive, setSessionActive] = useState(false)
//   const [sessionId, setSessionId] = useState(null)
//   const [loadingSession, setLoadingSession] = useState(false)
//   const [showEndConfirm, setShowEndConfirm] = useState(false)
//   const [prevSessions, setPrevSessions] = useState(loadPrevSessions)
//   const [selectedFeature, setSelectedFeature] = useState(null)

//   useEffect(() => {
//     autoEndAbandonedSession().then(() => {
//       setPrevSessions(loadPrevSessions())
//     })
//   }, [])

//   const startSession = async () => {
//     setLoadingSession(true)

//     const newSessionId = `session_${Date.now()}`
//     const now = new Date().toLocaleString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric',
//       hour: 'numeric',
//       minute: '2-digit',
//     })

//     try {
//       const response = await fetch(`${API_BASE}/session/start`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ user: 'investor', session_id: newSessionId }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to start session')
//       }

//       savePrevSession(newSessionId, now)
//       saveActiveSession(newSessionId)
//       setPrevSessions(loadPrevSessions())
//       setSessionId(newSessionId)
//       setSessionActive(true)
//     } catch (err) {
//       alert('Could not connect to backend. Check your tunnel URL.')
//     }

//     setLoadingSession(false)
//   }

//   const endSession = async () => {
//     try {
//       await fetch(`${API_BASE}/session/end`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ session_id: sessionId }),
//       })
//     } catch (err) {
//       // ignore
//     }

//     markSessionEnded(sessionId)
//     clearActiveSession()
//     setPrevSessions(loadPrevSessions())
//     setSessionActive(false)
//     setSessionId(null)
//     setSelectedFeature(null)
//     setShowEndConfirm(false)
//   }

//   const handleLogout = async () => {
//     if (sessionActive && sessionId) {
//       try {
//         await fetch(`${API_BASE}/session/end`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ session_id: sessionId }),
//         })
//       } catch (err) {
//         // ignore
//       }

//       markSessionEnded(sessionId)
//       clearActiveSession()
//       setPrevSessions(loadPrevSessions())
//       setSessionActive(false)
//       setSessionId(null)
//       setSelectedFeature(null)
//     }

//     onLogout()
//   }

//   const resetBrowserHistory = () => {
//     localStorage.removeItem(SESSIONS_KEY)
//     localStorage.removeItem(ACTIVE_SESSION_KEY)
//     setPrevSessions([])
//   }

//   const handleTileClick = (featureId) => {
//     if (!sessionActive) return

//     if (featureId === 'f1') {
//       setSelectedFeature('f1')
//       return
//     }

//     alert(`${featureMeta[featureId].title} screen will be connected next.`)
//   }

//   const handleBackToMenu = () => {
//     setSelectedFeature(null)
//   }

//   if (selectedFeature === 'f1') {
//     return (
//       <ResearchIdeaCoach
//         sessionId={sessionId}
//         onBack={handleBackToMenu}
//       />
//     )
//   }

//   return (
//     <div style={styles.page}>
//       <div style={styles.topBar}>
//         <div style={styles.topLeft}>
//           <span style={styles.logoIcon}>✦</span>
//           <span style={styles.logoText}>Research Coach</span>
//         </div>

//         <div style={styles.topRight}>
//           {sessionActive && (
//             <div style={styles.sessionBadge}>
//               <span style={styles.sessionDot}></span>
//               Session Active
//             </div>
//           )}

//           {sessionActive && (
//             <button style={styles.endBtn} onClick={() => setShowEndConfirm(true)}>
//               End Session
//             </button>
//           )}

//           <button style={styles.resetBtn} onClick={resetBrowserHistory}>
//             Reset History
//           </button>

//           <button style={styles.logoutBtn} onClick={handleLogout}>
//             Logout
//           </button>
//         </div>
//       </div>

//       <div style={styles.content}>
//         {!sessionActive && (
//           <div style={styles.startArea}>
//             <h2 style={styles.startTitle}>Welcome back!</h2>
//             <p style={styles.startSubtitle}>Start a session to unlock all research tools</p>
//             <button
//               style={loadingSession ? { ...styles.startBtn, opacity: 0.7 } : styles.startBtn}
//               onClick={startSession}
//               disabled={loadingSession}
//             >
//               {loadingSession ? 'Starting...' : 'Start Session'}
//             </button>
//           </div>
//         )}

//         <div style={styles.grid}>
//           {tileOrder.map((tileId) => {
//             const tile = featureMeta[tileId]

//             return (
//               <div
//                 key={tile.id}
//                 style={sessionActive ? styles.tile : { ...styles.tile, ...styles.tileLocked }}
//                 onClick={() => handleTileClick(tile.id)}
//               >
//                 {!sessionActive && <div style={styles.lockOverlay}>🔒</div>}
//                 <div style={styles.tileIcon}>{TILE_ICONS[tile.id]}</div>
//                 <div style={styles.tileName}>{tile.title}</div>
//                 <div style={styles.tileDesc}>{tile.shortDescription}</div>
//               </div>
//             )
//           })}
//         </div>

//         <div style={styles.prevSection}>
//           <div style={styles.prevHeaderRow}>
//             <h3 style={styles.prevTitle}>Previous Sessions</h3>
//             {prevSessions.length > 0 && (
//               <button style={styles.clearTextBtn} onClick={resetBrowserHistory}>
//                 Clear Local History
//               </button>
//             )}
//           </div>

//           {prevSessions.length === 0 ? (
//             <p style={styles.noSessions}>No previous sessions found.</p>
//           ) : (
//             <div style={styles.prevList}>
//               {prevSessions.map((s) => (
//                 <div key={s.id} style={styles.prevCard}>
//                   <span style={styles.prevDate}>📅 {s.date}</span>
//                   {s.ended ? (
//                     <a
//                       href={`${API_BASE}/feature7/export/${s.id}`}
//                       target="_blank"
//                       rel="noreferrer"
//                       style={styles.downloadBtn}
//                     >
//                       Download Report
//                     </a>
//                   ) : (
//                     <span style={styles.pendingLabel}>In Progress</span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {showEndConfirm && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modal}>
//             <h3 style={styles.modalTitle}>End Session?</h3>
//             <p style={styles.modalText}>
//               Do you want to download your authorship report before ending?
//             </p>
//             <div style={styles.modalButtons}>
//               <button style={styles.confirmEndBtn} onClick={endSession}>
//                 End Session
//               </button>
//               <button style={styles.cancelBtn} onClick={() => setShowEndConfirm(false)}>
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   page: {
//     minHeight: '100vh',
//     background: '#0f1117',
//     fontFamily: "'Segoe UI', system-ui, sans-serif",
//   },
//   topBar: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: '16px 32px',
//     background: '#1a1d25',
//     borderBottom: '1px solid #2a2d3a',
//     position: 'sticky',
//     top: 0,
//     zIndex: 100,
//   },
//   topLeft: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//   },
//   logoIcon: {
//     color: '#6366f1',
//     fontSize: '20px',
//   },
//   logoText: {
//     color: '#f3f4f6',
//     fontSize: '16px',
//     fontWeight: '700',
//     letterSpacing: '-0.3px',
//   },
//   topRight: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     flexWrap: 'wrap',
//     justifyContent: 'flex-end',
//   },
//   sessionBadge: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '6px',
//     background: 'rgba(16, 185, 129, 0.1)',
//     border: '1px solid rgba(16, 185, 129, 0.2)',
//     borderRadius: '20px',
//     padding: '4px 12px',
//     color: '#10b981',
//     fontSize: '12px',
//     fontWeight: '500',
//   },
//   sessionDot: {
//     width: '6px',
//     height: '6px',
//     borderRadius: '50%',
//     background: '#10b981',
//     display: 'inline-block',
//   },
//   endBtn: {
//     background: 'rgba(239, 68, 68, 0.1)',
//     border: '1px solid rgba(239, 68, 68, 0.2)',
//     borderRadius: '8px',
//     padding: '8px 14px',
//     color: '#ef4444',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   resetBtn: {
//     background: 'rgba(245, 158, 11, 0.1)',
//     border: '1px solid rgba(245, 158, 11, 0.2)',
//     borderRadius: '8px',
//     padding: '8px 14px',
//     color: '#f59e0b',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   logoutBtn: {
//     background: 'transparent',
//     border: '1px solid #2a2d3a',
//     borderRadius: '8px',
//     padding: '8px 14px',
//     color: '#9ca3af',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   content: {
//     maxWidth: '1200px',
//     margin: '0 auto',
//     padding: '40px 32px',
//   },
//   startArea: {
//     textAlign: 'center',
//     marginBottom: '48px',
//   },
//   startTitle: {
//     color: '#f3f4f6',
//     fontSize: '28px',
//     fontWeight: '700',
//     margin: '0 0 8px 0',
//     letterSpacing: '-0.5px',
//   },
//   startSubtitle: {
//     color: '#6b7280',
//     fontSize: '14px',
//     margin: '0 0 24px 0',
//   },
//   startBtn: {
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: '8px',
//     background: '#6366f1',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '14px 32px',
//     fontSize: '15px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   grid: {
//     display: 'flex',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     gap: '16px',
//     marginBottom: '48px',
//   },
//   tile: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '24px',
//     cursor: 'pointer',
//     position: 'relative',
//     overflow: 'hidden',
//     transition: 'border-color 0.2s, transform 0.2s',
//     width: '280px',
//     flexGrow: 0,
//   },
//   tileLocked: {
//     opacity: 0.45,
//     cursor: 'not-allowed',
//   },
//   lockOverlay: {
//     position: 'absolute',
//     top: '16px',
//     right: '16px',
//     fontSize: '14px',
//   },
//   tileIcon: {
//     fontSize: '28px',
//     marginBottom: '12px',
//   },
//   tileName: {
//     color: '#f3f4f6',
//     fontSize: '15px',
//     fontWeight: '600',
//     marginBottom: '8px',
//   },
//   tileDesc: {
//     color: '#6b7280',
//     fontSize: '13px',
//     lineHeight: '1.6',
//   },
//   prevSection: {
//     borderTop: '1px solid #2a2d3a',
//     paddingTop: '32px',
//   },
//   prevHeaderRow: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     marginBottom: '16px',
//     flexWrap: 'wrap',
//   },
//   prevTitle: {
//     color: '#9ca3af',
//     fontSize: '13px',
//     fontWeight: '600',
//     letterSpacing: '0.5px',
//     textTransform: 'uppercase',
//     margin: 0,
//   },
//   clearTextBtn: {
//     background: 'transparent',
//     border: 'none',
//     color: '#f59e0b',
//     fontSize: '13px',
//     cursor: 'pointer',
//     padding: 0,
//   },
//   noSessions: {
//     color: '#4b5563',
//     fontSize: '13px',
//   },
//   prevList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   prevCard: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '10px',
//     padding: '14px 20px',
//     gap: '12px',
//     flexWrap: 'wrap',
//   },
//   prevDate: {
//     color: '#9ca3af',
//     fontSize: '13px',
//   },
//   downloadBtn: {
//     color: '#6366f1',
//     fontSize: '13px',
//     textDecoration: 'none',
//     fontWeight: '500',
//   },
//   pendingLabel: {
//     color: '#6b7280',
//     fontSize: '13px',
//     fontStyle: 'italic',
//   },
//   modalOverlay: {
//     position: 'fixed',
//     inset: 0,
//     background: 'rgba(0,0,0,0.7)',
//     backdropFilter: 'blur(4px)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 200,
//   },
//   modal: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '16px',
//     padding: '36px',
//     width: '100%',
//     maxWidth: '420px',
//     boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
//   },
//   modalTitle: {
//     color: '#f3f4f6',
//     fontSize: '20px',
//     fontWeight: '700',
//     margin: '0 0 12px 0',
//   },
//   modalText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     margin: '0 0 24px 0',
//     lineHeight: '1.6',
//   },
//   modalButtons: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   confirmEndBtn: {
//     background: 'rgba(239, 68, 68, 0.1)',
//     border: '1px solid rgba(239, 68, 68, 0.2)',
//     borderRadius: '8px',
//     padding: '12px',
//     color: '#ef4444',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   cancelBtn: {
//     background: 'transparent',
//     border: '1px solid #2a2d3a',
//     borderRadius: '8px',
//     padding: '12px',
//     color: '#9ca3af',
//     fontSize: '14px',
//     cursor: 'pointer',
//   },
// }