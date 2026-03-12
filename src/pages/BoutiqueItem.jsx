import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getListing } from '../lib/boutique'
import { useCart } from '../lib/cart'
import { ShoppingBag, ArrowLeft, Shield, Truck, RefreshCw } from 'lucide-react'

const CONDITION_LABELS = {
  new_tags: 'New with Tags',
  new_no_tags: 'New without Tags',
  excellent: 'Excellent Condition',
  very_good: 'Very Good Condition',
  good: 'Good Condition',
}

export default function BoutiqueItem() {
  const { id } = useParams()
  const { add, items } = useCart()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    getListing(id).then(l => { setListing(l); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (listing) setAdded(items.some(i => i.id === listing.id))
  }, [items, listing])

  const handleAdd = () => {
    add(listing)
    setAdded(true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory-faint)', fontSize: '1.5rem' }}>Loading…</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)', fontSize: '1.5rem' }}>Piece not found</p>
        <Link to="/boutique" style={{ color: 'var(--gold)', fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to Boutique</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 4rem 6rem', maxWidth: 1300, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Link to="/boutique" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ivory-faint)', fontSize: '0.72rem', letterSpacing: '0.1em', textDecoration: 'none', marginBottom: '2rem', textTransform: 'uppercase' }}>
        <ArrowLeft size={12} strokeWidth={1.5} />
        Boutique
      </Link>

      <div className="boutique-item-grid">
        {/* Left — Image gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          {/* Main image */}
          <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--charcoal)', marginBottom: '0.75rem', overflow: 'hidden' }}>
            {listing.images?.[activeImg] ? (
              <motion.img
                key={activeImg}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                src={listing.images[activeImg]} alt={listing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '5rem', opacity: 0.2 }}>♛</span>
              </div>
            )}

            {/* Exclusive badge */}
            {listing.is_exclusive && (
              <div style={{
                position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                background: 'rgba(8,8,8,0.82)', border: '1px solid rgba(201,168,76,0.35)',
                padding: '0.2rem 0.55rem',
                fontSize: '0.52rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)',
              }}>
                ♛ Exclusive
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {listing.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {listing.images.map((url, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    width: 72, height: 88, padding: 0, border: `1px solid ${activeImg === i ? 'var(--gold)' : 'var(--border)'}`,
                    cursor: 'pointer', background: 'var(--charcoal)', overflow: 'hidden', flexShrink: 0,
                    transition: 'border-color 0.15s',
                  }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right — Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ paddingTop: '0.5rem' }}>
          {/* Brand */}
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
            {listing.brand}
          </p>

          {/* Title */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: 'var(--ivory)', fontWeight: 300, letterSpacing: '0.02em', lineHeight: 1.2, marginBottom: '1.25rem' }}>
            {listing.title}
          </h1>

          {/* Divider */}
          <div className="divider" style={{ margin: '0 0 1.5rem' }} />

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--ivory)', fontWeight: 300 }}>
              €{Number(listing.price).toLocaleString('de-DE', { minimumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--ivory-faint)', letterSpacing: '0.06em' }}>EUR</p>
          </div>

          {/* Meta tags */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            {[
              listing.category,
              listing.size && `Size ${listing.size}`,
              CONDITION_LABELS[listing.condition] || listing.condition,
            ].filter(Boolean).map(tag => (
              <span key={tag} className="tag" style={{ cursor: 'default' }}>{tag}</span>
            ))}
          </div>

          {/* Description */}
          {listing.description && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory-faint)', marginBottom: '0.6rem' }}>Details</p>
              <p style={{ color: 'var(--ivory-dim)', fontSize: '0.87rem', lineHeight: 1.8, fontWeight: 300 }}>
                {listing.description}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAdd}
            disabled={added}
            style={{
              width: '100%', background: added ? 'var(--charcoal)' : 'var(--gold)',
              border: added ? '1px solid var(--border)' : 'none',
              color: added ? 'var(--ivory-faint)' : 'var(--obsidian)',
              padding: '1.1rem 2rem', fontSize: '0.75rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 500,
              cursor: added ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              transition: 'all 0.2s', marginBottom: '0.875rem',
            }}
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
            {added ? 'Added to Selection' : 'Reserve This Piece'}
          </button>

          {/* Escrow notice */}
          <div style={{ padding: '1rem 1.25rem', background: 'var(--charcoal)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.6rem' }}>
              🔒 Buyer Protection
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--ivory-faint)', lineHeight: 1.6 }}>
              Your payment is held securely in escrow. Funds are only released to the seller once you confirm delivery and satisfaction.
            </p>
          </div>

          {/* Trust icons */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { icon: Shield, label: 'Escrow protected' },
              { icon: Truck, label: 'Tracking required' },
              { icon: RefreshCw, label: 'Dispute support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon size={13} strokeWidth={1.2} style={{ color: 'var(--gold)' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--ivory-faint)', letterSpacing: '0.06em' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Views */}
          {listing.views > 0 && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.68rem', color: 'var(--stone)', letterSpacing: '0.06em' }}>
              {listing.views} {listing.views === 1 ? 'member has' : 'members have'} viewed this piece
            </p>
          )}
        </motion.div>
      </div>

      <style>{`
        .boutique-item-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .boutique-item-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
