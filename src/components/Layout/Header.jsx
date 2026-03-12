import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useCart } from '../../lib/cart'
import { getUnreadCount } from '../../lib/messages'
import { LogOut, Crown, Menu, X, ShoppingBag, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/',         label: 'Home' },
  { path: '/wardrobe', label: 'Wardrobe' },
  { path: '/outfits',  label: 'Outfits' },
  { path: '/mirror',   label: 'Mirror ✦' },
  { path: '/lookbook', label: 'Lookbook' },
  { path: '/advisor',  label: 'Style Advisor' },
  { path: '/profile',  label: 'My Profile' },
  { path: '/boutique', label: 'Boutique ♛' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { count, setOpen: openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) { setUnread(0); return }
    getUnreadCount().then(setUnread)
    const interval = setInterval(() => getUnreadCount().then(setUnread), 30000)
    return () => clearInterval(interval)
  }, [user])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('menu-open')
    } else {
      document.body.classList.remove('menu-open')
    }
    return () => document.body.classList.remove('menu-open')
  }, [mobileOpen])

  // Close menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleSignOut = async () => {
    try { await signOut() } catch {}
    toast.success('Signed out', { className: 'toast-royal' })
    navigate('/')
    setMobileOpen(false)
  }

  return (
    <>
      <header style={S.header}>
        <div style={S.topRule} />
        <div style={S.inner} className="header-inner">

          {/* Brand */}
          <Link to="/" style={S.brandLink}>
            <Crown size={13} color="var(--gold)" strokeWidth={1.5} />
            <span style={S.brandName}>Kathy</span>
            <span style={S.brandSub}>· Atelier Privé</span>
          </Link>

          {/* Desktop nav — hidden on mobile via CSS class */}
          <nav className="header-nav" style={S.nav}>
            {NAV.map(({ path, label }) => {
              const active = location.pathname === path
              return (
                <Link key={path} to={path} style={{
                  ...S.navLink,
                  color: active ? 'var(--gold)' : 'var(--ivory-faint)',
                  borderBottom: active ? '1px solid var(--gold)' : '1px solid transparent',
                }}>
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div style={S.actions}>
            {/* Messages icon — logged in only */}
            {user && (
              <Link to="/messages" style={{ ...S.iconBtn, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Messages">
                <MessageSquare size={15} strokeWidth={1.5} color="var(--ivory-faint)" />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: 'var(--gold)', color: 'var(--obsidian)',
                    borderRadius: '50%', width: 15, height: 15,
                    fontSize: '0.52rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, pointerEvents: 'none',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </Link>
            )}

            {/* Cart icon — always visible */}
            <button onClick={() => openCart(true)} style={{ ...S.iconBtn, position: 'relative', width: 'auto', padding: '0 0.75rem', gap: '0.4rem', display: 'flex', alignItems: 'center', border: count > 0 ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--border)' }} title="View Cart">
              <ShoppingBag size={15} strokeWidth={1.5} style={{ color: count > 0 ? 'var(--gold)' : 'var(--ivory-faint)', flexShrink: 0 }} />
              {count > 0 && (
                <span style={{ fontSize: '0.6rem', color: 'var(--gold)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              )}
            </button>

            {/* Desktop user/signin — hidden on mobile */}
            <div className="header-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user ? (
                <>
                  <span style={S.userEmail}>{user.email?.split('@')[0]}</span>
                  <button onClick={handleSignOut} style={S.iconBtn} title="Sign out">
                    <LogOut size={14} strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <Link to="/auth" style={S.authLink}>Sign In</Link>
              )}
            </div>

            {/* Hamburger — mobile only, shown via CSS */}
            <button
              className="header-mobile-btn"
              style={S.mobileBtn}
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen
                ? <X size={24} strokeWidth={1.5} color="var(--ivory)" />
                : <Menu size={24} strokeWidth={1.5} color="var(--ivory)" />
              }
            </button>
          </div>
        </div>
        <div style={S.bottomRule} />
      </header>

      {/* Mobile fullscreen menu */}
      {mobileOpen && (
        <div style={S.overlay}>
          <div style={S.overlayInner}>
            {NAV.map(({ path, label }) => {
              const active = location.pathname === path
              return (
                <Link
                  key={path} to={path}
                  style={{
                    ...S.overlayLink,
                    color: active ? 'var(--gold)' : 'var(--ivory)',
                    borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              )
            })}

            <div style={S.overlaySeparator} />

            {/* Cart shortcut in mobile menu */}
            <button
              onClick={() => { setMobileOpen(false); openCart(true) }}
              style={{ ...S.overlayLink, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', color: count > 0 ? 'var(--gold)' : 'var(--ivory-faint)', fontFamily: 'var(--font-body)', width: '100%' }}
            >
              <ShoppingBag size={14} strokeWidth={1.5} />
              Cart{count > 0 ? ` · ${count} ${count === 1 ? 'item' : 'items'}` : ''}
            </button>

            <div style={S.overlaySeparator} />
              <>
                <div style={S.overlayMeta}>{user.email}</div>
                <button onClick={handleSignOut} style={S.overlaySignOut}>Sign Out</button>
              </>
            ) : (
              <Link to="/auth" style={{...S.overlayLink, color: 'var(--gold)'}} onClick={() => setMobileOpen(false)}>Sign In</Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const S = {
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)',
  },
  topRule: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold-light) 50%, var(--gold) 70%, transparent 100%)',
    opacity: 0.6,
  },
  bottomRule: { height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)' },
  inner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 2.5rem', gap: '1.5rem',
  },
  brandLink: { display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 },
  brandName: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--ivory)', fontStyle: 'italic', letterSpacing: '0.04em' },
  brandSub: { fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--ivory-faint)', textTransform: 'uppercase' },
  nav: { gap: '1.5rem', alignItems: 'center' },
  navLink: { textDecoration: 'none', fontSize: '0.65rem', letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 400, paddingBottom: '2px', transition: 'color 0.2s', whiteSpace: 'nowrap' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  userEmail: { fontSize: '0.65rem', color: 'var(--ivory-faint)', letterSpacing: '0.05em' },
  iconBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--ivory-faint)', cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  authLink: { color: 'var(--gold)', textDecoration: 'none', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid var(--gold-dark)', padding: '0.4rem 0.875rem' },
  mobileBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' },

  // Full-screen overlay menu for mobile
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
    background: 'rgba(6,6,6,0.98)', backdropFilter: 'blur(24px)',
    WebkitOverflowScrolling: 'touch',
    overflowY: 'auto',
    paddingTop: 64, // below header
  },
  overlayInner: {
    display: 'flex', flexDirection: 'column',
    padding: '2rem 0',
  },
  overlayLink: {
    textDecoration: 'none',
    padding: '1rem 1rem 1rem 1.5rem',
    fontSize: '1.1rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'color 0.2s, border-left-color 0.2s',
  },
  overlaySeparator: { height: '1px', background: 'var(--border)', margin: '1rem 0' },
  overlayMeta: { color: 'var(--stone)', padding: '0.5rem 1.25rem', fontSize: '0.75rem', letterSpacing: '0.05em' },
  overlaySignOut: {
    background: 'none', border: 'none', color: 'var(--ivory-faint)',
    padding: '1.1rem 1.25rem', fontSize: '1rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font-body)', width: '100%',
    WebkitTapHighlightColor: 'transparent',
  },
}
