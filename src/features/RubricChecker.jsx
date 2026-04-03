import { useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// --- Official Rubric Tables (hardcoded, verified from official sources) ---

const RUBRIC_DATA = {
  isef: {
    label: 'ISEF — Regeneron International Science and Engineering Fair',
    table: [
      { criterion: 'Creative Ability', detail: 'Originality in question, approach, and analysis', points: '30 pts' },
      { criterion: 'Scientific Thought', detail: 'Problem clarity, variables, controls, data, conclusions', points: '30 pts' },
      { criterion: 'Thoroughness', detail: 'Completeness within original scope', points: '15 pts' },
      { criterion: 'Skill', detail: 'Lab, computation, or observational ability', points: '15 pts' },
      { criterion: 'Clarity', detail: 'Clear explanation of purpose, procedure, and conclusions', points: '10 pts' },
      { criterion: 'Total', detail: '', points: '100 pts', isTotal: true },
    ],
    sources: [
      { label: 'ISEF Judging Criteria — Notre Dame Science Fair', url: 'https://sciencefair.nd.edu/exhibitor-resources/judging-criteria/' },
      { label: 'ISEF Judges Handbook (PDF)', url: 'https://sefi.org/wp-content/uploads/2025/03/JudgesHandbook.pdf' },
    ],
  },

  ap_research: {
    label: 'AP Research — College Board Official Rubric',
    table: [
      { criterion: 'Question, Thesis & Background', detail: 'Clear inquiry question, literature review, identified gap', points: '1–5' },
      { criterion: 'Research Method', detail: 'Design appropriate, replicable, and aligned to question', points: '1–5' },
      { criterion: 'Results, Analysis & Conclusions', detail: 'Data presented, analyzed, new understanding supported', points: '1–5' },
      { criterion: 'Understanding of Research Context', detail: 'Situates findings within broader field', points: '1–5' },
      { criterion: 'Citation & Format', detail: 'Consistent citation style, properly formatted', points: '1–5' },
    ],
    sources: [
      { label: 'AP Research Course & Exam — College Board', url: 'https://apcentral.collegeboard.org/courses/ap-research/exam' },
      { label: 'AP Research Student Assessment Info', url: 'https://apstudents.collegeboard.org/courses/ap-research/assessment' },
      { label: 'AP Research Scoring Guidelines (PDF)', url: 'https://apcentral.collegeboard.org/media/pdf/ap24-sg-research-academic-paper.pdf' },
    ],
  },

  apa: {
    label: 'APA Format — 7th Edition',
    table: [
      { criterion: 'Title Page', detail: 'Running head, title, author, institution, date' },
      { criterion: 'Abstract', detail: '150–250 words, structured summary' },
      { criterion: 'Introduction', detail: 'Background, gap, thesis/research question' },
      { criterion: 'Method', detail: 'Participants, materials, procedure clearly described' },
      { criterion: 'Results', detail: 'Data presented objectively, no interpretation' },
      { criterion: 'Discussion', detail: 'Interpretation, limitations, future directions' },
      { criterion: 'References', detail: 'APA 7th edition format, all sources cited in-text' },
    ],
    sources: [
      { label: 'Official APA Style Guide', url: 'https://apastyle.apa.org' },
    ],
  },

  mla: {
    label: 'MLA Format — 9th Edition',
    table: [
      { criterion: 'Header & Formatting', detail: 'Name, instructor, course, date — double spaced, Times New Roman 12pt' },
      { criterion: 'Works Cited', detail: 'MLA 9th edition, alphabetical, hanging indent' },
      { criterion: 'In-text Citations', detail: 'Author-page format (Smith 23)' },
      { criterion: 'Thesis & Argument', detail: 'Clear arguable thesis, sustained throughout' },
      { criterion: 'Evidence & Analysis', detail: 'Quotes integrated and analyzed, not just dropped' },
      { criterion: 'Voice & Style', detail: 'Academic tone, no first person unless permitted' },
    ],
    sources: [
      { label: 'Official MLA Style Guide', url: 'https://style.mla.org' },
    ],
  },

  class: {
    label: 'Class Assignment — General Academic Writing',
    table: [
      { criterion: 'Research Question', detail: 'Clear, focused, and answerable' },
      { criterion: 'Sources', detail: 'Credible, relevant, properly cited' },
      { criterion: 'Structure', detail: 'Introduction, body, conclusion clearly organized' },
      { criterion: 'Argument', detail: 'Thesis supported with evidence throughout' },
      { criterion: 'Citation Style', detail: 'Consistent with assigned format' },
      { criterion: 'Originality', detail: "Student's own analysis, not just summarizing" },
    ],
    sources: [],
  },
}

const RUBRIC_OPTIONS = [
  { value: 'isef', label: 'ISEF — Science & Engineering Fair' },
  { value: 'ap_research', label: 'AP Research — College Board' },
  { value: 'apa', label: 'APA Format — 7th Edition' },
  { value: 'mla', label: 'MLA Format — 9th Edition' },
  { value: 'class', label: 'Class Assignment' },
]

export default function RubricChecker({ onBack, sessionId }) {
  const feature = featureMeta.f5

  const [submissionType, setSubmissionType] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showSources, setShowSources] = useState(false)

  const handleGetFeedback = async () => {
    if (!submissionType || !draft.trim() || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/feature5/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          submission_type: submissionType,
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
      }
    } catch (err) {
      setError('Could not get feedback right now. Please check your backend connection and try again.')
    }

    setLoading(false)
  }

  const selectedRubricData = submissionType ? RUBRIC_DATA[submissionType] : null
  const canSubmit = submissionType && draft.trim() && !loading
  const hasPoints = selectedRubricData?.table?.some(row => row.points)

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
          <div style={styles.metaPillMuted}>Rubric feedback</div>
        </div>

        {/* Step 1 — Rubric Selection */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Step 1 — Choose a Rubric</div>
          <div style={styles.hint}>
            Select the rubric that matches your submission type.
          </div>
          <div style={styles.rubricGrid}>
            {RUBRIC_OPTIONS.map((option) => (
              <div
                key={option.value}
                style={{
                  ...styles.rubricTile,
                  ...(submissionType === option.value ? styles.rubricTileSelected : {}),
                }}
                onClick={() => {
                  setSubmissionType(option.value)
                  setShowSources(false)
                  setResult(null)
                  setError('')
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rubric Table */}
        {selectedRubricData && (
          <div style={styles.card}>
            <div style={styles.tableHeader}>
              <div style={styles.sectionTitle}>{selectedRubricData.label}</div>
              {selectedRubricData.sources.length > 0 && (
                <button
                  style={styles.sourcesBtn}
                  onClick={() => setShowSources(!showSources)}
                >
                  {showSources ? 'Hide Sources' : 'View Sources'}
                </button>
              )}
            </div>

            {/* Sources */}
            {showSources && selectedRubricData.sources.length > 0 && (
              <div style={styles.sourcesBox}>
                <div style={styles.sourcesLabel}>Official Sources</div>
                {selectedRubricData.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.sourceLink}
                  >
                    ↗ {src.label}
                  </a>
                ))}
              </div>
            )}

            {/* Table */}
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Criterion</th>
                    <th style={styles.th}>Description</th>
                    {hasPoints && <th style={{ ...styles.th, ...styles.thPoints }}>Score</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedRubricData.table.map((row, i) => (
                    <tr
                      key={i}
                      style={row.isTotal ? styles.totalRow : (i % 2 === 0 ? styles.trEven : styles.trOdd)}
                    >
                      <td style={row.isTotal ? styles.tdTotalLabel : styles.tdLabel}>
                        {row.criterion}
                      </td>
                      <td style={row.isTotal ? styles.tdTotalDetail : styles.tdDetail}>
                        {row.detail}
                      </td>
                      {hasPoints && (
                        <td style={row.isTotal ? styles.tdTotalPoints : styles.tdPoints}>
                          {row.points || ''}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 2 — Draft Input */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Step 2 — Paste Your Draft Section</div>
          <div style={styles.hint}>
            Paste any section of your draft — introduction, methods, discussion, etc.
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
              disabled={!canSubmit}
              style={!canSubmit
                ? { ...styles.primaryButton, ...styles.buttonDisabled }
                : styles.primaryButton}
            >
              {loading ? 'Getting Feedback...' : 'Get Rubric Feedback'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>{error}</div>
        )}

        {!result && !loading && !error && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Select a rubric and paste your draft</div>
            <div style={styles.emptyText}>
              The coach will evaluate your draft against the official rubric criteria
              and ask targeted questions to help you improve it yourself.
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Rubric Used */}
            <div style={styles.rubricBanner}>
              <div style={styles.rubricBannerLabel}>Rubric Used</div>
              <div style={styles.rubricBannerName}>{result.rubric_name}</div>
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
                These questions target specific weaknesses in your draft based on the official rubric.
                Answer each one in your own revision — do not ask the coach to fix it for you.
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

            {/* Try Another */}
            <button
              style={styles.resetButton}
              onClick={() => {
                setResult(null)
                setDraft('')
                setError('')
              }}
            >
              Submit Another Draft Section
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
  rubricGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rubricTile: {
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#9ca3af',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    lineHeight: '1.4',
  },
  rubricTileSelected: {
    background: 'rgba(99, 102, 241, 0.10)',
    border: '1px solid rgba(99, 102, 241, 0.40)',
    color: '#a5b4fc',
    fontWeight: '600',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  sourcesBtn: {
    background: 'rgba(99, 102, 241, 0.10)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  sourcesBox: {
    background: 'rgba(99, 102, 241, 0.06)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sourcesLabel: {
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '4px',
  },
  sourceLink: {
    color: '#818cf8',
    fontSize: '13px',
    textDecoration: 'none',
    lineHeight: '1.5',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    background: '#1a1d25',
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    padding: '10px 14px',
    textAlign: 'left',
    borderBottom: '1px solid #2a2d3a',
  },
  thPoints: {
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  trEven: {
    background: '#0f1117',
  },
  trOdd: {
    background: '#11141b',
  },
  totalRow: {
    background: 'rgba(99, 102, 241, 0.08)',
    borderTop: '1px solid rgba(99, 102, 241, 0.2)',
  },
  tdLabel: {
    color: '#f3f4f6',
    fontWeight: '600',
    padding: '10px 14px',
    borderBottom: '1px solid #1e2130',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  },
  tdDetail: {
    color: '#9ca3af',
    padding: '10px 14px',
    borderBottom: '1px solid #1e2130',
    lineHeight: '1.5',
  },
  tdPoints: {
    color: '#a5b4fc',
    fontWeight: '700',
    padding: '10px 14px',
    borderBottom: '1px solid #1e2130',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  tdTotalLabel: {
    color: '#a5b4fc',
    fontWeight: '700',
    padding: '10px 14px',
    whiteSpace: 'nowrap',
  },
  tdTotalDetail: {
    color: '#6b7280',
    padding: '10px 14px',
  },
  tdTotalPoints: {
    color: '#a5b4fc',
    fontWeight: '700',
    padding: '10px 14px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  textarea: {
    width: '100%',
    minHeight: '180px',
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
  rubricBanner: {
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.20)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  rubricBannerLabel: {
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    whiteSpace: 'nowrap',
  },
  rubricBannerName: {
    color: '#c7d2fe',
    fontSize: '14px',
    fontWeight: '600',
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