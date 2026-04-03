import { useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

function getFocusMeta(focus) {
  switch (focus) {
    case 'all weaknesses':
      return {
        label: 'Full Review',
        detail: 'Identifying all major weaknesses across scientific rigor dimensions.',
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.10)',
        border: 'rgba(99, 102, 241, 0.25)',
      }
    case 'remaining issues':
      return {
        label: 'Focused Review',
        detail: 'Focusing on the most critical remaining weaknesses from your last revision.',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.10)',
        border: 'rgba(245, 158, 11, 0.25)',
      }
    default:
      return {
        label: 'Final Polish',
        detail: 'Zeroing in on the single most critical issue remaining in your draft.',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.10)',
        border: 'rgba(16, 185, 129, 0.25)',
      }
  }
}

const RIGOR_DIMENSIONS = [
  'Claims supported by evidence — not just asserted',
  'Reasoning is logical and free of fallacies',
  'Limitations and confounders acknowledged',
  'Contribution is specific and verifiable',
  'Methodology clearly tied to the research question',
  'Conclusions not overclaimed beyond the data',
  'Language is precise — not vague or hand-wavy',
]

export default function DraftReview({ onBack, sessionId }) {
  const feature = featureMeta.f6

  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [submissionCount, setSubmissionCount] = useState(0)

  const handleGetFeedback = async () => {
    if (!draft.trim() || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/feature6/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          draft: draft.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get feedback')
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
        setSubmissionCount(data.submission_number || submissionCount + 1)
      }
    } catch (err) {
      setError('Could not get feedback right now. Please check your backend connection and try again.')
    }

    setLoading(false)
  }

  const focusMeta = result ? getFocusMeta(result.focus) : null

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
          <div style={styles.metaPillMuted}>Scientific rigor review</div>
          {submissionCount > 0 && (
            <div style={styles.metaPillCount}>
              Submission #{submissionCount}
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={styles.infoCard}>
          <div style={styles.infoTitle}>How this works</div>
          <div style={styles.infoText}>
            Submit your draft once and get a full review. Revise and resubmit — each time,
            the feedback gets sharper and more targeted until only the most critical issue remains.
          </div>
          <div style={styles.dimensionGrid}>
            {RIGOR_DIMENSIONS.map((dim, i) => (
              <div key={i} style={styles.dimensionItem}>
                <span style={styles.dimensionDot}>·</span>
                {dim}
              </div>
            ))}
          </div>
        </div>

        {/* Draft Input */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            {submissionCount === 0
              ? 'Paste Your Draft Section'
              : `Paste Your Revised Draft — Submission #${submissionCount + 1}`}
          </div>
          <div style={styles.hint}>
            Paste any section of your draft — introduction, methods, results, or discussion.
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your draft section here..."
            style={styles.textarea}
            disabled={loading}
          />
          <div style={styles.wordCount}>
            {draft.trim() ? `${draft.trim().split(/\s+/).length} words` : '0 words'}
          </div>
          <div style={styles.actions}>
            <button
              onClick={handleGetFeedback}
              disabled={!draft.trim() || loading}
              style={!draft.trim() || loading
                ? { ...styles.primaryButton, ...styles.buttonDisabled }
                : styles.primaryButton}
            >
              {loading
                ? 'Reviewing...'
                : submissionCount === 0
                  ? 'Get Draft Feedback'
                  : 'Submit Revised Draft'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>{error}</div>
        )}

        {!result && !loading && !error && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Paste your draft to begin</div>
            <div style={styles.emptyText}>
              The coach will evaluate your draft for scientific rigor and ask targeted
              questions to help you strengthen it yourself. Each revision gets sharper feedback.
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Focus Banner */}
            <div
              style={{
                ...styles.focusBanner,
                background: focusMeta.bg,
                border: `1px solid ${focusMeta.border}`,
              }}
            >
              <div style={styles.focusBannerLeft}>
                <div
                  style={{
                    ...styles.focusLabel,
                    color: focusMeta.color,
                  }}
                >
                  {focusMeta.label}
                </div>
                <div style={styles.focusDetail}>{focusMeta.detail}</div>
              </div>
              <div
                style={{
                  ...styles.submissionBadge,
                  color: focusMeta.color,
                  background: `${focusMeta.bg}`,
                  border: `1px solid ${focusMeta.border}`,
                }}
              >
                Submission #{result.submission_number}
              </div>
            </div>

            {/* Feedback Questions */}
            <div style={styles.feedbackCard}>
              <div style={styles.feedbackHeader}>
                <div style={styles.sectionTitle}>Coaching Questions</div>
                <div style={styles.questionCount}>
                  {result.question_count} question{result.question_count !== 1 ? 's' : ''}
                </div>
              </div>

              <div style={styles.hint}>
                Each question targets a specific sentence or claim in your draft.
                Revise your draft to address these — then resubmit for sharper feedback.
              </div>

              <div style={styles.questionList}>
                {result.feedback_questions.map((q, index) => (
                  <div key={index} style={styles.questionItem}>
                    <div style={styles.questionNumber}>{index + 1}</div>
                    <div style={styles.questionText}>{q}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next step hint */}
            {result.submission_number < 3 && (
              <div style={styles.nextStepCard}>
                <div style={styles.nextStepText}>
                  Revise your draft based on the questions above, then paste the updated version
                  and resubmit. The next review will focus on remaining issues only.
                </div>
              </div>
            )}

            {result.submission_number >= 3 && (
              <div style={styles.finalCard}>
                <div style={styles.finalText}>
                  You are on your third or later revision. The coach is now focused on your
                  single most critical remaining issue. Address it and your draft should be strong.
                </div>
              </div>
            )}
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
  metaPillCount: {
    background: 'rgba(16, 185, 129, 0.10)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  infoCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  infoTitle: {
    color: '#f3f4f6',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  infoText: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.6',
    marginBottom: '14px',
  },
  dimensionGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dimensionItem: {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '1.5',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  dimensionDot: {
    color: '#6366f1',
    fontSize: '18px',
    lineHeight: '1.2',
  },
  card: {
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
    marginBottom: '14px',
    lineHeight: '1.5',
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
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
  wordCount: {
    color: '#4b5563',
    fontSize: '12px',
    marginTop: '6px',
    textAlign: 'right',
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
    opacity: 0.5,
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
  focusBanner: {
    borderRadius: '14px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap',
  },
  focusBannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  focusLabel: {
    fontSize: '14px',
    fontWeight: '700',
  },
  focusDetail: {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  submissionBadge: {
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  feedbackCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  feedbackHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  questionCount: {
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: '#a5b4fc',
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  questionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  questionItem: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  questionNumber: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    minWidth: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },
  questionText: {
    color: '#e5e7eb',
    fontSize: '14px',
    lineHeight: '1.7',
    paddingTop: '2px',
  },
  nextStepCard: {
    background: 'rgba(99, 102, 241, 0.06)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  nextStepText: {
    color: '#c7d2fe',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  finalCard: {
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  finalText: {
    color: '#6ee7b7',
    fontSize: '13px',
    lineHeight: '1.6',
  },
}