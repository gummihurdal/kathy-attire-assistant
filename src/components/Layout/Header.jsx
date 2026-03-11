import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { LogOut, Crown, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/',         label: 'Home' },
  { path: '/wardrobe', label: 'Wardrobe' },
  { path: '/outfits',  label: 'Outfits' },
  { path: '/mirror',   label: 'Mirror ✦' },
  { path: '/lookbook', label: 'Lookbook' },
  { path: '/advisor',  label: 'Style Advisor' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try { await signOut() } catch {}
    toast.success('Signed out', { className: 'toast-royal' })
    navigate('/')
    setMobileOpen(false)
  }

  return (
    <>
      <style>{`
        .header-nav { display: flex; gap: 1.5rem; align-items: center; }
        .header-auth { display: flex; }
        .header-mobile-btn { display: none !important; }
        .header-user-email { display: inline; }
        @media (max-width: 768px) {
          .header-nav { display: none !important; }
          .header-auth { display: none !important; }
          .header-mobile-btn { display: flex !important; }
          .header-user-email { display: none !important; }
          .header-inner { padding: 0.875rem 1.25rem !important; }
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.topRule} />
        <div style={styles.inner} className="header-inner">

          {/* Brand */}
          <Link to="/" style={styles.brandLink} onClick={() => setMobileOpen(false)}>
            <Crown size={13} color="var(--gold)" strokeWidth={1.5} />
            <span style={styles.brandName}>Kathy</span>
            <span style={styles.brandSub}>· Atelier Privé</span>
          </Link>

          {/* Desktop nav */}
          <nav className="header-nav">
            {NAV.map(({ path, label }) => {
              const active = location.pathname === path
              const isMirror = path === '/mirror'
              const isAdvisor = path === '/advisor'
              return (
                <Link key={path} to={path} style={{
                  ...styles.navLink,
                  color: active ? 'var(--gold)' : (isMirror || isAdvisor) ? 'var(--gold-light)' : 'var(--ivory-faint)',
                  borderBottom: active ? '1px solid var(--gold)' : '1px solid transparent',
                }}>
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop right actions */}
          <div style={styles.actions}>
            {user ? (
              <div style={styles.userRow} className="header-auth">
                <span style={styles.userEmail} className="header-user-email">{user.email?.split('@')[0]}</span>
                <button onClick={handleSignOut} style={styles.iconBtn} title="Sign out">
                  <LogOut size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <Link to="/auth" style={styles.authLink} className="header-auth">Sign In</Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="header-mobile-btn"
              style={styles.mobileBtn}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
        <div style={styles.bottomRule} />
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div style={styles.mobileMenu}>
          {NAV.map(({ path, label }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path} to={path}
                style={{ ...styles.mobileLink, color: active ? 'var(--gold)' : 'var(--ivory-dim)', borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent' }}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            )
          })}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            {user ? (
              <>
                <div style={{ color: 'var(--stone)', padding: '0.5rem 1.25rem', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                  {user.email}
                </div>
                <button onClick={handleSignOut} style={styles.mobileSignOut}>Sign Out</button>
              </>
            ) : (
              <Link to="/auth" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign In</Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  header: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(20px)' },
  topRule: { height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold-light) 50%, var(--gold) 70%, transparent 100%)', opacity: 0.6 },
  bottomRule: { height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)' },
  inner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2.5rem', gap: '1.5rem' },
  brandLink: { display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 },
  brandName: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--ivory)', fontStyle: 'italic', letterSpacing: '0.04em' },
  brandSub: { fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--ivory-faint)', textTransform: 'uppercase' },
  navLink: { textDecoration: 'none', fontSize: '0.65rem', letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 400, paddingBottom: '2px', transition: 'color 0.2s', whiteSpace: 'nowrap' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  userRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userEmail: { fontSize: '0.65rem', color: 'var(--ivory-faint)', letterSpacing: '0.05em' },
  iconBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--ivory-faint)', cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  authLink: { color: 'var(--gold)', textDecoration: 'none', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid var(--gold-dark)', padding: '0.4rem 0.875rem' },
  mobileBtn: { background: 'none', border: 'none', color: 'var(--ivory)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mobileMenu: {
    position: 'fixed', top: 53, left: 0, right: 0, bottom: 0, zIndex: 99,
    background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)',
    display: 'flex', flexDirection: 'column',
    padding: '1rem 0', overflowY: 'auto',
    borderTop: '1px solid var(--border)',
  },
  mobileLink: {
    textDecoration: 'none', padding: '1rem 1.25rem',
    fontSize: '0.9rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'color 0.2s',
  },
  mobileSignOut: {
    background: 'none', border: 'none', color: 'var(--ivory-faint)',
    padding: '1rem 1.25rem', fontSize: '0.9rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font-body)', width: '100%',
  },
}
