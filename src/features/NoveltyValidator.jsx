import { useEffect, useState } from 'react'
import FeatureLayout from '../components/FeatureLayout'
import FeatureInfoCard from '../components/FeatureInfoCard'
import { featureMeta } from '../data/featureMeta'

const API_BASE = import.meta.env.VITE_API_BASE_URL

function getOutcomeMeta(outcome) {
  switch (outcome) {
    case 'novel':
      return {
        label: 'Novel',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.10)',
        border: 'rgba(16, 185, 129, 0.25)',
      }
    case 'similar_but_beatable':
      return {
        label: 'Similar but Beatable',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.10)',
        border: 'rgba(245, 158, 11, 0.25)',
      }
    case 'largely_answered':
      return {
        label: 'Largely Answered',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.10)',
        border: 'rgba(239, 68, 68, 0.25)',
      }
    default:
      return {
        label: 'Inconclusive',
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.10)',
        border: 'rgba(6, 182, 212, 0.25)',
      }
  }
}

export default function NoveltyValidator({
  onBack,
  sessionId,
  initialResearchQuestion = '',
  onOpenLiteratureExplorer,
  onOpenDeepDive,
}) {
  const feature = featureMeta.f10

  const [researchQuestion, setResearchQuestion] = useState(initialResearchQuestion)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialResearchQuestion) {
      setResearchQuestion(initialResearchQuestion)
    }
  }, [initialResearchQuestion])

  useEffect(() => {
    if (initialResearchQuestion?.trim()) {
      handleValidate(initialResearchQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleValidate = async (rqOverride) => {
    const rq = (rqOverride ?? researchQuestion).trim()
    if (!rq || loading) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/feature10/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          research_question: rq,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to validate research question')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Could not validate the research idea right now. Please check your backend connection and try again.')
    }

    setLoading(false)
  }

  const outcomeMeta = getOutcomeMeta(result?.outcome)

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
          <div style={styles.metaPillMuted}>Novelty analysis</div>
        </div>

        <div style={styles.inputCard}>
          <div style={styles.sectionTitle}>Research Question</div>
          <textarea
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="Paste your research question here..."
            style={styles.textarea}
            disabled={loading}
          />
          <div style={styles.actions}>
            <button
              onClick={() => handleValidate()}
              disabled={loading || !researchQuestion.trim()}
              style={loading || !researchQuestion.trim()
                ? { ...styles.primaryButton, ...styles.buttonDisabled }
                : styles.primaryButton}
            >
              {loading ? 'Validating...' : 'Validate Research Idea'}
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>
            {error}
          </div>
        )}

        {!result && !loading && !error && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Run novelty validation</div>
            <div style={styles.emptyText}>
              Once you validate your research question, you will see the outcome,
              guidance, and related papers here.
            </div>
          </div>
        )}

        {result && (
          <>
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div>
                  <div style={styles.sectionTitle}>Validation Result</div>
                  <div style={styles.rqText}>{result.research_question}</div>
                </div>

                <div
                  style={{
                    ...styles.outcomeBadge,
                    color: outcomeMeta.color,
                    background: outcomeMeta.bg,
                    border: `1px solid ${outcomeMeta.border}`,
                  }}
                >
                  {outcomeMeta.label}
                </div>
              </div>

              {result.keywords_searched && (
                <div style={styles.keywordsBlock}>
                  <div style={styles.smallLabel}>Keywords searched</div>
                  <div style={styles.keywordsText}>{result.keywords_searched}</div>
                </div>
              )}

              <div style={styles.messageBlock}>
                <div style={styles.smallLabel}>Coach insight</div>
                <div style={styles.messageText}>{result.message}</div>
              </div>

              {(result.send_to_feature3 || (result.papers && result.papers.length > 0)) && (
                <div style={styles.handoffStack}>
                  <div style={styles.handoffText}>
                    Continue with the next tool based on what you want to do next.
                  </div>

                  <div style={styles.handoffButtons}>
                    {result.send_to_feature3 && (
                      <button
                        style={styles.handoffButtonSecondary}
                        onClick={() => onOpenLiteratureExplorer?.(result.research_question)}
                      >
                        Open Literature Explorer →
                      </button>
                    )}

                    <button
                      style={styles.handoffButton}
                      onClick={() => onOpenDeepDive?.(result.research_question)}
                    >
                      Open Deep Dive →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.papersCard}>
              <div style={styles.sectionTitle}>Related Papers</div>

              {!result.papers || result.papers.length === 0 ? (
                <div style={styles.noPapers}>No directly related papers were returned.</div>
              ) : (
                <div style={styles.paperList}>
                  {result.papers.map((paper, index) => (
                    <div key={`${paper.title}-${index}`} style={styles.paperItem}>
                      <div style={styles.paperTitle}>{paper.title}</div>
                      <div style={styles.paperMeta}>
                        {paper.year || 'Unknown year'}
                        {paper.authors?.length ? ` • ${paper.authors.join(', ')}` : ''}
                      </div>
                      {paper.abstract && (
                        <div style={styles.paperAbstract}>{paper.abstract}</div>
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
  resultHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  rqText: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  outcomeBadge: {
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  keywordsBlock: {
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
  keywordsText: {
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  messageBlock: {
    marginBottom: '12px',
  },
  messageText: {
    color: '#e5e7eb',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  handoffStack: {
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.20)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '4px',
  },
  handoffText: {
    color: '#c7d2fe',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  handoffButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
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
  handoffButtonSecondary: {
    background: 'transparent',
    color: '#c7d2fe',
    border: '1px solid rgba(99, 102, 241, 0.28)',
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
  paperAbstract: {
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: '1.7',
    marginBottom: '10px',
  },
  paperLink: {
    color: '#818cf8',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
  },
}













// import { useEffect, useState } from 'react'
// import FeatureLayout from '../components/FeatureLayout'
// import FeatureInfoCard from '../components/FeatureInfoCard'
// import { featureMeta } from '../data/featureMeta'

// const API_BASE = import.meta.env.VITE_API_BASE_URL

// function getOutcomeMeta(outcome) {
//   switch (outcome) {
//     case 'novel':
//       return {
//         label: 'Novel',
//         color: '#10b981',
//         bg: 'rgba(16, 185, 129, 0.10)',
//         border: 'rgba(16, 185, 129, 0.25)',
//       }
//     case 'similar_but_beatable':
//       return {
//         label: 'Similar but Beatable',
//         color: '#f59e0b',
//         bg: 'rgba(245, 158, 11, 0.10)',
//         border: 'rgba(245, 158, 11, 0.25)',
//       }
//     case 'largely_answered':
//       return {
//         label: 'Largely Answered',
//         color: '#ef4444',
//         bg: 'rgba(239, 68, 68, 0.10)',
//         border: 'rgba(239, 68, 68, 0.25)',
//       }
//     default:
//       return {
//         label: 'Inconclusive',
//         color: '#06b6d4',
//         bg: 'rgba(6, 182, 212, 0.10)',
//         border: 'rgba(6, 182, 212, 0.25)',
//       }
//   }
// }

// export default function NoveltyValidator({
//   onBack,
//   sessionId,
//   initialResearchQuestion = '',
//   onOpenLiteratureExplorer,
// }) {
//   const feature = featureMeta.f10

//   const [researchQuestion, setResearchQuestion] = useState(initialResearchQuestion)
//   const [loading, setLoading] = useState(false)
//   const [result, setResult] = useState(null)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (initialResearchQuestion) {
//       setResearchQuestion(initialResearchQuestion)
//     }
//   }, [initialResearchQuestion])

//   useEffect(() => {
//     if (initialResearchQuestion?.trim()) {
//       handleValidate(initialResearchQuestion)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   const handleValidate = async (rqOverride) => {
//     const rq = (rqOverride ?? researchQuestion).trim()
//     if (!rq || loading) return

//     setLoading(true)
//     setError('')
//     setResult(null)

//     try {
//       const response = await fetch(`${API_BASE}/feature10/validate`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           session_id: sessionId,
//           research_question: rq,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error('Failed to validate research question')
//       }

//       const data = await response.json()
//       setResult(data)
//     } catch (err) {
//       setError('Could not validate the research idea right now. Please check your backend connection and try again.')
//     }

//     setLoading(false)
//   }

//   const outcomeMeta = getOutcomeMeta(result?.outcome)

//   return (
//     <FeatureLayout
//       title={feature.title}
//       onBack={onBack}
//       infoCard={<FeatureInfoCard feature={feature} />}
//       showRightPanel={false}
//     >
//       <div style={styles.wrapper}>
//         <div style={styles.metaRow}>
//           <div style={styles.metaPill}>Session: {sessionId}</div>
//           <div style={styles.metaPillMuted}>Novelty analysis</div>
//         </div>

//         <div style={styles.inputCard}>
//           <div style={styles.sectionTitle}>Research Question</div>
//           <textarea
//             value={researchQuestion}
//             onChange={(e) => setResearchQuestion(e.target.value)}
//             placeholder="Paste your research question here..."
//             style={styles.textarea}
//             disabled={loading}
//           />
//           <div style={styles.actions}>
//             <button
//               onClick={() => handleValidate()}
//               disabled={loading || !researchQuestion.trim()}
//               style={loading || !researchQuestion.trim()
//                 ? { ...styles.primaryButton, ...styles.buttonDisabled }
//                 : styles.primaryButton}
//             >
//               {loading ? 'Validating...' : 'Validate Research Idea'}
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div style={styles.errorCard}>
//             {error}
//           </div>
//         )}

//         {!result && !loading && !error && (
//           <div style={styles.emptyCard}>
//             <div style={styles.emptyTitle}>Run novelty validation</div>
//             <div style={styles.emptyText}>
//               Once you validate your research question, you will see the outcome,
//               guidance, and related papers here.
//             </div>
//           </div>
//         )}

//         {result && (
//           <>
//             <div style={styles.resultCard}>
//               <div style={styles.resultHeader}>
//                 <div>
//                   <div style={styles.sectionTitle}>Validation Result</div>
//                   <div style={styles.rqText}>{result.research_question}</div>
//                 </div>

//                 <div
//                   style={{
//                     ...styles.outcomeBadge,
//                     color: outcomeMeta.color,
//                     background: outcomeMeta.bg,
//                     border: `1px solid ${outcomeMeta.border}`,
//                   }}
//                 >
//                   {outcomeMeta.label}
//                 </div>
//               </div>

//               {result.keywords_searched && (
//                 <div style={styles.keywordsBlock}>
//                   <div style={styles.smallLabel}>Keywords searched</div>
//                   <div style={styles.keywordsText}>{result.keywords_searched}</div>
//                 </div>
//               )}

//               <div style={styles.messageBlock}>
//                 <div style={styles.smallLabel}>Coach insight</div>
//                 <div style={styles.messageText}>{result.message}</div>
//               </div>

//               {result.send_to_feature3 && (
//                 <div style={styles.handoffCard}>
//                   <div style={styles.handoffText}>
//                     Related work was found. Explore the full literature landscape before diving deeper.
//                   </div>
//                   <button
//                     style={styles.handoffButton}
//                     onClick={() => onOpenLiteratureExplorer?.(result.research_question)}
//                   >
//                     Open Literature Explorer →
//                   </button>
//                 </div>
//               )}
//             </div>

//             <div style={styles.papersCard}>
//               <div style={styles.sectionTitle}>Related Papers</div>

//               {!result.papers || result.papers.length === 0 ? (
//                 <div style={styles.noPapers}>No directly related papers were returned.</div>
//               ) : (
//                 <div style={styles.paperList}>
//                   {result.papers.map((paper, index) => (
//                     <div key={`${paper.title}-${index}`} style={styles.paperItem}>
//                       <div style={styles.paperTitle}>{paper.title}</div>
//                       <div style={styles.paperMeta}>
//                         {paper.year || 'Unknown year'}
//                         {paper.authors?.length ? ` • ${paper.authors.join(', ')}` : ''}
//                       </div>
//                       {paper.abstract && (
//                         <div style={styles.paperAbstract}>{paper.abstract}</div>
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
//   resultHeader: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     gap: '14px',
//     flexWrap: 'wrap',
//     marginBottom: '14px',
//   },
//   rqText: {
//     color: '#d1d5db',
//     fontSize: '14px',
//     lineHeight: '1.7',
//   },
//   outcomeBadge: {
//     borderRadius: '999px',
//     padding: '8px 12px',
//     fontSize: '12px',
//     fontWeight: '700',
//     whiteSpace: 'nowrap',
//   },
//   keywordsBlock: {
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
//   keywordsText: {
//     color: '#cbd5e1',
//     fontSize: '14px',
//     lineHeight: '1.6',
//   },
//   messageBlock: {
//     marginBottom: '12px',
//   },
//   messageText: {
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
//     marginTop: '4px',
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
//   paperAbstract: {
//     color: '#cbd5e1',
//     fontSize: '14px',
//     lineHeight: '1.7',
//     marginBottom: '10px',
//   },
//   paperLink: {
//     color: '#818cf8',
//     fontSize: '13px',
//     fontWeight: '600',
//     textDecoration: 'none',
//   },
// }