import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getListings, CATEGORIES, BRANDS } from '../lib/boutique'
import { useCart } from '../lib/cart'
import { ShoppingBag, Eye, Plus } from 'lucide-react'
import { useAuth } from '../lib/auth'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

const CONDITION_LABELS = {
  new_tags: 'New · Tagged',
  new_no_tags: 'New · Untagged',
  excellent: 'Excellent',
  very_good: 'Very Good',
  good: 'Good',
}

function ListingCard({ listing }) {
  const { add } = useCart()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      {/* Image container */}
      <Link to={`/boutique/${listing.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          position: 'relative', aspectRatio: '3/4', background: 'var(--charcoal)',
          overflow: 'hidden', marginBottom: '1rem',
        }}>
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]} alt={listing.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'linear-gradient(135deg, var(--charcoal), var(--muted))',
            }}>
              <span style={{ fontSize: '3rem', opacity: 0.3 }}>♛</span>
            </div>
          )}

          {/* Overlay on hover */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(8,8,8,0.8) 0%, transparent 50%)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: '1rem',
            }}
          >
            <button
              onClick={(e) => { e.preventDefault(); add(listing) }}
              style={{
                background: 'var(--gold)', border: 'none', color: 'var(--obsidian)',
                padding: '0.6rem 1.1rem', fontSize: '0.65rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <ShoppingBag size={12} strokeWidth={2} />
              Reserve
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.65rem', color: 'rgba(245,240,232,0.6)', letterSpacing: '0.08em',
            }}>
              <Eye size={11} strokeWidth={1.5} />
              {listing.views || 0}
            </div>
          </motion.div>

          {/* Exclusive badge */}
          {listing.is_exclusive && (
            <div style={{
              position: 'absolute', top: '0.75rem', left: '0.75rem',
              background: 'rgba(8,8,8,0.85)', border: '1px solid rgba(201,168,76,0.3)',
              padding: '0.2rem 0.6rem',
              fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--gold)', fontFamily: 'var(--font-body)',
            }}>
              Exclusive
            </div>
          )}

          {/* Condition badge */}
          <div style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            background: 'rgba(8,8,8,0.75)',
            padding: '0.2rem 0.5rem',
            fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--ivory-dim)', fontFamily: 'var(--font-body)',
          }}>
            {CONDITION_LABELS[listing.condition] || listing.condition}
          </div>
        </div>

        {/* Info */}
        <div>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.25rem' }}>
            {listing.brand}
          </p>
          <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)', fontSize: '1.05rem', fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1.3, marginBottom: '0.4rem' }}>
            {listing.title}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)', fontSize: '1.1rem' }}>
              €{Number(listing.price).toLocaleString('de-DE', { minimumFractionDigits: 0 })}
            </p>
            {listing.size && (
              <p style={{ fontSize: '0.65rem', color: 'var(--ivory-faint)', letterSpacing: '0.08em' }}>
                {listing.size}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Boutique() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    setLoading(true)
    getListings({ category: activeCategory === 'All' ? undefined : activeCategory })
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [activeCategory])

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 4rem 6rem', maxWidth: 1400, margin: '0 auto' }}>

      {/* Hero header */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        style={{ marginBottom: '3.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem', fontFamily: 'var(--font-body)' }}>
              ♛ Private Boutique
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--ivory)', fontWeight: 300, letterSpacing: '0.02em', lineHeight: 1 }}>
              Curated Pieces
            </h1>
            <p style={{ color: 'var(--ivory-faint)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', fontWeight: 300, marginTop: '0.75rem', maxWidth: 460, lineHeight: 1.7 }}>
              A private exchange of exceptional fashion. Every piece authenticated by its owner. Every transaction protected by escrow.
            </p>
          </div>
          <Link to="/boutique/sell"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              background: 'transparent', border: '1px solid var(--gold)',
              color: 'var(--gold)', padding: '0.875rem 1.75rem',
              fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--gold)'; e.target.style.color = 'var(--obsidian)' }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--gold)' }}
          >
            <Plus size={13} strokeWidth={1.5} />
            List a Piece
          </Link>
        </div>
      </motion.div>

      {/* Category filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="tag"
            style={{
              borderColor: activeCategory === cat ? 'var(--gold)' : undefined,
              color: activeCategory === cat ? 'var(--gold)' : undefined,
            }}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="shimmer" style={{ aspectRatio: '3/4', marginBottom: '1rem' }} />
              <div className="shimmer" style={{ height: 12, width: '60%', marginBottom: '0.5rem' }} />
              <div className="shimmer" style={{ height: 16, marginBottom: '0.5rem' }} />
              <div className="shimmer" style={{ height: 14, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', paddingTop: '6rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>♛</p>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)', fontSize: '2rem', fontWeight: 300, marginBottom: '0.75rem' }}>
            The Boutique Awaits
          </h2>
          <p style={{ color: 'var(--ivory-faint)', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
            Be the first to list an exceptional piece for our private members.
          </p>
          <Link to="/boutique/sell" className="btn-royal" style={{ textDecoration: 'none', display: 'inline-block', padding: '0.875rem 2.5rem' }}>
            List Your First Piece
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem 2rem' }}>
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </motion.div>
      )}

      {/* Trust bar */}
      <div style={{ marginTop: '5rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '🔒', label: 'Escrow Protected', desc: 'Payment held until delivery confirmed' },
          { icon: '✦', label: 'Members Only', desc: 'Exclusive to Kathy Atelier members' },
          { icon: '♛', label: 'Authenticated', desc: 'Seller verifies every piece listed' },
        ].map(t => (
          <div key={t.label} style={{ textAlign: 'center', maxWidth: 200 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.icon}</div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.25rem' }}>{t.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--ivory-faint)', lineHeight: 1.5 }}>{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="padding: '3rem 4rem"] { padding: 1.5rem 1.25rem 4rem !important; }
        }
      `}</style>
    </div>
  )
}
