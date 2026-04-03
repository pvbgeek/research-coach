import { useEffect, useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function LiteratureExplorer({
  onBack,
  sessionId,
  initialResearchQuestion = '',
  onOpenDeepDive,
}) {
  const feature = featureMeta.f2

  const [researchQuestion, setResearchQuestion] = useState(initialResearchQuestion)
  const [searchResult, setSearchResult] = useState(null)
  const [visualFileUrl, setVisualFileUrl] = useState('')
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingVisual, setLoadingVisual] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialResearchQuestion) {
      setResearchQuestion(initialResearchQuestion)
    }
  }, [initialResearchQuestion])

  const handleSearch = async (rqOverride) => {
    const rq = (rqOverride ?? researchQuestion).trim()
    if (!rq || loadingSearch) return

    setLoadingSearch(true)
    setError('')
    setSearchResult(null)
    setVisualFileUrl('')

    try {
      const response = await fetch(`${API_BASE}/feature2/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          research_question: rq,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to search papers')
      }

      const data = await response.json()
      setSearchResult(data)
    } catch (err) {
      setError('Could not search papers right now. Please check your backend connection and try again.')
    }

    setLoadingSearch(false)
  }

  const handleGenerateVisual = async () => {
    if (!searchResult?.cache_key || loadingVisual) return

    setLoadingVisual(true)
    setError('')
    setVisualFileUrl('')

    try {
      const response = await fetch(`${API_BASE}/feature2/visual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cache_key: searchResult.cache_key,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate visual timeline')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setVisualFileUrl(data.file_url || '')
    } catch (err) {
      setError(err.message || 'Could not generate the visual timeline.')
    }

    setLoadingVisual(false)
  }

  const rightPanel = (
    <div style={styles.visualPanel}>
      <div style={styles.visualHeader}>
        <div>
          <div style={styles.visualTitle}>Timeline Visual</div>
          <div style={styles.visualSubtitle}>
            Field evolution view
          </div>
        </div>

        {searchResult?.has_visual && (
          <button
            onClick={handleGenerateVisual}
            disabled={loadingVisual}
            style={loadingVisual
              ? { ...styles.visualButton, ...styles.buttonDisabled }
              : styles.visualButton}
          >
            {loadingVisual ? 'Generating...' : 'Generate Visual Timeline'}
          </button>
        )}
      </div>

      {!visualFileUrl ? (
        <div style={styles.visualEmpty}>
          {searchResult?.has_visual
            ? 'Generate the timeline to view the visual progression of papers.'
            : 'The visual timeline will appear here once results are available.'}
        </div>
      ) : (
        <div style={styles.visualScrollFrame}>
          <iframe
            title="Feature 2 Timeline Visual"
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
          <div style={styles.metaPillMuted}>Paper search</div>
        </div>

        <div style={styles.inputCard}>
          <div style={styles.sectionTitle}>Research Question</div>
          <textarea
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="Enter your research question here..."
            style={styles.textarea}
            disabled={loadingSearch}
          />
          <div style={styles.actions}>
            <button
              onClick={() => handleSearch()}
              disabled={loadingSearch || !researchQuestion.trim()}
              style={loadingSearch || !researchQuestion.trim()
                ? { ...styles.primaryButton, ...styles.buttonDisabled }
                : styles.primaryButton}
            >
              {loadingSearch ? 'Searching...' : 'Search Literature'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>{error}</div>
        )}

        {!searchResult && !loadingSearch && !error && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Run a literature search</div>
            <div style={styles.emptyText}>
              Search for relevant papers, understand the research gap, and then generate a visual timeline.
            </div>
          </div>
        )}

        {searchResult && (
          <>
            <div style={styles.resultCard}>
              <div style={styles.sectionTitle}>Search Summary</div>

              <div style={styles.block}>
                <div style={styles.smallLabel}>Research Question</div>
                <div style={styles.blockText}>{searchResult.research_question}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.smallLabel}>Keywords</div>
                <div style={styles.blockText}>{searchResult.keywords || '—'}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.smallLabel}>Research Gap</div>
                <div style={styles.blockText}>{searchResult.research_gap}</div>
              </div>

              <div style={styles.handoffCard}>
                <div style={styles.handoffText}>
                  Ready to understand one of these papers or concepts in depth?
                </div>
                <button
                  style={styles.handoffButton}
                  onClick={() => onOpenDeepDive?.(searchResult.research_question || researchQuestion)}
                >
                  Open Deep Dive →
                </button>
              </div>
            </div>

            <div style={styles.papersCard}>
              <div style={styles.sectionTitle}>Relevant Papers</div>

              {!searchResult.papers || searchResult.papers.length === 0 ? (
                <div style={styles.noPapers}>No papers found.</div>
              ) : (
                <div style={styles.paperList}>
                  {searchResult.papers.map((paper, index) => (
                    <div key={`${paper.title}-${index}`} style={styles.paperItem}>
                      <div style={styles.paperTopRow}>
                        <div style={styles.paperYear}>{paper.year || 'Unknown year'}</div>
                        {typeof paper.citations !== 'undefined' && (
                          <div style={styles.paperCitations}>
                            Citations: {paper.citations}
                          </div>
                        )}
                      </div>

                      <div style={styles.paperTitle}>{paper.title}</div>

                      {paper.authors && (
                        <div style={styles.paperMeta}>{paper.authors}</div>
                      )}

                      {paper.research_question && (
                        <div style={styles.paperBlock}>
                          <div style={styles.paperLabel}>Research Question</div>
                          <div style={styles.paperText}>{paper.research_question}</div>
                        </div>
                      )}

                      {paper.contribution && (
                        <div style={styles.paperBlock}>
                          <div style={styles.paperLabel}>Contribution</div>
                          <div style={styles.paperText}>{paper.contribution}</div>
                        </div>
                      )}

                      {paper.builds_on && (
                        <div style={styles.paperBlock}>
                          <div style={styles.paperLabel}>Builds On</div>
                          <div style={styles.paperText}>{paper.builds_on}</div>
                        </div>
                      )}

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.paperLink}
                        >
                          Open Paper
                        </a>
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
    marginBottom: '12px',
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
  resultCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  block: {
    marginBottom: '14px',
  },
  smallLabel: {
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  blockText: {
    color: '#e5e7eb',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  handoffCard: {
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.20)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap',
    marginTop: '6px',
  },
  handoffText: {
    color: '#c7d2fe',
    fontSize: '13px',
    lineHeight: '1.6',
    flex: 1,
  },
  handoffButton: {
    background: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  papersCard: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '14px',
    padding: '18px',
  },
  noPapers: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  paperList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  paperItem: {
    background: '#11141b',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '14px',
  },
  paperTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  paperYear: {
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: '700',
  },
  paperCitations: {
    color: '#9ca3af',
    fontSize: '12px',
  },
  paperTitle: {
    color: '#f3f4f6',
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '6px',
    lineHeight: '1.5',
  },
  paperMeta: {
    color: '#9ca3af',
    fontSize: '13px',
    marginBottom: '10px',
    lineHeight: '1.5',
  },
  paperBlock: {
    marginBottom: '10px',
  },
  paperLabel: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '4px',
  },
  paperText: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  paperLink: {
    color: '#818cf8',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
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















// import { useEffect, useState } from 'react'
// import FeatureLayout from '../components/FeatureLayout'
// import FeatureInfoCard from '../components/FeatureInfoCard'
// import { featureMeta } from '../data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// export default function LiteratureExplorer({
//   onBack,
//   sessionId,
//   initialResearchQuestion = '',
//   onOpenDeepDive,
// }) {
//   const feature = featureMeta.f2

//   const [researchQuestion, setResearchQuestion] = useState(initialResearchQuestion)
//   const [searchResult, setSearchResult] = useState(null)
//   const [visualFileUrl, setVisualFileUrl] = useState('')
//   const [loadingSearch, setLoadingSearch] = useState(false)
//   const [loadingVisual, setLoadingVisual] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (initialResearchQuestion) {
//       setResearchQuestion(initialResearchQuestion)
//     }
//   }, [initialResearchQuestion])

//   const handleSearch = async (rqOverride) => {
//     const rq = (rqOverride ?? researchQuestion).trim()
//     if (!rq || loadingSearch) return

//     setLoadingSearch(true)
//     setError('')
//     setSearchResult(null)
//     setVisualFileUrl('')

//     try {
//       const response = await fetch(`${API_BASE}/feature2/search`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           session_id: sessionId,
//           research_question: rq,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to search papers')
//       }

//       const data = await response.json()
//       setSearchResult(data)
//     } catch (err) {
//       setError('Could not search papers right now. Please check your backend connection and try again.')
//     }

//     setLoadingSearch(false)
//   }

//   const handleGenerateVisual = async () => {
//     if (!searchResult?.cache_key || loadingVisual) return

//     setLoadingVisual(true)
//     setError('')
//     setVisualFileUrl('')

//     try {
//       const response = await fetch(`${API_BASE}/feature2/visual`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           cache_key: searchResult.cache_key,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to generate visual timeline')
//       }

//       const data = await response.json()

//       if (data.error) {
//         throw new Error(data.error)
//       }

//       setVisualFileUrl(data.file_url || '')
//     } catch (err) {
//       setError(err.message || 'Could not generate the visual timeline.')
//     }

//     setLoadingVisual(false)
//   }

//   const rightPanel = (
//     <div style={styles.visualPanel}>
//       <div style={styles.visualHeader}>
//         <div>
//           <div style={styles.visualTitle}>Timeline Visual</div>
//           <div style={styles.visualSubtitle}>
//             Field evolution view
//           </div>
//         </div>

//         {searchResult?.has_visual && (
//           <button
//             onClick={handleGenerateVisual}
//             disabled={loadingVisual}
//             style={loadingVisual
//               ? { ...styles.visualButton, ...styles.buttonDisabled }
//               : styles.visualButton}
//           >
//             {loadingVisual ? 'Generating...' : 'Generate Visual Timeline'}
//           </button>
//         )}
//       </div>

//       {!visualFileUrl ? (
//         <div style={styles.visualEmpty}>
//           {searchResult?.has_visual
//             ? 'Generate the timeline to view the visual progression of papers.'
//             : 'The visual timeline will appear here once results are available.'}
//         </div>
//       ) : (
//         <iframe
//           title="Feature 2 Timeline Visual"
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
//           <div style={styles.metaPillMuted}>Paper search</div>
//         </div>

//         <div style={styles.inputCard}>
//           <div style={styles.sectionTitle}>Research Question</div>
//           <textarea
//             value={researchQuestion}
//             onChange={(e) => setResearchQuestion(e.target.value)}
//             placeholder="Enter your research question here..."
//             style={styles.textarea}
//             disabled={loadingSearch}
//           />
//           <div style={styles.actions}>
//             <button
//               onClick={() => handleSearch()}
//               disabled={loadingSearch || !researchQuestion.trim()}
//               style={loadingSearch || !researchQuestion.trim()
//                 ? { ...styles.primaryButton, ...styles.buttonDisabled }
//                 : styles.primaryButton}
//             >
//               {loadingSearch ? 'Searching...' : 'Search Literature'}
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div style={styles.errorCard}>{error}</div>
//         )}

//         {!searchResult && !loadingSearch && !error && (
//           <div style={styles.emptyCard}>
//             <div style={styles.emptyTitle}>Run a literature search</div>
//             <div style={styles.emptyText}>
//               Search for relevant papers, understand the research gap, and then generate a visual timeline.
//             </div>
//           </div>
//         )}

//         {searchResult && (
//           <>
//             <div style={styles.resultCard}>
//               <div style={styles.sectionTitle}>Search Summary</div>

//               <div style={styles.block}>
//                 <div style={styles.smallLabel}>Research Question</div>
//                 <div style={styles.blockText}>{searchResult.research_question}</div>
//               </div>

//               <div style={styles.block}>
//                 <div style={styles.smallLabel}>Keywords</div>
//                 <div style={styles.blockText}>{searchResult.keywords || '—'}</div>
//               </div>

//               <div style={styles.block}>
//                 <div style={styles.smallLabel}>Research Gap</div>
//                 <div style={styles.blockText}>{searchResult.research_gap}</div>
//               </div>

//               <div style={styles.handoffCard}>
//                 <div style={styles.handoffText}>
//                   Ready to understand one of these papers or concepts in depth?
//                 </div>
//                 <button
//                   style={styles.handoffButton}
//                   onClick={() => onOpenDeepDive?.(searchResult.research_question || researchQuestion)}
//                 >
//                   Open Deep Dive →
//                 </button>
//               </div>
//             </div>

//             <div style={styles.papersCard}>
//               <div style={styles.sectionTitle}>Relevant Papers</div>

//               {!searchResult.papers || searchResult.papers.length === 0 ? (
//                 <div style={styles.noPapers}>No papers found.</div>
//               ) : (
//                 <div style={styles.paperList}>
//                   {searchResult.papers.map((paper, index) => (
//                     <div key={`${paper.title}-${index}`} style={styles.paperItem}>
//                       <div style={styles.paperTopRow}>
//                         <div style={styles.paperYear}>{paper.year || 'Unknown year'}</div>
//                         {typeof paper.citations !== 'undefined' && (
//                           <div style={styles.paperCitations}>
//                             Citations: {paper.citations}
//                           </div>
//                         )}
//                       </div>

//                       <div style={styles.paperTitle}>{paper.title}</div>

//                       {paper.authors && (
//                         <div style={styles.paperMeta}>{paper.authors}</div>
//                       )}

//                       {paper.research_question && (
//                         <div style={styles.paperBlock}>
//                           <div style={styles.paperLabel}>Research Question</div>
//                           <div style={styles.paperText}>{paper.research_question}</div>
//                         </div>
//                       )}

//                       {paper.contribution && (
//                         <div style={styles.paperBlock}>
//                           <div style={styles.paperLabel}>Contribution</div>
//                           <div style={styles.paperText}>{paper.contribution}</div>
//                         </div>
//                       )}

//                       {paper.builds_on && (
//                         <div style={styles.paperBlock}>
//                           <div style={styles.paperLabel}>Builds On</div>
//                           <div style={styles.paperText}>{paper.builds_on}</div>
//                         </div>
//                       )}

//                       {paper.url && (
//                         <a
//                           href={paper.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           style={styles.paperLink}
//                         >
//                           Open Paper
//                         </a>
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
//   inputCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   sectionTitle: {
//     color: '#f3f4f6',
//     fontSize: '18px',
//     fontWeight: '700',
//     marginBottom: '12px',
//   },
//   textarea: {
//     width: '100%',
//     minHeight: '120px',
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
//   actions: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//     marginTop: '12px',
//   },
//   primaryButton: {
//     background: '#6366f1',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '12px 18px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   buttonDisabled: {
//     opacity: 0.7,
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
//   resultCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   block: {
//     marginBottom: '14px',
//   },
//   smallLabel: {
//     color: '#9ca3af',
//     fontSize: '12px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     marginBottom: '6px',
//   },
//   blockText: {
//     color: '#e5e7eb',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   handoffCard: {
//     background: 'rgba(99, 102, 241, 0.08)',
//     border: '1px solid rgba(99, 102, 241, 0.20)',
//     borderRadius: '12px',
//     padding: '14px 16px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '14px',
//     flexWrap: 'wrap',
//     marginTop: '6px',
//   },
//   handoffText: {
//     color: '#c7d2fe',
//     fontSize: '13px',
//     lineHeight: '1.6',
//     flex: 1,
//   },
//   handoffButton: {
//     background: '#6366f1',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '10px 16px',
//     fontSize: '13px',
//     fontWeight: '600',
//     cursor: 'pointer',
//     whiteSpace: 'nowrap',
//   },
//   papersCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   noPapers: {
//     color: '#9ca3af',
//     fontSize: '14px',
//   },
//   paperList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '14px',
//   },
//   paperItem: {
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '14px',
//   },
//   paperTopRow: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     marginBottom: '8px',
//     flexWrap: 'wrap',
//   },
//   paperYear: {
//     color: '#a5b4fc',
//     fontSize: '12px',
//     fontWeight: '700',
//   },
//   paperCitations: {
//     color: '#9ca3af',
//     fontSize: '12px',
//   },
//   paperTitle: {
//     color: '#f3f4f6',
//     fontSize: '15px',
//     fontWeight: '700',
//     marginBottom: '6px',
//     lineHeight: '1.5',
//   },
//   paperMeta: {
//     color: '#9ca3af',
//     fontSize: '13px',
//     marginBottom: '10px',
//     lineHeight: '1.5',
//   },
//   paperBlock: {
//     marginBottom: '10px',
//   },
//   paperLabel: {
//     color: '#94a3b8',
//     fontSize: '12px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.4px',
//     marginBottom: '4px',
//   },
//   paperText: {
//     color: '#d1d5db',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   paperLink: {
//     color: '#818cf8',
//     fontSize: '13px',
//     fontWeight: '600',
//     textDecoration: 'none',
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













// import { useEffect, useState } from 'react'
// import FeatureLayout from '../components/FeatureLayout'
// import FeatureInfoCard from '../components/FeatureInfoCard'
// import { featureMeta } from '../data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// export default function LiteratureExplorer({
//   onBack,
//   sessionId,
//   initialResearchQuestion = '',
// }) {
//   const feature = featureMeta.f2

//   const [researchQuestion, setResearchQuestion] = useState(initialResearchQuestion)
//   const [searchResult, setSearchResult] = useState(null)
//   const [visualFileUrl, setVisualFileUrl] = useState('')
//   const [loadingSearch, setLoadingSearch] = useState(false)
//   const [loadingVisual, setLoadingVisual] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (initialResearchQuestion) {
//       setResearchQuestion(initialResearchQuestion)
//     }
//   }, [initialResearchQuestion])

//   const handleSearch = async (rqOverride) => {
//     const rq = (rqOverride ?? researchQuestion).trim()
//     if (!rq || loadingSearch) return

//     setLoadingSearch(true)
//     setError('')
//     setSearchResult(null)
//     setVisualFileUrl('')

//     try {
//       const response = await fetch(`${API_BASE}/feature2/search`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           session_id: sessionId,
//           research_question: rq,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to search papers')
//       }

//       const data = await response.json()
//       setSearchResult(data)
//     } catch (err) {
//       setError('Could not search papers right now. Please check your backend connection and try again.')
//     }

//     setLoadingSearch(false)
//   }

//   const handleGenerateVisual = async () => {
//     if (!searchResult?.cache_key || loadingVisual) return

//     setLoadingVisual(true)
//     setError('')
//     setVisualFileUrl('')

//     try {
//       const response = await fetch(`${API_BASE}/feature2/visual`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           cache_key: searchResult.cache_key,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to generate visual timeline')
//       }

//       const data = await response.json()

//       if (data.error) {
//         throw new Error(data.error)
//       }

//       setVisualFileUrl(data.file_url || '')
//     } catch (err) {
//       setError(err.message || 'Could not generate the visual timeline.')
//     }

//     setLoadingVisual(false)
//   }

//   const rightPanel = (
//     <div style={styles.visualPanel}>
//       <div style={styles.visualHeader}>
//         <div>
//           <div style={styles.visualTitle}>Timeline Visual</div>
//           <div style={styles.visualSubtitle}>
//             Field evolution view
//           </div>
//         </div>

//         {searchResult?.has_visual && (
//           <button
//             onClick={handleGenerateVisual}
//             disabled={loadingVisual}
//             style={loadingVisual
//               ? { ...styles.visualButton, ...styles.buttonDisabled }
//               : styles.visualButton}
//           >
//             {loadingVisual ? 'Generating...' : 'Generate Visual Timeline'}
//           </button>
//         )}
//       </div>

//       {!visualFileUrl ? (
//         <div style={styles.visualEmpty}>
//           {searchResult?.has_visual
//             ? 'Generate the timeline to view the visual progression of papers.'
//             : 'The visual timeline will appear here once results are available.'}
//         </div>
//       ) : (
//         <iframe
//           title="Feature 2 Timeline Visual"
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
//           <div style={styles.metaPillMuted}>Paper search</div>
//         </div>

//         <div style={styles.inputCard}>
//           <div style={styles.sectionTitle}>Research Question</div>
//           <textarea
//             value={researchQuestion}
//             onChange={(e) => setResearchQuestion(e.target.value)}
//             placeholder="Enter your research question here..."
//             style={styles.textarea}
//             disabled={loadingSearch}
//           />
//           <div style={styles.actions}>
//             <button
//               onClick={() => handleSearch()}
//               disabled={loadingSearch || !researchQuestion.trim()}
//               style={loadingSearch || !researchQuestion.trim()
//                 ? { ...styles.primaryButton, ...styles.buttonDisabled }
//                 : styles.primaryButton}
//             >
//               {loadingSearch ? 'Searching...' : 'Search Literature'}
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div style={styles.errorCard}>{error}</div>
//         )}

//         {!searchResult && !loadingSearch && !error && (
//           <div style={styles.emptyCard}>
//             <div style={styles.emptyTitle}>Run a literature search</div>
//             <div style={styles.emptyText}>
//               Search for relevant papers, understand the research gap, and then generate a visual timeline.
//             </div>
//           </div>
//         )}

//         {searchResult && (
//           <>
//             <div style={styles.resultCard}>
//               <div style={styles.sectionTitle}>Search Summary</div>

//               <div style={styles.block}>
//                 <div style={styles.smallLabel}>Research Question</div>
//                 <div style={styles.blockText}>{searchResult.research_question}</div>
//               </div>

//               <div style={styles.block}>
//                 <div style={styles.smallLabel}>Keywords</div>
//                 <div style={styles.blockText}>{searchResult.keywords || '—'}</div>
//               </div>

//               <div style={styles.block}>
//                 <div style={styles.smallLabel}>Research Gap</div>
//                 <div style={styles.blockText}>{searchResult.research_gap}</div>
//               </div>
//             </div>

//             <div style={styles.papersCard}>
//               <div style={styles.sectionTitle}>Relevant Papers</div>

//               {!searchResult.papers || searchResult.papers.length === 0 ? (
//                 <div style={styles.noPapers}>No papers found.</div>
//               ) : (
//                 <div style={styles.paperList}>
//                   {searchResult.papers.map((paper, index) => (
//                     <div key={`${paper.title}-${index}`} style={styles.paperItem}>
//                       <div style={styles.paperTopRow}>
//                         <div style={styles.paperYear}>{paper.year || 'Unknown year'}</div>
//                         {typeof paper.citations !== 'undefined' && (
//                           <div style={styles.paperCitations}>
//                             Citations: {paper.citations}
//                           </div>
//                         )}
//                       </div>

//                       <div style={styles.paperTitle}>{paper.title}</div>

//                       {paper.authors && (
//                         <div style={styles.paperMeta}>{paper.authors}</div>
//                       )}

//                       {paper.research_question && (
//                         <div style={styles.paperBlock}>
//                           <div style={styles.paperLabel}>Research Question</div>
//                           <div style={styles.paperText}>{paper.research_question}</div>
//                         </div>
//                       )}

//                       {paper.contribution && (
//                         <div style={styles.paperBlock}>
//                           <div style={styles.paperLabel}>Contribution</div>
//                           <div style={styles.paperText}>{paper.contribution}</div>
//                         </div>
//                       )}

//                       {paper.builds_on && (
//                         <div style={styles.paperBlock}>
//                           <div style={styles.paperLabel}>Builds On</div>
//                           <div style={styles.paperText}>{paper.builds_on}</div>
//                         </div>
//                       )}

//                       {paper.url && (
//                         <a
//                           href={paper.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           style={styles.paperLink}
//                         >
//                           Open Paper
//                         </a>
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
//   inputCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   sectionTitle: {
//     color: '#f3f4f6',
//     fontSize: '18px',
//     fontWeight: '700',
//     marginBottom: '12px',
//   },
//   textarea: {
//     width: '100%',
//     minHeight: '120px',
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
//   actions: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//     marginTop: '12px',
//   },
//   primaryButton: {
//     background: '#6366f1',
//     color: '#ffffff',
//     border: 'none',
//     borderRadius: '10px',
//     padding: '12px 18px',
//     fontSize: '14px',
//     fontWeight: '600',
//     cursor: 'pointer',
//   },
//   buttonDisabled: {
//     opacity: 0.7,
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
//   resultCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   block: {
//     marginBottom: '14px',
//   },
//   smallLabel: {
//     color: '#9ca3af',
//     fontSize: '12px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//     marginBottom: '6px',
//   },
//   blockText: {
//     color: '#e5e7eb',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   papersCard: {
//     background: '#0f1117',
//     border: '1px solid #2a2d3a',
//     borderRadius: '14px',
//     padding: '18px',
//   },
//   noPapers: {
//     color: '#9ca3af',
//     fontSize: '14px',
//   },
//   paperList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '14px',
//   },
//   paperItem: {
//     background: '#11141b',
//     border: '1px solid #2a2d3a',
//     borderRadius: '12px',
//     padding: '14px',
//   },
//   paperTopRow: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '12px',
//     marginBottom: '8px',
//     flexWrap: 'wrap',
//   },
//   paperYear: {
//     color: '#a5b4fc',
//     fontSize: '12px',
//     fontWeight: '700',
//   },
//   paperCitations: {
//     color: '#9ca3af',
//     fontSize: '12px',
//   },
//   paperTitle: {
//     color: '#f3f4f6',
//     fontSize: '15px',
//     fontWeight: '700',
//     marginBottom: '6px',
//     lineHeight: '1.5',
//   },
//   paperMeta: {
//     color: '#9ca3af',
//     fontSize: '13px',
//     marginBottom: '10px',
//     lineHeight: '1.5',
//   },
//   paperBlock: {
//     marginBottom: '10px',
//   },
//   paperLabel: {
//     color: '#94a3b8',
//     fontSize: '12px',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: '0.4px',
//     marginBottom: '4px',
//   },
//   paperText: {
//     color: '#d1d5db',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   paperLink: {
//     color: '#818cf8',
//     fontSize: '13px',
//     fontWeight: '600',
//     textDecoration: 'none',
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