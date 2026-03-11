import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { LogOut, Crown } from 'lucide-react'

const NAV = [
  { path: '/', label: 'Atelier' },
  { path: '/wardrobe', label: 'Wardrobe' },
  { path: '/outfits', label: 'Outfits' },
  { path: '/lookbook', label: 'Lookbook' },
]

export default function Header() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
  }

  return (
    <header style={styles.header}>
      {/* Top gold rule */}
      <div style={styles.topRule} />

      {/* Crown + Name */}
      <div style={styles.inner}>
        <div style={styles.brand}>
          <Link to="/" style={styles.brandLink}>
            <Crown size={14} color="var(--gold)" strokeWidth={1.5} />
            <span style={styles.brandName}>Kathy</span>
            <span style={styles.brandSub}>·  Atelier Privé</span>
          </Link>
        </div>

        <nav style={styles.nav}>
          {NAV.map(({ path, label }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navLink,
                  color: active ? 'var(--gold)' : 'var(--ivory-faint)',
                  borderBottom: active ? '1px solid var(--gold)' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={styles.actions}>
          {user ? (
            <button onClick={handleSignOut} style={styles.iconBtn} title="Sign out">
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          ) : (
            <Link to="/auth" style={styles.authLink}>Sign in</Link>
          )}
        </div>
      </div>

      {/* Bottom gold rule */}
      <div style={styles.bottomRule} />
    </header>
  )
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(8,8,8,0.95)',
    backdropFilter: 'blur(20px)',
  },
  topRule: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold-light) 50%, var(--gold) 70%, transparent 100%)',
    opacity: 0.6,
  },
  bottomRule: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2.5rem',
    gap: '2rem',
  },
  brand: {
    minWidth: 180,
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    textDecoration: 'none',
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 500,
    color: 'var(--ivory)',
    fontStyle: 'italic',
    letterSpacing: '0.04em',
  },
  brandSub: {
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    color: 'var(--ivory-faint)',
    textTransform: 'uppercase',
    fontWeight: 400,
  },
  nav: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center',
  },
  navLink: {
    textDecoration: 'none',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 400,
    paddingBottom: '2px',
    transition: 'color 0.2s, border-color 0.2s',
  },
  actions: {
    minWidth: 180,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--ivory-faint)',
    cursor: 'pointer',
    padding: '4px',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  authLink: {
    color: 'var(--gold)',
    textDecoration: 'none',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 400,
  },
}
