import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#080808', color: '#f5f0e8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', fontFamily: 'system-ui' }}>
          <p style={{ color: '#c9a84c', fontSize: '1.5rem' }}>✦</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Something went wrong</p>
          <p style={{ fontSize: '0.7rem', opacity: 0.4, maxWidth: 400, textAlign: 'center', wordBreak: 'break-all' }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.href='/'} style={{ marginTop: '1rem', background: 'none', border: '1px solid #c9a84c', color: '#c9a84c', padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            Return Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
