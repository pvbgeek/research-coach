export default function FeatureLayout({
  title,
  onBack,
  infoCard,
  children,
  rightPanel = null,
  showRightPanel = false,
}) {
  const contentStyle = showRightPanel
    ? styles.contentWithPanel
    : styles.contentSingle

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back to Main Menu
        </button>

        <div style={styles.titleWrap}>
          <h1 style={styles.title}>{title}</h1>
        </div>
      </div>

      <div style={contentStyle}>
        <div style={styles.leftColumn}>
          {infoCard}

          <div style={styles.workspace}>
            {children}
          </div>
        </div>

        {showRightPanel && (
          <div style={styles.rightColumn}>
            {rightPanel || (
              <div style={styles.placeholderPanel}>
                <div style={styles.placeholderTitle}>Visual Panel</div>
                <p style={styles.placeholderText}>
                  Visual outputs for this feature will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f1117',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '20px 32px',
    borderBottom: '1px solid #2a2d3a',
    background: '#1a1d25',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #2a2d3a',
    color: '#d1d5db',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    color: '#f3f4f6',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.4px',
  },
  contentWithPanel: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 720px',
    gap: '24px',
    padding: '24px 32px 32px',
    maxWidth: '1960px',
    margin: '0 auto',
    alignItems: 'stretch',
  },
  contentSingle: {
    display: 'block',
    padding: '24px 32px 32px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  leftColumn: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  workspace: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '16px',
    padding: '24px',
    minHeight: '420px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    flex: 1,
  },
  rightColumn: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  placeholderPanel: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '16px',
    padding: '20px',
    minHeight: '220px',
    height: '100%',
  },
  placeholderTitle: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },
}















// export default function FeatureLayout({
//   title,
//   onBack,
//   infoCard,
//   children,
//   rightPanel = null,
//   showRightPanel = false,
// }) {
//   const contentStyle = showRightPanel
//     ? styles.contentWithPanel
//     : styles.contentSingle

//   return (
//     <div style={styles.page}>
//       <div style={styles.topBar}>
//         <button style={styles.backButton} onClick={onBack}>
//           ← Back to Main Menu
//         </button>

//         <div style={styles.titleWrap}>
//           <h1 style={styles.title}>{title}</h1>
//         </div>
//       </div>

//       <div style={contentStyle}>
//         <div style={styles.leftColumn}>
//           {infoCard}

//           <div style={styles.workspace}>
//             {children}
//           </div>
//         </div>

//         {showRightPanel && (
//           <div style={styles.rightColumn}>
//             {rightPanel || (
//               <div style={styles.placeholderPanel}>
//                 <div style={styles.placeholderTitle}>Visual Panel</div>
//                 <p style={styles.placeholderText}>
//                   Visual outputs for this feature will appear here.
//                 </p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// const styles = {
//   page: {
//     minHeight: '100vh',
//     background: '#0f1117',
//   },
//   topBar: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: '16px',
//     padding: '20px 32px',
//     borderBottom: '1px solid #2a2d3a',
//     background: '#1a1d25',
//     position: 'sticky',
//     top: 0,
//     zIndex: 50,
//   },
//   backButton: {
//     background: 'transparent',
//     border: '1px solid #2a2d3a',
//     color: '#d1d5db',
//     borderRadius: '10px',
//     padding: '10px 14px',
//     fontSize: '14px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     whiteSpace: 'nowrap',
//   },
//   titleWrap: {
//     flex: 1,
//     minWidth: 0,
//   },
//   title: {
//     margin: 0,
//     color: '#f3f4f6',
//     fontSize: '22px',
//     fontWeight: '700',
//     letterSpacing: '-0.4px',
//   },
//   contentWithPanel: {
//     display: 'grid',
//     gridTemplateColumns: 'minmax(0, 1fr) 360px',
//     gap: '24px',
//     padding: '24px 32px 32px',
//     maxWidth: '1600px',
//     margin: '0 auto',
//   },
//   contentSingle: {
//     display: 'block',
//     padding: '24px 32px 32px',
//     maxWidth: '1100px',
//     margin: '0 auto',
//   },
//   leftColumn: {
//     minWidth: 0,
//   },
//   workspace: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '16px',
//     padding: '24px',
//     minHeight: '420px',
//     boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
//   },
//   rightColumn: {
//     minWidth: 0,
//   },
//   placeholderPanel: {
//     background: '#1a1d25',
//     border: '1px solid #2a2d3a',
//     borderRadius: '16px',
//     padding: '20px',
//     minHeight: '220px',
//     position: 'sticky',
//     top: '92px',
//   },
//   placeholderTitle: {
//     color: '#f3f4f6',
//     fontSize: '16px',
//     fontWeight: '600',
//     marginBottom: '8px',
//   },
//   placeholderText: {
//     color: '#9ca3af',
//     fontSize: '14px',
//     lineHeight: '1.6',
//     margin: 0,
//   },
// }