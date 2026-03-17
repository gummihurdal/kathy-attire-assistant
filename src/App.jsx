import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { AuthProvider } from './lib/auth'
import { CartProvider } from './lib/cart'
import Header from './components/Layout/Header'
import CartDrawer from './components/Cart/CartDrawer'
import Home from './pages/Home'
import Wardrobe from './pages/Wardrobe'
import Outfits from './pages/Outfits'
import Lookbook from './pages/Lookbook'
import Advisor from './pages/Advisor'
import Mirror from './pages/Mirror'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import Boutique from './pages/Boutique'
import BoutiqueList from './pages/BoutiqueList'
import BoutiqueItem from './pages/BoutiqueItem'
import Messages from './pages/Messages'
import Admin from './pages/Admin'
import { trackPageView } from './lib/analytics'
import './styles/globals.css'

function PageTracker() {
  const location = useLocation()
  useEffect(() => { trackPageView(location.pathname) }, [location.pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
        <PageTracker />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <CartDrawer />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/wardrobe" element={<Wardrobe />} />
              <Route path="/outfits" element={<Outfits />} />
              <Route path="/lookbook" element={<Lookbook />} />
          <Route path="/advisor" element={<Advisor />} />
              <Route path="/mirror" element={<Mirror />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/boutique/sell" element={<BoutiqueList />} />
              <Route path="/boutique/:id" element={<BoutiqueItem />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <footer style={styles.footer}>
            <div style={styles.footerTop} />
            <div style={styles.footerInner}>
              <p style={styles.footerLeft}>
                <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Kathy</span>
                <span style={{ color: 'var(--ivory-faint)', fontSize: '0.7rem', marginLeft: '0.5rem', letterSpacing: '0.1em' }}>Atelier Privé</span>
              </p>
              <p style={styles.footerRight}>
                <a href="/help.html" style={{ color: 'var(--gold-dark)', textDecoration: 'none', fontSize: '0.7rem', letterSpacing: '0.1em', marginRight: '1.5rem' }}>Help</a>
                Crafted with love for <em>Katherina</em>
              </p>
            </div>
          </footer>
        </div>
        <Toaster position="bottom-right" toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a', color: '#f5f0e8', border: '1px solid #2e2e2e',
            fontFamily: "'Jost', system-ui, sans-serif", fontSize: '0.875rem',
            fontWeight: 300, borderRadius: '0',
          },
        }} />
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

const styles = {
  footer: { borderTop: '1px solid var(--border)', marginTop: '4rem' },
  footerTop: { height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--gold-dark) 50%, transparent 100%)', opacity: 0.3 },
  footerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 4rem' },
  footerLeft: { fontSize: '1rem' },
  footerRight: { fontSize: '0.7rem', color: 'var(--ivory-faint)', fontWeight: 300 },
}
