import { useEffect, useRef, useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const INPUT_TYPES = [
  { value: 'text', label: '📄 Paste Text', hint: 'Paste article, paper section, or blog content directly.' },
  { value: 'url', label: '🔗 Enter URL', hint: 'ArXiv paper URL or blog post URL.' },
  { value: 'pdf', label: '📎 Upload PDF', hint: 'Upload a research paper PDF.' },
]

function getInputTypeMeta(inputType) {
  switch (inputType) {
    case 'arxiv': return 'ArXiv Paper'
    case 'pdf': return 'PDF Upload'
    case 'blog': return 'Blog / Article'
    default: return 'Pasted Text'
  }
}

export default function DeepDive({ onBack, sessionId, initialResearchQuestion = '' }) {
  const feature = featureMeta.f3

  const [inputMode, setInputMode] = useState('text')
  const [textInput, setTextInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [topic, setTopic] = useState(initialResearchQuestion)
  const [loading, setLoading] = useState(false)
  const [loadingVisual, setLoadingVisual] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [visualFileUrl, setVisualFileUrl] = useState('')
  const [expandedCards, setExpandedCards] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (initialResearchQuestion) {
      setTopic(initialResearchQuestion)
    }
  }, [initialResearchQuestion])

  const toggleCard = (index) => {
    setExpandedCards((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const expandAll = () => {
    const all = {}
    result?.qa_pairs?.forEach((_, i) => { all[i] = true })
    setExpandedCards(all)
  }

  const collapseAll = () => setExpandedCards({})

  const handleSubmit = async () => {
    if (!topic.trim()) {
      setError('Please enter your research topic or question first.')
      return
    }

    if (inputMode === 'text' && !textInput.trim()) {
      setError('Please paste some text content.')
      return
    }

    if (inputMode === 'url' && !urlInput.trim()) {
      setError('Please enter a URL.')
      return
    }

    if (inputMode === 'pdf' && !pdfFile) {
      setError('Please upload a PDF file.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setVisualFileUrl('')
    setExpandedCards({})

    try {
      let response

      if (inputMode === 'pdf') {
        const formData = new FormData()
        formData.append('session_id', sessionId)
        formData.append('topic', topic.trim())
        formData.append('file', pdfFile)

        response = await fetch(`${API_BASE}/feature3/qa-pdf`, {
          method: 'POST',
          body: formData,
        })
      } else {
        const inputValue = inputMode === 'url' ? urlInput.trim() : textInput.trim()

        response = await fetch(`${API_BASE}/feature3/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            input: inputValue,
            topic: topic.trim(),
          }),
        })
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to process content')
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message || 'Could not process content right now. Please check your backend connection and try again.')
    }

    setLoading(false)
  }

  const handleGenerateVisual = async () => {
    if (!result?.cache_key || loadingVisual) return

    setLoadingVisual(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/feature3/visual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cache_key: result.cache_key }),
      })

      if (!response.ok) throw new Error('Failed to generate visual')

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setVisualFileUrl(data.file_url || '')
    } catch (err) {
      setError(err.message || 'Could not generate the concept visual.')
    }

    setLoadingVisual(false)
  }

  const wordCount = inputMode === 'text'
    ? (textInput.trim() ? textInput.trim().split(/\s+/).length : 0)
    : 0

  const rightPanel = (
    <div style={styles.visualPanel}>
      <div style={styles.visualHeader}>
        <div>
          <div style={styles.visualTitle}>Concept Flow</div>
          <div style={styles.visualSubtitle}>Logical reading order visual</div>
        </div>
        {result?.cache_key && (
          <button
            onClick={handleGenerateVisual}
            disabled={loadingVisual}
            style={loadingVisual
              ? { ...styles.visualButton, ...styles.buttonDisabled }
              : styles.visualButton}
          >
            {loadingVisual ? 'Generating...' : 'Generate Visual'}
          </button>
        )}
      </div>

      {!visualFileUrl ? (
        <div style={styles.visualEmpty}>
          {result?.cache_key
            ? 'Click Generate Visual to build the concept flow diagram.'
            : 'The concept flow visual will appear here once QA pairs are generated.'}
        </div>
      ) : (
        <div style={styles.visualScrollFrame}>
          <iframe
            title="Concept Flow Visual"
            src={`${API_BASE}${visualFileUrl}`}
            style={styles.iframe}
          />
        </div>
      )}
    </div>
  )

  return (
    <FeatureLayout
      title={feature.title}
      onBack={onBack}
      infoCard={<FeatureInfoCard feature={feature} />}
      showRightPanel={true}
      rightPanel={rightPanel}
    >
      <div style={styles.wrapper}>
        <div style={styles.metaRow}>
          <div style={styles.metaPill}>Session: {sessionId}</div>
          <div style={styles.metaPillMuted}>Deep Dive & QA</div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Your Research Topic</div>
          <div style={styles.hint}>
            What are you trying to learn? This helps the coach focus the questions on what matters to you.
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How does retrieval augmentation improve LLM faithfulness?"
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Content to Analyze</div>
          <div style={styles.inputModeRow}>
            {INPUT_TYPES.map((type) => (
              <div
                key={type.value}
                style={{
                  ...styles.modeTile,
                  ...(inputMode === type.value ? styles.modeTileSelected : {}),
                }}
                onClick={() => {
                  setInputMode(type.value)
                  setError('')
                }}
              >
                {type.label}
              </div>
            ))}
          </div>

          <div style={styles.hint}>
            {INPUT_TYPES.find((t) => t.value === inputMode)?.hint}
          </div>

          {inputMode === 'text' && (
            <>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your article, paper section, or blog content here (minimum 50 words)..."
                style={styles.textarea}
                disabled={loading}
              />
              <div style={styles.wordCount}>
                {wordCount} words
                {wordCount > 0 && wordCount < 50 && (
                  <span style={styles.wordCountWarning}> — minimum 50 words required</span>
                )}
              </div>
            </>
          )}

          {inputMode === 'url' && (
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://arxiv.org/abs/1706.03762 or https://blog.example.com/article"
              style={styles.input}
              disabled={loading}
            />
          )}

          {inputMode === 'pdf' && (
            <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setPdfFile(file)
                }}
                disabled={loading}
              />
              {pdfFile ? (
                <div style={styles.uploadedFile}>
                  <div style={styles.uploadedFileName}>📎 {pdfFile.name}</div>
                  <div style={styles.uploadedFileSize}>
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div style={styles.uploadedFileChange}>Click to change file</div>
                </div>
              ) : (
                <div style={styles.uploadPlaceholder}>
                  <div style={styles.uploadIcon}>📎</div>
                  <div style={styles.uploadText}>Click to upload a PDF</div>
                  <div style={styles.uploadSubtext}>Research papers only — max 10MB</div>
                </div>
              )}
            </div>
          )}

          <div style={styles.actions}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={loading
                ? { ...styles.primaryButton, ...styles.buttonDisabled }
                : styles.primaryButton}
            >
              {loading ? 'Analyzing...' : 'Run Deep Dive'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>{error}</div>
        )}

        {!result && !loading && !error && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Ready to deep dive</div>
            <div style={styles.emptyText}>
              Enter your topic, choose your content type, and run the analysis.
              You will get concept-by-concept questions with simple and scientific explanations.
            </div>
          </div>
        )}

        {result && (
          <>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{result.qa_pairs?.length || 0}</div>
                <div style={styles.statLabel}>Concepts</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{result.chunks_found || 0}</div>
                <div style={styles.statLabel}>Sections</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{result.total_words?.toLocaleString() || 0}</div>
                <div style={styles.statLabel}>Words</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{getInputTypeMeta(result.input_type)}</div>
                <div style={styles.statLabel}>Source Type</div>
              </div>
            </div>

            {result.metadata && (
              <div style={styles.metadataCard}>
                <div style={styles.sectionTitle}>Paper Snapshot</div>
                <div style={styles.metadataGrid}>
                  {result.metadata.research_question && (
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Research Question</div>
                      <div style={styles.metaValue}>{result.metadata.research_question}</div>
                    </div>
                  )}
                  {result.metadata.contribution && (
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Contribution</div>
                      <div style={styles.metaValue}>{result.metadata.contribution}</div>
                    </div>
                  )}
                  {result.metadata.methodology && (
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Methodology</div>
                      <div style={styles.metaValue}>{result.metadata.methodology}</div>
                    </div>
                  )}
                  {result.metadata.limitations && (
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Limitations</div>
                      <div style={styles.metaValue}>{result.metadata.limitations}</div>
                    </div>
                  )}
                  {result.metadata.gaps && (
                    <div style={styles.metaItem}>
                      <div style={styles.metaLabel}>Research Gaps</div>
                      <div style={styles.metaValue}>{result.metadata.gaps}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={styles.qaSection}>
              <div style={styles.qaHeader}>
                <div style={styles.sectionTitle}>Concept Breakdown</div>
                <div style={styles.qaControls}>
                  <button style={styles.controlBtn} onClick={expandAll}>Expand All</button>
                  <button style={styles.controlBtn} onClick={collapseAll}>Collapse All</button>
                </div>
              </div>

              {!result.qa_pairs || result.qa_pairs.length === 0 ? (
                <div style={styles.emptyCard}>
                  <div style={styles.emptyText}>No QA pairs were generated. Try with longer content.</div>
                </div>
              ) : (
                <div style={styles.qaList}>
                  {result.qa_pairs.map((qa, index) => (
                    <div key={index} style={styles.qaCard}>
                      <div
                        style={styles.qaCardHeader}
                        onClick={() => toggleCard(index)}
                      >
                        <div style={styles.qaCardLeft}>
                          <div style={styles.qaIndex}>{index + 1}</div>
                          <div style={styles.qaCardInfo}>
                            <div style={styles.qaChunkTag}>{qa.chunk_title}</div>
                            <div style={styles.qaQuestion}>{qa.question}</div>
                          </div>
                        </div>
                        <div style={styles.qaToggle}>
                          {expandedCards[index] ? '▲' : '▼'}
                        </div>
                      </div>

                      {expandedCards[index] && (
                        <div style={styles.qaCardBody}>
                          <div style={styles.answerBlock}>
                            <div style={styles.answerLabel}>💡 Simple Explanation</div>
                            <div style={styles.answerText}>{qa.simple}</div>
                          </div>
                          <div style={styles.answerBlockScientific}>
                            <div style={styles.answerLabel}>🔬 Scientific Definition</div>
                            <div style={styles.answerText}>{qa.scientific}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  input: {
    width: '100%',
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f3f4f6',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  inputModeRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  modeTile: {
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '10px',
    padding: '10px 16px',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  modeTileSelected: {
    background: 'rgba(99, 102, 241, 0.10)',
    border: '1px solid rgba(99, 102, 241, 0.40)',
    color: '#a5b4fc',
    fontWeight: '600',
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
  wordCountWarning: {
    color: '#f59e0b',
  },
  uploadArea: {
    border: '2px dashed #2a2d3a',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  uploadIcon: {
    fontSize: '32px',
  },
  uploadText: {
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '500',
  },
  uploadSubtext: {
    color: '#4b5563',
    fontSize: '12px',
  },
  uploadedFile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  uploadedFileName: {
    color: '#a5b4fc',
    fontSize: '14px',
    fontWeight: '600',
  },
  uploadedFileSize: {
    color: '#6b7280',
    fontSize: '12px',
  },
  uploadedFileChange: {
    color: '#4b5563',
    fontSize: '12px',
    marginTop: '4px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '14px',
  },
  primaryButton: {
    background: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  statCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'center',
  },
  statValue: {
    color: '#a5b4fc',
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metadataCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  metadataGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '4px',
  },
  metaItem: {
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '10px',
    padding: '12px 14px',
  },
  metaLabel: {
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '6px',
  },
  metaValue: {
    color: '#d1d5db',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  qaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  qaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  qaControls: {
    display: 'flex',
    gap: '8px',
  },
  controlBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  qaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  qaCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  qaCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
  },
  qaCardLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  qaIndex: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    minWidth: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },
  qaCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  qaChunkTag: {
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  qaQuestion: {
    color: '#f3f4f6',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.5',
  },
  qaToggle: {
    color: '#6b7280',
    fontSize: '11px',
    minWidth: '16px',
    textAlign: 'right',
  },
  qaCardBody: {
    borderTop: '1px solid #2a2d3a',
  },
  answerBlock: {
    padding: '16px',
    background: 'rgba(99, 102, 241, 0.04)',
    borderBottom: '1px solid #2a2d3a',
  },
  answerBlockScientific: {
    padding: '16px',
    background: 'rgba(6, 182, 212, 0.04)',
  },
  answerLabel: {
    color: '#9ca3af',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  answerText: {
    color: '#d1d5db',
    fontSize: '13px',
    lineHeight: '1.7',
  },
  visualPanel: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '16px',
    padding: '16px',
    height: '100%',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden',
  },
  visualHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  visualTitle: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '700',
  },
  visualSubtitle: {
    color: '#9ca3af',
    fontSize: '12px',
    marginTop: '4px',
  },
  visualButton: {
    background: '#06b6d4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  visualEmpty: {
    flex: 1,
    border: '1px dashed #2a2d3a',
    borderRadius: '12px',
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '1.7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '18px',
    minHeight: '520px',
  },
  visualScrollFrame: {
    flex: 1,
    minHeight: '720px',
    overflowX: 'auto',
    overflowY: 'auto',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    background: '#0f1117',
  },
  iframe: {
    display: 'block',
    width: '1400px',
    minWidth: '100%',
    height: '100%',
    minHeight: '720px',
    border: 'none',
    background: '#0f1117',
  },
}















// import { useEffect, useRef, useState } from 'react'
// import FeatureLayout from '../components/FeatureLayout'
// import FeatureInfoCard from '../components/FeatureInfoCard'
// import { featureMeta } from '../data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// const INPUT_TYPES = [
//   { value: 'text', label: '📄 Paste Text', hint: 'Paste article, paper section, or blog content directly.' },
//   { value: 'url', label: '🔗 Enter URL', hint: 'ArXiv paper URL or blog post URL.' },
//   { value: 'pdf', label: '📎 Upload PDF', hint: 'Upload a research paper PDF.' },
// ]

// function getInputTypeMeta(inputType) {
//   switch (inputType) {
//     case 'arxiv': return 'ArXiv Paper'
//     case 'pdf': return 'PDF Upload'
//     case 'blog': return 'Blog / Article'
//     default: return 'Pasted Text'
//   }
// }

// export default function DeepDive({ onBack, sessionId, initialResearchQuestion = '' }) {
//   const feature = featureMeta.f3

//   const [inputMode, setInputMode] = useState('text')
//   const [textInput, setTextInput] = useState('')
//   const [urlInput, setUrlInput] = useState('')
//   const [pdfFile, setPdfFile] = useState(null)
//   const [topic, setTopic] = useState(initialResearchQuestion)
//   const [loading, setLoading] = useState(false)
//   const [loadingVisual, setLoadingVisual] = useState(false)
//   const [result, setResult] = useState(null)
//   const [error, setError] = useState('')
//   const [visualFileUrl, setVisualFileUrl] = useState('')
//   const [expandedCards, setExpandedCards] = useState({})
//   const fileInputRef = useRef(null)

//   useEffect(() => {
//     if (initialResearchQuestion) {
//       setTopic(initialResearchQuestion)
//     }
//   }, [initialResearchQuestion])

//   const toggleCard = (index) => {
//     setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }))
//   }

//   const expandAll = () => {
//     const all = {}
//     result?.qa_pairs?.forEach((_, i) => { all[i] = true })
//     setExpandedCards(all)
//   }

//   const collapseAll = () => setExpandedCards({})

//   const handleSubmit = async () => {
//     if (!topic.trim()) {
//       setError('Please enter your research topic or question first.')
//       return
//     }

//     if (inputMode === 'text' && !textInput.trim()) {
//       setError('Please paste some text content.')
//       return
//     }

//     if (inputMode === 'url' && !urlInput.trim()) {
//       setError('Please enter a URL.')
//       return
//     }

//     if (inputMode === 'pdf' && !pdfFile) {
//       setError('Please upload a PDF file.')
//       return
//     }

//     setLoading(true)
//     setError('')
//     setResult(null)
//     setVisualFileUrl('')
//     setExpandedCards({})

//     try {
//       let response

//       if (inputMode === 'pdf') {
//         const formData = new FormData()
//         formData.append('session_id', sessionId)
//         formData.append('topic', topic.trim())
//         formData.append('file', pdfFile)

//         response = await fetch(`${API_BASE}/feature3/qa-pdf`, {
//           method: 'POST',
//           body: formData,
//         })
//       } else {
//         const inputValue = inputMode === 'url' ? urlInput.trim() : textInput.trim()

//         response = await fetch(`${API_BASE}/feature3/qa`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             session_id: sessionId,
//             input: inputValue,
//             topic: topic.trim(),
//           }),
//         })
//       }

//       if (!response.ok) {
//         const errData = await response.json().catch(() => ({}))
//         throw new Error(errData.detail || 'Failed to process content')
//       }

//       const data = await response.json()

//       if (data.error) {
//         setError(data.error)
//       } else {
//         setResult(data)
//       }
//     } catch (err) {
//       setError(err.message || 'Could not process content right now. Please check your backend connection and try again.')
//     }

//     setLoading(false)
//   }

//   const handleGenerateVisual = async () => {
//     if (!result?.cache_key || loadingVisual) return

//     setLoadingVisual(true)
//     setError('')

//     try {
//       const response = await fetch(`${API_BASE}/feature3/visual`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ cache_key: result.cache_key }),
//       })

//       if (!response.ok) throw new Error('Failed to generate visual')

//       const data = await response.json()
//       if (data.error) throw new Error(data.error)

//       setVisualFileUrl(data.file_url || '')
//     } catch (err) {
//       setError(err.message || 'Could not generate the concept visual.')
//     }

//     setLoadingVisual(false)
//   }

//   const wordCount = inputMode === 'text'
//     ? (textInput.trim() ? textInput.trim().split(/\s+/).length : 0)
//     : 0

//   const rightPanel = (
//     <div style={styles.visualPanel}>
//       <div style={styles.visualHeader}>
//         <div>
//           <div style={styles.visualTitle}>Concept Flow</div>
//           <div style={styles.visualSubtitle}>Logical reading order visual</div>
//         </div>
//         {result?.cache_key && (
//           <button
//             onClick={handleGenerateVisual}
//             disabled={loadingVisual}
//             style={loadingVisual
//               ? { ...styles.visualButton, ...styles.buttonDisabled }
//               : styles.visualButton}
//           >
//             {loadingVisual ? 'Generating...' : 'Generate Visual'}
//           </button>
//         )}
//       </div>

//       {!visualFileUrl ? (
//         <div style={styles.visualEmpty}>
//           {result?.cache_key
//             ? 'Click Generate Visual to build the concept flow diagram.'
//             : 'The concept flow visual will appear here once QA pairs are generated.'}
//         </div>
//       ) : (
//         <iframe
//           title="Concept Flow Visual"
//           src={`${API_BASE}${visualFileUrl}`}
//           style={styles.iframe}
//         />
//       )}
//     </div>
//   )

//   return (
//     <FeatureLayout
//       title={feature.title}
//       onBack={onBack}
//       infoCard={<FeatureInfoCard feature={feature} />}
//       showRightPanel={true}
//       rightPanel={rightPanel}
//     >
//       <div style={styles.wrapper}>
//         <div style={styles.metaRow}>
//           <div style={styles.metaPill}>Session: {sessionId}</div>
//           <div style={styles.metaPillMuted}>Deep Dive & QA</div>
//         </div>

//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Your Research Topic</div>
//           <div style={styles.hint}>
//             What are you trying to learn? This helps the coach focus the questions on what matters to you.
//           </div>
//           <input
//             type="text"
//             value={topic}
//             onChange={(e) => setTopic(e.target.value)}
//             placeholder="e.g. How does retrieval augmentation improve LLM faithfulness?"
//             style={styles.input}
//             disabled={loading}
//           />
//         </div>

//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Content to Analyze</div>
//           <div style={styles.inputModeRow}>
//             {INPUT_TYPES.map((type) => (
//               <div
//                 key={type.value}
//                 style={{
//                   ...styles.modeTile,
//                   ...(inputMode === type.value ? styles.modeTileSelected : {}),
//                 }}
//                 onClick={() => {
//                   setInputMode(type.value)
//                   setError('')
//                 }}
//               >
//                 {type.label}
//               </div>
//             ))}
//           </div>

//           <div style={styles.hint}>
//             {INPUT_TYPES.find(t => t.value === inputMode)?.hint}
//           </div>

//           {inputMode === 'text' && (
//             <>
//               <textarea
//                 value={textInput}
//                 onChange={(e) => setTextInput(e.target.value)}
//                 placeholder="Paste your article, paper section, or blog content here (minimum 50 words)..."
//                 style={styles.textarea}
//                 disabled={loading}
//               />
//               <div style={styles.wordCount}>
//                 {wordCount} words
//                 {wordCount > 0 && wordCount < 50 && (
//                   <span style={styles.wordCountWarning}> — minimum 50 words required</span>
//                 )}
//               </div>
//             </>
//           )}

//           {inputMode === 'url' && (
//             <input
//               type="text"
//               value={urlInput}
//               onChange={(e) => setUrlInput(e.target.value)}
//               placeholder="e.g. https://arxiv.org/abs/1706.03762 or https://blog.example.com/article"
//               style={styles.input}
//               disabled={loading}
//             />
//           )}

//           {inputMode === 'pdf' && (
//             <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".pdf"
//                 style={{ display: 'none' }}
//                 onChange={(e) => {
//                   const file = e.target.files?.[0]
//                   if (file) setPdfFile(file)
//                 }}
//                 disabled={loading}
//               />
//               {pdfFile ? (
//                 <div style={styles.uploadedFile}>
//                   <div style={styles.uploadedFileName}>📎 {pdfFile.name}</div>
//                   <div style={styles.uploadedFileSize}>
//                     {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
//                   </div>
//                   <div style={styles.uploadedFileChange}>Click to change file</div>
//                 </div>
//               ) : (
//                 <div style={styles.uploadPlaceholder}>
//                   <div style={styles.uploadIcon}>📎</div>
//                   <div style={styles.uploadText}>Click to upload a PDF</div>
//                   <div style={styles.uploadSubtext}>Research papers only — max 10MB</div>
//                 </div>
//               )}
//             </div>
//           )}

//           <div style={styles.actions}>
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               style={loading
//                 ? { ...styles.primaryButton, ...styles.buttonDisabled }
//                 : styles.primaryButton}
//             >
//               {loading ? 'Analyzing...' : 'Run Deep Dive'}
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div style={styles.errorCard}>{error}</div>
//         )}

//         {!result && !loading && !error && (
//           <div style={styles.emptyCard}>
//             <div style={styles.emptyTitle}>Ready to deep dive</div>
//             <div style={styles.emptyText}>
//               Enter your topic, choose your content type, and run the analysis.
//               You will get concept-by-concept questions with simple and scientific explanations.
//             </div>
//           </div>
//         )}

//         {result && (
//           <>
//             <div style={styles.statsRow}>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{result.qa_pairs?.length || 0}</div>
//                 <div style={styles.statLabel}>Concepts</div>
//               </div>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{result.chunks_found || 0}</div>
//                 <div style={styles.statLabel}>Sections</div>
//               </div>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{result.total_words?.toLocaleString() || 0}</div>
//                 <div style={styles.statLabel}>Words</div>
//               </div>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{getInputTypeMeta(result.input_type)}</div>
//                 <div style={styles.statLabel}>Source Type</div>
//               </div>
//             </div>

//             {result.metadata && (
//               <div style={styles.metadataCard}>
//                 <div style={styles.sectionTitle}>Paper Snapshot</div>
//                 <div style={styles.metadataGrid}>
//                   {result.metadata.research_question && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Research Question</div>
//                       <div style={styles.metaValue}>{result.metadata.research_question}</div>
//                     </div>
//                   )}
//                   {result.metadata.contribution && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Contribution</div>
//                       <div style={styles.metaValue}>{result.metadata.contribution}</div>
//                     </div>
//                   )}
//                   {result.metadata.methodology && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Methodology</div>
//                       <div style={styles.metaValue}>{result.metadata.methodology}</div>
//                     </div>
//                   )}
//                   {result.metadata.limitations && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Limitations</div>
//                       <div style={styles.metaValue}>{result.metadata.limitations}</div>
//                     </div>
//                   )}
//                   {result.metadata.gaps && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Research Gaps</div>
//                       <div style={styles.metaValue}>{result.metadata.gaps}</div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             <div style={styles.qaSection}>
//               <div style={styles.qaHeader}>
//                 <div style={styles.sectionTitle}>Concept Breakdown</div>
//                 <div style={styles.qaControls}>
//                   <button style={styles.controlBtn} onClick={expandAll}>Expand All</button>
//                   <button style={styles.controlBtn} onClick={collapseAll}>Collapse All</button>
//                 </div>
//               </div>

//               {!result.qa_pairs || result.qa_pairs.length === 0 ? (
//                 <div style={styles.emptyCard}>
//                   <div style={styles.emptyText}>No QA pairs were generated. Try with longer content.</div>
//                 </div>
//               ) : (
//                 <div style={styles.qaList}>
//                   {result.qa_pairs.map((qa, index) => (
//                     <div key={index} style={styles.qaCard}>
//                       <div
//                         style={styles.qaCardHeader}
//                         onClick={() => toggleCard(index)}
//                       >
//                         <div style={styles.qaCardLeft}>
//                           <div style={styles.qaIndex}>{index + 1}</div>
//                           <div style={styles.qaCardInfo}>
//                             <div style={styles.qaChunkTag}>{qa.chunk_title}</div>
//                             <div style={styles.qaQuestion}>{qa.question}</div>
//                           </div>
//                         </div>
//                         <div style={styles.qaToggle}>
//                           {expandedCards[index] ? '▲' : '▼'}
//                         </div>
//                       </div>

//                       {expandedCards[index] && (
//                         <div style={styles.qaCardBody}>
//                           <div style={styles.answerBlock}>
//                             <div style={styles.answerLabel}>💡 Simple Explanation</div>
//                             <div style={styles.answerText}>{qa.simple}</div>
//                           </div>
//                           <div style={styles.answerBlockScientific}>
//                             <div style={styles.answerLabel}>🔬 Scientific Definition</div>
//                             <div style={styles.answerText}>{qa.scientific}</div>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </div>
//     </FeatureLayout>
//   )
// }

// const styles = {
//   wrapper: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '18px',
//   },
//   metaRow: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//     flexWrap: 'wrap',
//   },
//   metaPill: {
//     background: 'rgba(99, 102, 241, 0.12)',
//     border: '1px solid rgba(99, 102, 241, 0.25)',
//     color: '#a5b4fc',
//     borderRadius: '999px',
//     padding: '6px 12px',
//     fontSize: '12px',
//     fontWeight: '600',
//   },
//   metaPillMuted: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     color: '#9ca3af',
//     borderRadius: '999px',
//     padding: '6px 12px',
//     fontSize: '12px',
//     fontWeight: '500',
//   },
//   card: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   sectionTitle: {
//     color: '#f3f4f6',
//     fontSize: '18px',
//     fontWeight: '700',
//     marginBottom: '8px',
//   },
//   hint: {
//     color: '#6b7280',
//     fontSize: '13px',
//     marginBottom: '12px',
//     lineHeight: '1.5',
//   },
//   input: {
//     width: '100%',
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '12px 16px',
//     color: '#f3f4f6',
//     fontSize: '14px',
//     outline: 'none',
//     boxSizing: 'border-box',
//     fontFamily: 'inherit',
//   },
//   inputModeRow: {
//     display: 'flex',
//     gap: '10px',
//     marginBottom: '14px',
//     flexWrap: 'wrap',
//   },
//   modeTile: {
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '10px',
//     padding: '10px 16px',
//     color: '#9ca3af',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.15s',
//   },
//   modeTileSelected: {
//     background: 'rgba(99, 102, 241, 0.10)',
//     border: '1px solid rgba(99, 102, 241, 0.40)',
//     color: '#a5b4fc',
//     fontWeight: '600',
//   },
//   textarea: {
//     width: '100%',
//     minHeight: '180px',
//     resize: 'vertical',
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '14px 16px',
//     color: '#f3f4f6',
//     fontSize: '14px',
//     lineHeight: '1.6',
//     outline: 'none',
//     boxSizing: 'border-box',
//     fontFamily: 'inherit',
//   },
//   wordCount: {
//     color: '#4b5563',
//     fontSize: '12px',
//     marginTop: '6px',
//     textAlign: 'right',
//   },
//   wordCountWarning: {
//     color: '#f59e0b',
//   },
//   uploadArea: {
//     border: '2px dashed #2a2d3a',
//     borderRadius: '12px',
//     padding: '32px',
//     textAlign: 'center',
//     cursor: 'pointer',
//     transition: 'border-color 0.2s',
//   },
//   uploadPlaceholder: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     gap: '8px',
//   },
//   uploadIcon: {
//     fontSize: '32px',
//   },
//   uploadText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     fontWeight: '500',
//   },
//   uploadSubtext: {
//     color: '#4b5563',
//     fontSize: '12px',
//   },
//   uploadedFile: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     gap: '6px',
//   },
//   uploadedFileName: {
//     color: '#a5b4fc',
//     fontSize: '14px',
//     fontWeight: '600',
//   },
//   uploadedFileSize: {
//     color: '#6b7280',
//     fontSize: '12px',
//   },
//   uploadedFileChange: {
//     color: '#4b5563',
//     fontSize: '12px',
//     marginTop: '4px',
//   },
//   actions: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//     marginTop: '14px',
//   },
//   primaryButton: {
//     background: '#6366f1',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '12px 20px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//     cursor: 'not-allowed',
//   },
//   emptyCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '22px',
//     textAlign: 'center',
//   },
//   emptyTitle: {
//     color: '#f3f4f6',
//     fontSize: '18px',
//     fontWeight: '700',
//     marginBottom: '8px',
//   },
//   emptyText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   errorCard: {
//     background: 'rgba(239, 68, 68, 0.08)',
//     border: '1px solid rgba(239, 68, 68, 0.25)',
//     color: '#fecaca',
//     borderRadius: '12px',
//     padding: '14px 16px',
//     fontSize: '14px',
//     lineHeight: '1.6',
//   },
//   statsRow: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
//     gap: '12px',
//   },
//   statCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '14px',
//     textAlign: 'center',
//   },
//   statValue: {
//     color: '#a5b4fc',
//     fontSize: '20px',
//     fontWeight: '700',
//     marginBottom: '4px',
//   },
//   statLabel: {
//     color: '#6b7280',
//     fontSize: '11px',
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//   },
//   metadataCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   metadataGrid: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//     marginTop: '4px',
//   },
//   metaItem: {
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '10px',
//     padding: '12px 14px',
//   },
//   metaLabel: {
//     color: '#6366f1',
//     fontSize: '11px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.6px',
//     marginBottom: '6px',
//   },
//   metaValue: {
//     color: '#d1d5db',
//     fontSize: '13px',
//     lineHeight: '1.6',
//   },
//   qaSection: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   qaHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     flexWrap: 'wrap',
//   },
//   qaControls: {
//     display: 'flex',
//     gap: '8px',
//   },
//   controlBtn: {
//     background: 'rgba(255,255,255,0.05)',
//     border: '1px solid #2a2d3a',
//     borderRadius: '8px',
//     padding: '6px 14px',
//     color: '#9ca3af',
//     fontSize: '12px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   qaList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   qaCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     overflow: 'hidden',
//   },
//   qaCardHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     padding: '14px 16px',
//     cursor: 'pointer',
//   },
//   qaCardLeft: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     gap: '12px',
//     flex: 1,
//     minWidth: 0,
//   },
//   qaIndex: {
//     background: 'rgba(99, 102, 241, 0.15)',
//     color: '#818cf8',
//     borderRadius: '50%',
//     width: '28px',
//     height: '28px',
//     minWidth: '28px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '12px',
//     fontWeight: '700',
//   },
//   qaCardInfo: {
//     flex: 1,
//     minWidth: 0,
//   },
//   qaChunkTag: {
//     color: '#6366f1',
//     fontSize: '11px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     marginBottom: '4px',
//   },
//   qaQuestion: {
//     color: '#f3f4f6',
//     fontSize: '14px',
//     fontWeight: '500',
//     lineHeight: '1.5',
//   },
//   qaToggle: {
//     color: '#6b7280',
//     fontSize: '11px',
//     minWidth: '16px',
//     textAlign: 'right',
//   },
//   qaCardBody: {
//     borderTop: '1px solid #2a2d3a',
//   },
//   answerBlock: {
//     padding: '16px',
//     background: 'rgba(99, 102, 241, 0.04)',
//     borderBottom: '1px solid #2a2d3a',
//   },
//   answerBlockScientific: {
//     padding: '16px',
//     background: 'rgba(6, 182, 212, 0.04)',
//   },
//   answerLabel: {
//     color: '#9ca3af',
//     fontSize: '11px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     marginBottom: '8px',
//   },
//   answerText: {
//     color: '#d1d5db',
//     fontSize: '13px',
//     lineHeight: '1.7',
//   },
//   visualPanel: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '16px',
//     padding: '16px',
//     minHeight: '560px',
//     position: 'sticky',
//     top: '92px',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   visualHeader: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     gap: '12px',
//     flexWrap: 'wrap',
//   },
//   visualTitle: {
//     color: '#f3f4f6',
//     fontSize: '16px',
//     fontWeight: '700',
//   },
//   visualSubtitle: {
//     color: '#9ca3af',
//     fontSize: '12px',
//     marginTop: '4px',
//   },
//   visualButton: {
//     background: '#06b6d4',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '10px 14px',
//     fontSize: '13px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   visualEmpty: {
//     flex: 1,
//     border: '1px dashed #2a2d3a',
//     borderRadius: '12px',
//     color: '#9ca3af',
//     fontSize: '14px',
//     lineHeight: '1.7',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     textAlign: 'center',
//     padding: '18px',
//   },
//   iframe: {
//     width: '100%',
//     flex: 1,
//     minHeight: '460px',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     background: '#0f1117',
//   },
// }














// import { useState, useRef } from 'react'
// import FeatureLayout from '../components/FeatureLayout'
// import FeatureInfoCard from '../components/FeatureInfoCard'
// import { featureMeta } from '../data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// const INPUT_TYPES = [
//   { value: 'text', label: '📄 Paste Text', hint: 'Paste article, paper section, or blog content directly.' },
//   { value: 'url', label: '🔗 Enter URL', hint: 'ArXiv paper URL or blog post URL.' },
//   { value: 'pdf', label: '📎 Upload PDF', hint: 'Upload a research paper PDF.' },
// ]

// function getInputTypeMeta(inputType) {
//   switch (inputType) {
//     case 'arxiv': return 'ArXiv Paper'
//     case 'pdf': return 'PDF Upload'
//     case 'blog': return 'Blog / Article'
//     default: return 'Pasted Text'
//   }
// }

// export default function DeepDive({ onBack, sessionId }) {
//   const feature = featureMeta.f3

//   const [inputMode, setInputMode] = useState('text')
//   const [textInput, setTextInput] = useState('')
//   const [urlInput, setUrlInput] = useState('')
//   const [pdfFile, setPdfFile] = useState(null)
//   const [topic, setTopic] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [loadingVisual, setLoadingVisual] = useState(false)
//   const [result, setResult] = useState(null)
//   const [error, setError] = useState('')
//   const [visualFileUrl, setVisualFileUrl] = useState('')
//   const [expandedCards, setExpandedCards] = useState({})
//   const fileInputRef = useRef(null)

//   const toggleCard = (index) => {
//     setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }))
//   }

//   const expandAll = () => {
//     const all = {}
//     result?.qa_pairs?.forEach((_, i) => { all[i] = true })
//     setExpandedCards(all)
//   }

//   const collapseAll = () => setExpandedCards({})

//   const handleSubmit = async () => {
//     if (!topic.trim()) {
//       setError('Please enter your research topic or question first.')
//       return
//     }

//     if (inputMode === 'text' && !textInput.trim()) {
//       setError('Please paste some text content.')
//       return
//     }

//     if (inputMode === 'url' && !urlInput.trim()) {
//       setError('Please enter a URL.')
//       return
//     }

//     if (inputMode === 'pdf' && !pdfFile) {
//       setError('Please upload a PDF file.')
//       return
//     }

//     setLoading(true)
//     setError('')
//     setResult(null)
//     setVisualFileUrl('')
//     setExpandedCards({})

//     try {
//       let response

//       if (inputMode === 'pdf') {
//         const formData = new FormData()
//         formData.append('session_id', sessionId)
//         formData.append('topic', topic.trim())
//         formData.append('file', pdfFile)

//         response = await fetch(`${API_BASE}/feature3/qa-pdf`, {
//           method: 'POST',
//           body: formData,
//         })
//       } else {
//         const inputValue = inputMode === 'url' ? urlInput.trim() : textInput.trim()

//         response = await fetch(`${API_BASE}/feature3/qa`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             session_id: sessionId,
//             input: inputValue,
//             topic: topic.trim(),
//           }),
//         })
//       }

//       if (!response.ok) {
//         const errData = await response.json().catch(() => ({}))
//         throw new Error(errData.detail || 'Failed to process content')
//       }

//       const data = await response.json()

//       if (data.error) {
//         setError(data.error)
//       } else {
//         setResult(data)
//       }
//     } catch (err) {
//       setError(err.message || 'Could not process content right now. Please check your backend connection and try again.')
//     }

//     setLoading(false)
//   }

//   const handleGenerateVisual = async () => {
//     if (!result?.cache_key || loadingVisual) return

//     setLoadingVisual(true)
//     setError('')

//     try {
//       const response = await fetch(`${API_BASE}/feature3/visual`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ cache_key: result.cache_key }),
//       })

//       if (!response.ok) throw new Error('Failed to generate visual')

//       const data = await response.json()
//       if (data.error) throw new Error(data.error)

//       setVisualFileUrl(data.file_url || '')
//     } catch (err) {
//       setError(err.message || 'Could not generate the concept visual.')
//     }

//     setLoadingVisual(false)
//   }

//   const wordCount = inputMode === 'text'
//     ? (textInput.trim() ? textInput.trim().split(/\s+/).length : 0)
//     : 0

//   const rightPanel = (
//     <div style={styles.visualPanel}>
//       <div style={styles.visualHeader}>
//         <div>
//           <div style={styles.visualTitle}>Concept Flow</div>
//           <div style={styles.visualSubtitle}>Logical reading order visual</div>
//         </div>
//         {result?.cache_key && (
//           <button
//             onClick={handleGenerateVisual}
//             disabled={loadingVisual}
//             style={loadingVisual
//               ? { ...styles.visualButton, ...styles.buttonDisabled }
//               : styles.visualButton}
//           >
//             {loadingVisual ? 'Generating...' : 'Generate Visual'}
//           </button>
//         )}
//       </div>

//       {!visualFileUrl ? (
//         <div style={styles.visualEmpty}>
//           {result?.cache_key
//             ? 'Click Generate Visual to build the concept flow diagram.'
//             : 'The concept flow visual will appear here once QA pairs are generated.'}
//         </div>
//       ) : (
//         <iframe
//           title="Concept Flow Visual"
//           src={`${API_BASE}${visualFileUrl}`}
//           style={styles.iframe}
//         />
//       )}
//     </div>
//   )

//   return (
//     <FeatureLayout
//       title={feature.title}
//       onBack={onBack}
//       infoCard={<FeatureInfoCard feature={feature} />}
//       showRightPanel={true}
//       rightPanel={rightPanel}
//     >
//       <div style={styles.wrapper}>
//         <div style={styles.metaRow}>
//           <div style={styles.metaPill}>Session: {sessionId}</div>
//           <div style={styles.metaPillMuted}>Deep Dive & QA</div>
//         </div>

//         {/* Topic Input */}
//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Your Research Topic</div>
//           <div style={styles.hint}>
//             What are you trying to learn? This helps the coach focus the questions on what matters to you.
//           </div>
//           <input
//             type="text"
//             value={topic}
//             onChange={(e) => setTopic(e.target.value)}
//             placeholder="e.g. How does retrieval augmentation improve LLM faithfulness?"
//             style={styles.input}
//             disabled={loading}
//           />
//         </div>

//         {/* Input Mode Selector */}
//         <div style={styles.card}>
//           <div style={styles.sectionTitle}>Content to Analyze</div>
//           <div style={styles.inputModeRow}>
//             {INPUT_TYPES.map((type) => (
//               <div
//                 key={type.value}
//                 style={{
//                   ...styles.modeTile,
//                   ...(inputMode === type.value ? styles.modeTileSelected : {}),
//                 }}
//                 onClick={() => {
//                   setInputMode(type.value)
//                   setError('')
//                 }}
//               >
//                 {type.label}
//               </div>
//             ))}
//           </div>

//           <div style={styles.hint}>
//             {INPUT_TYPES.find(t => t.value === inputMode)?.hint}
//           </div>

//           {/* Text Input */}
//           {inputMode === 'text' && (
//             <>
//               <textarea
//                 value={textInput}
//                 onChange={(e) => setTextInput(e.target.value)}
//                 placeholder="Paste your article, paper section, or blog content here (minimum 50 words)..."
//                 style={styles.textarea}
//                 disabled={loading}
//               />
//               <div style={styles.wordCount}>
//                 {wordCount} words
//                 {wordCount > 0 && wordCount < 50 && (
//                   <span style={styles.wordCountWarning}> — minimum 50 words required</span>
//                 )}
//               </div>
//             </>
//           )}

//           {/* URL Input */}
//           {inputMode === 'url' && (
//             <input
//               type="text"
//               value={urlInput}
//               onChange={(e) => setUrlInput(e.target.value)}
//               placeholder="e.g. https://arxiv.org/abs/1706.03762 or https://blog.example.com/article"
//               style={styles.input}
//               disabled={loading}
//             />
//           )}

//           {/* PDF Upload */}
//           {inputMode === 'pdf' && (
//             <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".pdf"
//                 style={{ display: 'none' }}
//                 onChange={(e) => {
//                   const file = e.target.files?.[0]
//                   if (file) setPdfFile(file)
//                 }}
//                 disabled={loading}
//               />
//               {pdfFile ? (
//                 <div style={styles.uploadedFile}>
//                   <div style={styles.uploadedFileName}>📎 {pdfFile.name}</div>
//                   <div style={styles.uploadedFileSize}>
//                     {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
//                   </div>
//                   <div style={styles.uploadedFileChange}>Click to change file</div>
//                 </div>
//               ) : (
//                 <div style={styles.uploadPlaceholder}>
//                   <div style={styles.uploadIcon}>📎</div>
//                   <div style={styles.uploadText}>Click to upload a PDF</div>
//                   <div style={styles.uploadSubtext}>Research papers only — max 10MB</div>
//                 </div>
//               )}
//             </div>
//           )}

//           <div style={styles.actions}>
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               style={loading
//                 ? { ...styles.primaryButton, ...styles.buttonDisabled }
//                 : styles.primaryButton}
//             >
//               {loading ? 'Analyzing...' : 'Run Deep Dive'}
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div style={styles.errorCard}>{error}</div>
//         )}

//         {!result && !loading && !error && (
//           <div style={styles.emptyCard}>
//             <div style={styles.emptyTitle}>Ready to deep dive</div>
//             <div style={styles.emptyText}>
//               Enter your topic, choose your content type, and run the analysis.
//               You will get concept-by-concept questions with simple and scientific explanations.
//             </div>
//           </div>
//         )}

//         {result && (
//           <>
//             {/* Stats Row */}
//             <div style={styles.statsRow}>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{result.qa_pairs?.length || 0}</div>
//                 <div style={styles.statLabel}>Concepts</div>
//               </div>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{result.chunks_found || 0}</div>
//                 <div style={styles.statLabel}>Sections</div>
//               </div>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{result.total_words?.toLocaleString() || 0}</div>
//                 <div style={styles.statLabel}>Words</div>
//               </div>
//               <div style={styles.statCard}>
//                 <div style={styles.statValue}>{getInputTypeMeta(result.input_type)}</div>
//                 <div style={styles.statLabel}>Source Type</div>
//               </div>
//             </div>

//             {/* Paper Metadata */}
//             {result.metadata && (
//               <div style={styles.metadataCard}>
//                 <div style={styles.sectionTitle}>Paper Snapshot</div>
//                 <div style={styles.metadataGrid}>
//                   {result.metadata.research_question && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Research Question</div>
//                       <div style={styles.metaValue}>{result.metadata.research_question}</div>
//                     </div>
//                   )}
//                   {result.metadata.contribution && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Contribution</div>
//                       <div style={styles.metaValue}>{result.metadata.contribution}</div>
//                     </div>
//                   )}
//                   {result.metadata.methodology && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Methodology</div>
//                       <div style={styles.metaValue}>{result.metadata.methodology}</div>
//                     </div>
//                   )}
//                   {result.metadata.limitations && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Limitations</div>
//                       <div style={styles.metaValue}>{result.metadata.limitations}</div>
//                     </div>
//                   )}
//                   {result.metadata.gaps && (
//                     <div style={styles.metaItem}>
//                       <div style={styles.metaLabel}>Research Gaps</div>
//                       <div style={styles.metaValue}>{result.metadata.gaps}</div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* QA Pairs */}
//             <div style={styles.qaSection}>
//               <div style={styles.qaHeader}>
//                 <div style={styles.sectionTitle}>Concept Breakdown</div>
//                 <div style={styles.qaControls}>
//                   <button style={styles.controlBtn} onClick={expandAll}>Expand All</button>
//                   <button style={styles.controlBtn} onClick={collapseAll}>Collapse All</button>
//                 </div>
//               </div>

//               {!result.qa_pairs || result.qa_pairs.length === 0 ? (
//                 <div style={styles.emptyCard}>
//                   <div style={styles.emptyText}>No QA pairs were generated. Try with longer content.</div>
//                 </div>
//               ) : (
//                 <div style={styles.qaList}>
//                   {result.qa_pairs.map((qa, index) => (
//                     <div key={index} style={styles.qaCard}>
//                       <div
//                         style={styles.qaCardHeader}
//                         onClick={() => toggleCard(index)}
//                       >
//                         <div style={styles.qaCardLeft}>
//                           <div style={styles.qaIndex}>{index + 1}</div>
//                           <div style={styles.qaCardInfo}>
//                             <div style={styles.qaChunkTag}>{qa.chunk_title}</div>
//                             <div style={styles.qaQuestion}>{qa.question}</div>
//                           </div>
//                         </div>
//                         <div style={styles.qaToggle}>
//                           {expandedCards[index] ? '▲' : '▼'}
//                         </div>
//                       </div>

//                       {expandedCards[index] && (
//                         <div style={styles.qaCardBody}>
//                           <div style={styles.answerBlock}>
//                             <div style={styles.answerLabel}>💡 Simple Explanation</div>
//                             <div style={styles.answerText}>{qa.simple}</div>
//                           </div>
//                           <div style={styles.answerBlockScientific}>
//                             <div style={styles.answerLabel}>🔬 Scientific Definition</div>
//                             <div style={styles.answerText}>{qa.scientific}</div>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </div>
//     </FeatureLayout>
//   )
// }

// const styles = {
//   wrapper: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '18px',
//   },
//   metaRow: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '10px',
//     flexWrap: 'wrap',
//   },
//   metaPill: {
//     background: 'rgba(99, 102, 241, 0.12)',
//     border: '1px solid rgba(99, 102, 241, 0.25)',
//     color: '#a5b4fc',
//     borderRadius: '999px',
//     padding: '6px 12px',
//     fontSize: '12px',
//     fontWeight: '600',
//   },
//   metaPillMuted: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     color: '#9ca3af',
//     borderRadius: '999px',
//     padding: '6px 12px',
//     fontSize: '12px',
//     fontWeight: '500',
//   },
//   card: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   sectionTitle: {
//     color: '#f3f4f6',
//     fontSize: '18px',
//     fontWeight: '700',
//     marginBottom: '8px',
//   },
//   hint: {
//     color: '#6b7280',
//     fontSize: '13px',
//     marginBottom: '12px',
//     lineHeight: '1.5',
//   },
//   input: {
//     width: '100%',
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '12px 16px',
//     color: '#f3f4f6',
//     fontSize: '14px',
//     outline: 'none',
//     boxSizing: 'border-box',
//     fontFamily: 'inherit',
//   },
//   inputModeRow: {
//     display: 'flex',
//     gap: '10px',
//     marginBottom: '14px',
//     flexWrap: 'wrap',
//   },
//   modeTile: {
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '10px',
//     padding: '10px 16px',
//     color: '#9ca3af',
//     fontSize: '13px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     transition: 'all 0.15s',
//   },
//   modeTileSelected: {
//     background: 'rgba(99, 102, 241, 0.10)',
//     border: '1px solid rgba(99, 102, 241, 0.40)',
//     color: '#a5b4fc',
//     fontWeight: '600',
//   },
//   textarea: {
//     width: '100%',
//     minHeight: '180px',
//     resize: 'vertical',
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '14px 16px',
//     color: '#f3f4f6',
//     fontSize: '14px',
//     lineHeight: '1.6',
//     outline: 'none',
//     boxSizing: 'border-box',
//     fontFamily: 'inherit',
//   },
//   wordCount: {
//     color: '#4b5563',
//     fontSize: '12px',
//     marginTop: '6px',
//     textAlign: 'right',
//   },
//   wordCountWarning: {
//     color: '#f59e0b',
//   },
//   uploadArea: {
//     border: '2px dashed #2a2d3a',
//     borderRadius: '12px',
//     padding: '32px',
//     textAlign: 'center',
//     cursor: 'pointer',
//     transition: 'border-color 0.2s',
//   },
//   uploadPlaceholder: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     gap: '8px',
//   },
//   uploadIcon: {
//     fontSize: '32px',
//   },
//   uploadText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     fontWeight: '500',
//   },
//   uploadSubtext: {
//     color: '#4b5563',
//     fontSize: '12px',
//   },
//   uploadedFile: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     gap: '6px',
//   },
//   uploadedFileName: {
//     color: '#a5b4fc',
//     fontSize: '14px',
//     fontWeight: '600',
//   },
//   uploadedFileSize: {
//     color: '#6b7280',
//     fontSize: '12px',
//   },
//   uploadedFileChange: {
//     color: '#4b5563',
//     fontSize: '12px',
//     marginTop: '4px',
//   },
//   actions: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//     marginTop: '14px',
//   },
//   primaryButton: {
//     background: '#6366f1',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '12px 20px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//     cursor: 'not-allowed',
//   },
//   emptyCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '22px',
//     textAlign: 'center',
//   },
//   emptyTitle: {
//     color: '#f3f4f6',
//     fontSize: '18px',
//     fontWeight: '700',
//     marginBottom: '8px',
//   },
//   emptyText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   errorCard: {
//     background: 'rgba(239, 68, 68, 0.08)',
//     border: '1px solid rgba(239, 68, 68, 0.25)',
//     color: '#fecaca',
//     borderRadius: '12px',
//     padding: '14px 16px',
//     fontSize: '14px',
//     lineHeight: '1.6',
//   },
//   statsRow: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
//     gap: '12px',
//   },
//   statCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '14px',
//     textAlign: 'center',
//   },
//   statValue: {
//     color: '#a5b4fc',
//     fontSize: '20px',
//     fontWeight: '700',
//     marginBottom: '4px',
//   },
//   statLabel: {
//     color: '#6b7280',
//     fontSize: '11px',
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//   },
//   metadataCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   metadataGrid: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//     marginTop: '4px',
//   },
//   metaItem: {
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '10px',
//     padding: '12px 14px',
//   },
//   metaLabel: {
//     color: '#6366f1',
//     fontSize: '11px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.6px',
//     marginBottom: '6px',
//   },
//   metaValue: {
//     color: '#d1d5db',
//     fontSize: '13px',
//     lineHeight: '1.6',
//   },
//   qaSection: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   qaHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     flexWrap: 'wrap',
//   },
//   qaControls: {
//     display: 'flex',
//     gap: '8px',
//   },
//   controlBtn: {
//     background: 'rgba(255,255,255,0.05)',
//     border: '1px solid #2a2d3a',
//     borderRadius: '8px',
//     padding: '6px 14px',
//     color: '#9ca3af',
//     fontSize: '12px',
//     fontWeight: '500',
//     cursor: 'pointer',
//   },
//   qaList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//   },
//   qaCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     overflow: 'hidden',
//   },
//   qaCardHeader: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     padding: '14px 16px',
//     cursor: 'pointer',
//   },
//   qaCardLeft: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     gap: '12px',
//     flex: 1,
//     minWidth: 0,
//   },
//   qaIndex: {
//     background: 'rgba(99, 102, 241, 0.15)',
//     color: '#818cf8',
//     borderRadius: '50%',
//     width: '28px',
//     height: '28px',
//     minWidth: '28px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '12px',
//     fontWeight: '700',
//   },
//   qaCardInfo: {
//     flex: 1,
//     minWidth: 0,
//   },
//   qaChunkTag: {
//     color: '#6366f1',
//     fontSize: '11px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     marginBottom: '4px',
//   },
//   qaQuestion: {
//     color: '#f3f4f6',
//     fontSize: '14px',
//     fontWeight: '500',
//     lineHeight: '1.5',
//   },
//   qaToggle: {
//     color: '#6b7280',
//     fontSize: '11px',
//     minWidth: '16px',
//     textAlign: 'right',
//   },
//   qaCardBody: {
//     borderTop: '1px solid #2a2d3a',
//   },
//   answerBlock: {
//     padding: '16px',
//     background: 'rgba(99, 102, 241, 0.04)',
//     borderBottom: '1px solid #2a2d3a',
//   },
//   answerBlockScientific: {
//     padding: '16px',
//     background: 'rgba(6, 182, 212, 0.04)',
//   },
//   answerLabel: {
//     color: '#9ca3af',
//     fontSize: '11px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     marginBottom: '8px',
//   },
//   answerText: {
//     color: '#d1d5db',
//     fontSize: '13px',
//     lineHeight: '1.7',
//   },
//   visualPanel: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '16px',
//     padding: '16px',
//     minHeight: '560px',
//     position: 'sticky',
//     top: '92px',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   visualHeader: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     gap: '12px',
//     flexWrap: 'wrap',
//   },
//   visualTitle: {
//     color: '#f3f4f6',
//     fontSize: '16px',
//     fontWeight: '700',
//   },
//   visualSubtitle: {
//     color: '#9ca3af',
//     fontSize: '12px',
//     marginTop: '4px',
//   },
//   visualButton: {
//     background: '#06b6d4',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '10px 14px',
//     fontSize: '13px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   visualEmpty: {
//     flex: 1,
//     border: '1px dashed #2a2d3a',
//     borderRadius: '12px',
//     color: '#9ca3af',
//     fontSize: '14px',
//     lineHeight: '1.7',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     textAlign: 'center',
//     padding: '18px',
//   },
//   iframe: {
//     width: '100%',
//     flex: 1,
//     minHeight: '460px',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     background: '#0f1117',
//   },
// }