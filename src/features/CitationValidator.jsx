import { useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

function getOutcomeMeta(outcome) {
  switch (outcome) {
    case 'verified':
      return {
        label: '✓ Verified',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.10)',
        border: 'rgba(16, 185, 129, 0.25)',
      }
    case 'wrong_year':
      return {
        label: '⚠ Wrong Year',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.10)',
        border: 'rgba(245, 158, 11, 0.25)',
      }
    case 'not_found':
      return {
        label: '✗ Not Found',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.10)',
        border: 'rgba(239, 68, 68, 0.25)',
      }
    default:
      return {
        label: 'Unknown',
        color: '#9ca3af',
        bg: 'rgba(156, 163, 175, 0.10)',
        border: 'rgba(156, 163, 175, 0.25)',
      }
  }
}

export default function CitationValidator({ onBack, sessionId }) {
  const feature = featureMeta.f4

  const [citation, setCitation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    const trimmed = citation.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/feature4/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          citation_text: trimmed,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify citation')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Could not verify citation right now. Please check your backend connection and try again.')
    }

    setLoading(false)
  }

  const outcomeMeta = result ? getOutcomeMeta(result.outcome) : null

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
          <div style={styles.metaPillMuted}>Citation check</div>
        </div>

        <div style={styles.inputCard}>
          <div style={styles.sectionTitle}>Paste Your Citation</div>
          <div style={styles.hint}>
            Paste in any format — APA, MLA, Chicago, or even a raw URL or ArXiv ID.
          </div>
          <textarea
            value={citation}
            onChange={(e) => setCitation(e.target.value)}
            placeholder={`e.g. Vaswani, A., et al. (2017). Attention is all you need. NeurIPS.\nor: https://arxiv.org/abs/1706.03762`}
            style={styles.textarea}
            disabled={loading}
          />
          <div style={styles.actions}>
            <button
              onClick={handleVerify}
              disabled={loading || !citation.trim()}
              style={loading || !citation.trim()
                ? { ...styles.primaryButton, ...styles.buttonDisabled }
                : styles.primaryButton}
            >
              {loading ? 'Verifying...' : 'Verify Citation'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>{error}</div>
        )}

        {!result && !loading && !error && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Paste a citation to verify</div>
            <div style={styles.emptyText}>
              The validator will check whether the paper exists, flag incorrect years,
              and ask you a coaching question about the source.
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Outcome Banner */}
            <div
              style={{
                ...styles.outcomeBanner,
                background: outcomeMeta.bg,
                border: `1px solid ${outcomeMeta.border}`,
              }}
            >
              <span
                style={{
                  ...styles.outcomeBadge,
                  color: outcomeMeta.color,
                }}
              >
                {outcomeMeta.label}
              </span>
              <span style={styles.outcomeSubtext}>
                {result.outcome === 'verified' && 'This paper was found in academic databases.'}
                {result.outcome === 'wrong_year' && 'This paper was found but the year does not match.'}
                {result.outcome === 'not_found' && 'This paper could not be found in any academic database.'}
              </span>
            </div>

            {/* Parsed Citation Info */}
            {result.citation_parsed && (
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Parsed Citation</div>
                <div style={styles.parsedGrid}>
                  {result.citation_parsed.title && (
                    <div style={styles.parsedItem}>
                      <div style={styles.smallLabel}>Title</div>
                      <div style={styles.parsedValue}>{result.citation_parsed.title}</div>
                    </div>
                  )}
                  {result.citation_parsed.authors && (
                    <div style={styles.parsedItem}>
                      <div style={styles.smallLabel}>First Author</div>
                      <div style={styles.parsedValue}>{result.citation_parsed.authors}</div>
                    </div>
                  )}
                  {result.citation_parsed.year && (
                    <div style={styles.parsedItem}>
                      <div style={styles.smallLabel}>Year</div>
                      <div style={styles.parsedValue}>{result.citation_parsed.year}</div>
                    </div>
                  )}
                  {result.citation_parsed.doi && (
                    <div style={styles.parsedItem}>
                      <div style={styles.smallLabel}>DOI</div>
                      <div style={styles.parsedValue}>{result.citation_parsed.doi}</div>
                    </div>
                  )}
                  {result.citation_parsed.arxiv_id && (
                    <div style={styles.parsedItem}>
                      <div style={styles.smallLabel}>ArXiv ID</div>
                      <div style={styles.parsedValue}>{result.citation_parsed.arxiv_id}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matched Paper */}
            {result.paper && (
              <div style={styles.card}>
                <div style={styles.sectionTitle}>Matched Paper</div>
                <div style={styles.paperTitle}>{result.paper.title}</div>
                <div style={styles.paperMeta}>
                  {result.paper.year || 'Unknown year'}
                  {result.paper.authors?.length
                    ? ` • ${result.paper.authors.join(', ')}`
                    : ''}
                </div>
                {result.paper.citations !== undefined && (
                  <div style={styles.citationCount}>
                    {result.paper.citations} citations
                  </div>
                )}
                {result.paper.url && (
                  <a
                    href={result.paper.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.paperLink}
                  >
                    Open Paper →
                  </a>
                )}

                {result.outcome === 'wrong_year' && result.paper.year && result.citation_parsed?.year && (
                  <div style={styles.yearWarning}>
                    ⚠ Your citation says <strong>{result.citation_parsed.year}</strong> but
                    the actual year is <strong>{result.paper.year}</strong>. Please update your citation.
                  </div>
                )}
              </div>
            )}

            {/* Coaching Question */}
            {result.coaching_question && (
              <div style={styles.coachingCard}>
                <div style={styles.coachingLabel}>Coach Question</div>
                <div style={styles.coachingText}>{result.coaching_question}</div>
              </div>
            )}

            {/* Limitation Notice */}
            {result.limitation && (
              <div style={styles.limitationCard}>
                <div style={styles.limitationText}>⚡ {result.limitation}</div>
              </div>
            )}

            {/* Verify Another */}
            <button
              style={styles.resetButton}
              onClick={() => {
                setResult(null)
                setCitation('')
                setError('')
              }}
            >
              Verify Another Citation
            </button>
          </>
        )}
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
  inputCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  sectionTitle: {
    color: '#f3f4f6',
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  hint: {
    color: '#6b7280',
    fontSize: '13px',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    resize: 'vertical',
    background: '#11141b',
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
    marginTop: '12px',
  },
  primaryButton: {
    background: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  emptyCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '22px',
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#f3f4f6',
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  errorCard: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#fecaca',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  outcomeBanner: {
    borderRadius: '14px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  outcomeBadge: {
    fontSize: '15px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  outcomeSubtext: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  card: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  parsedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  parsedItem: {
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '10px',
    padding: '12px 14px',
  },
  smallLabel: {
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '6px',
  },
  parsedValue: {
    color: '#e5e7eb',
    fontSize: '13px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  paperTitle: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  paperMeta: {
    color: '#9ca3af',
    fontSize: '13px',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  citationCount: {
    color: '#6b7280',
    fontSize: '12px',
    marginBottom: '10px',
  },
  paperLink: {
    color: '#818cf8',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '10px',
  },
  yearWarning: {
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fcd34d',
    fontSize: '13px',
    lineHeight: '1.6',
    marginTop: '10px',
  },
  coachingCard: {
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.20)',
    borderRadius: '14px',
    padding: '18px',
  },
  coachingLabel: {
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '10px',
  },
  coachingText: {
    color: '#e5e7eb',
    fontSize: '15px',
    lineHeight: '1.7',
    fontStyle: 'italic',
  },
  limitationCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  limitationText: {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  resetButton: {
    background: 'transparent',
    border: '1px solid #2a2d3a',
    borderRadius: '10px',
    padding: '11px 16px',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
}