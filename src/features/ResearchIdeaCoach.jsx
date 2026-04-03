import { useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function ResearchIdeaCoach({ onBack, sessionId, onOpenValidator }) {
  const feature = featureMeta.f1

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [authorshipSummary, setAuthorshipSummary] = useState('')
  const [coachFlags, setCoachFlags] = useState({
    isGhostwritingAttempt: false,
    rqConfirmed: false,
    redirectToValidator: false,
  })
  const [confirmedResearchQuestion, setConfirmedResearchQuestion] = useState('')

  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed || loading) return

    const userMessage = {
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/feature1/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: trimmed,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch coach response')
      }

      const data = await response.json()

      const assistantMessage = {
        role: 'assistant',
        content: data.message || 'No response received.',
        isGhostwritingAttempt: Boolean(data.is_ghostwriting_attempt),
      }

      setMessages((prev) => [...prev, assistantMessage])

      setAuthorshipSummary(data.authorship_summary || '')
      setCoachFlags({
        isGhostwritingAttempt: Boolean(data.is_ghostwriting_attempt),
        rqConfirmed: Boolean(data.rq_confirmed),
        redirectToValidator: Boolean(data.redirect_to_validator),
      })

      if (data.rq_confirmed) {
        setConfirmedResearchQuestion(trimmed)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Could not connect to the coach right now. Please check your backend connection and try again.',
          isError: true,
        },
      ])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <FeatureLayout
      title={feature.title}
      onBack={onBack}
      infoCard={<FeatureInfoCard feature={feature} />}
      showRightPanel={false}
    >
      <div style={styles.wrapper}>
        <div style={styles.metaRow}>
          <div style={styles.metaPill}>Session: {sessionId}</div>
          <div style={styles.metaPillMuted}>Live coaching</div>
        </div>

        {authorshipSummary && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Authorship Summary</div>
            <div style={styles.summaryText}>{authorshipSummary}</div>
          </div>
        )}

        {coachFlags.rqConfirmed && (
          <div style={styles.successCard}>
            <div style={styles.successTitle}>Research question detected</div>
            <div style={styles.successText}>
              Your latest message looks like a research question.
            </div>

            {coachFlags.redirectToValidator && confirmedResearchQuestion && (
              <div style={styles.handoffRow}>
                <button
                  style={styles.validatorButton}
                  onClick={() => onOpenValidator?.(confirmedResearchQuestion)}
                >
                  Open Research Idea & Novelty Validator
                </button>
              </div>
            )}
          </div>
        )}

        <div style={styles.chatArea}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyTitle}>Start your research conversation</div>
              <div style={styles.emptyText}>
                Share a topic, an idea, or an area you are curious about. The coach will guide you
                step by step toward a stronger research question.
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user'

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.messageRow,
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(isUser ? styles.userBubble : styles.assistantBubble),
                        ...(msg.isGhostwritingAttempt ? styles.ghostwritingBubble : {}),
                        ...(msg.isError ? styles.errorBubble : {}),
                      }}
                    >
                      <div style={styles.messageRole}>
                        {isUser ? 'You' : 'Coach'}
                      </div>
                      <div style={styles.messageText}>{msg.content}</div>
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div style={styles.messageRow}>
                  <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                    <div style={styles.messageRole}>Coach</div>
                    <div style={styles.loadingText}>Thinking...</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.inputArea}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your topic, idea, or question here..."
            style={styles.textarea}
            disabled={loading}
          />
          <div style={styles.actions}>
            <button
              style={loading ? { ...styles.sendButton, ...styles.sendButtonDisabled } : styles.sendButton}
              onClick={handleSend}
              disabled={loading || !message.trim()}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </FeatureLayout>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  metaPill: {
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: '#a5b4fc',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  metaPillMuted: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    color: '#9ca3af',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  summaryCard: {
    background: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  summaryLabel: {
    color: '#67e8f9',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  summaryText: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  successCard: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  successTitle: {
    color: '#34d399',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '6px',
  },
  successText: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  handoffRow: {
    marginTop: '12px',
  },
  validatorButton: {
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  chatArea: {
    minHeight: '320px',
    border: '1px solid #2a2d3a',
    background: '#0f1117',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    textAlign: 'center',
    maxWidth: '560px',
    margin: 'auto',
  },
  emptyTitle: {
    color: '#f3f4f6',
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '10px',
    letterSpacing: '-0.3px',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: '14px',
    padding: '12px 14px',
    border: '1px solid #2a2d3a',
  },
  userBubble: {
    background: '#6366f1',
    border: '1px solid #6366f1',
    color: '#ffffff',
  },
  assistantBubble: {
    background: '#1a1d25',
    color: '#e5e7eb',
  },
  ghostwritingBubble: {
    border: '1px solid rgba(245, 158, 11, 0.4)',
    background: 'rgba(245, 158, 11, 0.08)',
  },
  errorBubble: {
    border: '1px solid rgba(239, 68, 68, 0.35)',
    background: 'rgba(239, 68, 68, 0.08)',
  },
  messageRole: {
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '6px',
    opacity: 0.9,
  },
  messageText: {
    fontSize: '14px',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
  },
  loadingText: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    resize: 'vertical',
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#f3f4f6',
    fontSize: '14px',
    lineHeight: '1.6',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  sendButton: {
    background: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sendButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
}