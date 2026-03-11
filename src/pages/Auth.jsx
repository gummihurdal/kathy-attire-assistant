import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Loader, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields', { className: 'toast-royal' })
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters', { className: 'toast-royal' })
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        toast.success('Welcome back, Katherina ♛', { className: 'toast-royal' })
        navigate('/wardrobe')
      } else {
        await signUp(email, password)
        toast.success('Account created! Check your email to confirm.', { className: 'toast-royal', duration: 6000 })
      }
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
        transition={{ duration: 0.5 }}
        style={styles.card}
      >
        {/* Gold top line */}
        <div style={styles.topAccent} />

        <div style={styles.inner}>
          {/* Header */}
          <div style={styles.header}>
            <Crown size={22} color="var(--gold)" strokeWidth={1} />
            <h1 style={styles.title}>
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <span className="gold-line" style={{ display: 'block', margin: '0.5rem auto 0' }} />
            <p style={styles.subtitle}>
              {mode === 'signin' ? 'Your wardrobe awaits.' : 'Begin your private atelier.'}
            </p>
          </div>

          {/* Form */}
          <div style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%' }}
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ width: '100%', paddingRight: '3rem' }}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                  type="button"
                >
                  {showPass ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                : mode === 'signin' ? '✦  Sign In' : '✦  Create Account'
              }
            </button>
          </div>

          <div className="divider" />

          <p style={styles.toggle}>
            {mode === 'signin' ? "New here? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.toggleBtn}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

          <p style={styles.demoNote}>
            Or{' '}
            <Link to="/wardrobe" style={{ color: 'var(--ivory-faint)', fontSize: '0.75rem' }}>
              continue in demo mode
            </Link>
            {' '}without an account.
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '2rem',
  },
  card: {
    background: 'var(--onyx)', border: '1px solid var(--border)',
    width: '100%', maxWidth: 420, overflow: 'hidden',
  },
  topAccent: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent, var(--gold), var(--gold-light), var(--gold), transparent)',
  },
  inner: { padding: '2.5rem 3rem 3rem' },
  header: { textAlign: 'center', marginBottom: '2.5rem' },
  title: {
    fontFamily: 'var(--font-display)', fontSize: '2.5rem',
    fontWeight: 400, fontStyle: 'italic', marginTop: '1rem',
  },
  subtitle: { color: 'var(--ivory-dim)', fontSize: '0.85rem', fontWeight: 300, marginTop: '0.75rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: {
    fontSize: '0.65rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--ivory-faint)', fontWeight: 400,
  },
  eyeBtn: {
    position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'var(--ivory-faint)',
    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
  },
  submitBtn: {
    background: 'var(--gold)', color: 'var(--obsidian)', border: 'none',
    padding: '1rem', fontSize: '0.75rem', letterSpacing: '0.15em',
    textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-body)', marginTop: '0.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', transition: 'opacity 0.2s', width: '100%',
  },
  toggle: { textAlign: 'center', fontSize: '0.8rem', color: 'var(--ivory-faint)', fontWeight: 300 },
  toggleBtn: {
    background: 'none', border: 'none', color: 'var(--gold)',
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
    fontWeight: 300, textDecoration: 'underline', padding: 0,
  },
  demoNote: { textAlign: 'center', fontSize: '0.75rem', color: 'var(--ivory-faint)', marginTop: '0.75rem', fontWeight: 300 },
}
