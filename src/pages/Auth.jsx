import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields', { className: 'toast-royal' })
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        toast.success('Welcome back, Katherina', { className: 'toast-royal' })
      } else {
        await signUp(email, password)
        toast.success('Account created — check your email to confirm', { className: 'toast-royal' })
      }
      navigate('/wardrobe')
    } catch (err) {
      toast.error(err.message, { className: 'toast-royal' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.card}
      >
        {/* Header */}
        <div style={styles.header}>
          <Crown size={20} color="var(--gold)" strokeWidth={1} />
          <h1 style={styles.title}>
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <span className="gold-line" style={{ display: 'block', margin: '0.5rem auto 0' }} />
          <p style={styles.subtitle}>
            {mode === 'signin'
              ? 'Your wardrobe is waiting.'
              : 'Begin your private atelier.'}
          </p>
        </div>

        {/* Form */}
        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%' }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <><Loader size={14} /> {mode === 'signin' ? 'Signing in…' : 'Creating…'}</>
              : mode === 'signin' ? 'Sign In' : 'Create Account'
            }
          </button>
        </div>

        <div className="divider" />

        <p style={styles.toggle}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={styles.toggleBtn}
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>

        <p style={styles.demoNote}>
          Or{' '}
          <button onClick={() => navigate('/wardrobe')} style={styles.toggleBtn}>
            continue in demo mode
          </button>{' '}
          without an account.
        </p>
      </motion.div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: 'var(--onyx)',
    border: '1px solid var(--border)',
    padding: '3rem',
    width: '100%',
    maxWidth: 420,
  },
  header: { textAlign: 'center', marginBottom: '2.5rem' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.5rem',
    fontWeight: 400,
    fontStyle: 'italic',
    marginTop: '1rem',
  },
  subtitle: {
    color: 'var(--ivory-dim)',
    fontSize: '0.85rem',
    fontWeight: 300,
    marginTop: '0.75rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: {
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ivory-faint)',
    fontWeight: 400,
  },
  submitBtn: {
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    border: 'none',
    padding: '1rem',
    fontSize: '0.75rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'opacity 0.2s',
  },
  toggle: { textAlign: 'center', fontSize: '0.8rem', color: 'var(--ivory-faint)', fontWeight: 300 },
  toggleBtn: {
    background: 'none', border: 'none', color: 'var(--gold)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    fontSize: '0.8rem', fontWeight: 300, textDecoration: 'underline',
  },
  demoNote: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--ivory-faint)',
    marginTop: '0.75rem',
    fontWeight: 300,
  },
}
