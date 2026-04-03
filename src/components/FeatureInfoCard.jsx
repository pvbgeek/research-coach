export default function FeatureInfoCard({ feature }) {
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>{feature.title}</h2>
          <p style={styles.subtitle}>{feature.shortDescription}</p>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.item}>
          <div style={styles.label}>What it does</div>
          <div style={styles.value}>{feature.whatItDoes}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>What it won’t do</div>
          <div style={styles.value}>{feature.whatItWontDo}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Input</div>
          <div style={styles.value}>{feature.input}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Output</div>
          <div style={styles.value}>{feature.output}</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#1a1d25',
    border: '1px solid #2a2d3a',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#f3f4f6',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.4px',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
  },
  item: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '16px',
  },
  label: {
    color: '#6366f1',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '8px',
  },
  value: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.7',
  },
}