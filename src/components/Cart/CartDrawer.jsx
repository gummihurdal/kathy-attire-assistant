import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../lib/cart'
import { X, Trash2, ShoppingBag } from 'lucide-react'

export default function CartDrawer() {
  const { items, remove, total, count, open, setOpen } = useCart()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.38 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw',
              background: 'var(--onyx)', borderLeft: '1px solid var(--border)',
              zIndex: 201, display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.75rem 2rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--ivory)', fontWeight: 400, letterSpacing: '0.02em' }}>
                  Your Selection
                </p>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', marginTop: '0.1rem' }}>
                  {count} {count === 1 ? 'Piece' : 'Pieces'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ivory-faint)', padding: '0.5rem' }}>
                <X size={20} strokeWidth={1} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                  <ShoppingBag size={40} strokeWidth={0.8} style={{ color: 'var(--border)', marginBottom: '1.5rem' }} />
                  <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory-faint)', fontSize: '1.2rem' }}>Your selection is empty</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: '0.5rem' }}>Discover curated pieces in the Boutique</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', gap: '1rem', alignItems: 'flex-start',
                        paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {/* Image */}
                      <div style={{ width: 72, height: 88, flexShrink: 0, background: 'var(--charcoal)', overflow: 'hidden' }}>
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>♛</div>
                        }
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{item.brand}</p>
                        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)', fontSize: '1rem', lineHeight: 1.3 }}>{item.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--ivory-faint)', marginTop: '0.25rem' }}>
                          {item.size && `Size ${item.size} · `}{item.condition?.replace(/_/g, ' ')}
                        </p>
                        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ivory)', fontSize: '1.15rem', marginTop: '0.5rem' }}>
                          €{Number(item.price).toLocaleString('de-DE', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <button onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ivory-faint)', padding: '0.25rem', flexShrink: 0 }}>
                        <Trash2 size={15} strokeWidth={1.2} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)' }}>
                {/* Divider */}
                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold-dark), transparent)', marginBottom: '1.25rem', opacity: 0.4 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ivory-faint)' }}>Total</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ivory)' }}>
                    €{total.toLocaleString('de-DE', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <button
                  className="btn-royal"
                  style={{ width: '100%', fontSize: '0.72rem', letterSpacing: '0.18em', padding: '1.1rem' }}
                >
                  ♛ Proceed to Checkout
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--stone)', marginTop: '0.875rem', letterSpacing: '0.04em' }}>
                  Funds held in escrow until delivery confirmed
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
