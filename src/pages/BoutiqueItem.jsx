import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getListing } from '../lib/boutique'
import { useCart } from '../lib/cart'
import { useAuth } from '../lib/auth'
import { sendMessage, getThread, markThreadRead } from '../lib/messages'
import { ShoppingBag, ArrowLeft, Shield, Truck, RefreshCw, Send, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [thread, setThread] = useState([])
  const [sending, setSending] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)

  useEffect(() => {
    getListing(id).then(l => { setListing(l); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (listing) setAdded(items.some(i => i.id === listing.id))
  }, [items, listing])

  useEffect(() => {
    if (user && listing) {
      getThread(listing.id).then(setThread)
      markThreadRead(listing.id)
    }
  }, [user, listing])

  const handleSendMsg = async () => {
    if (!user) { navigate('/auth'); return }
    if (!msgText.trim()) return
    setSending(true)
    try {
      await sendMessage({
        listingId: listing.id,
        sellerId: listing.seller_id,
        sellerEmail: '',
        message: msgText,
      })
      setMsgText('')
      const updated = await getThread(listing.id)
      setThread(updated)
      toast.success('Message sent', { className: 'toast-royal' })
    } catch (e) {
      toast.error(e.message || 'Failed to send', { className: 'toast-royal' })
    } finally {
      setSending(false)
    }
  }

  const handleAdd = () => {
    if (!user) { navigate('/auth'); return }
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

          {/* ── Messaging ── */}
          {user && user.id !== listing.seller_id && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button onClick={() => setMsgOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--ivory-faint)', cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, marginBottom: msgOpen ? '1rem' : 0 }}>
                <MessageSquare size={14} strokeWidth={1.5} />
                {thread.length > 0 ? `Message thread (${thread.length})` : 'Ask the seller a question'}
              </button>

              <AnimatePresence>
                {msgOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    {/* Thread */}
                    {thread.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', maxHeight: 260, overflowY: 'auto' }}>
                        {thread.map(m => {
                          const mine = m.sender_id === user.id
                          return (
                            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                maxWidth: '78%', padding: '0.55rem 0.8rem',
                                background: mine ? 'rgba(201,168,76,0.1)' : 'var(--charcoal)',
                                border: `1px solid ${mine ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`,
                              }}>
                                <p style={{ fontSize: '0.78rem', color: 'var(--ivory)', lineHeight: 1.6 }}>{m.message}</p>
                                <p style={{ fontSize: '0.58rem', color: 'var(--stone)', marginTop: '0.25rem' }}>
                                  {mine ? 'You' : 'Seller'} · {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <textarea
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMsg() } }}
                        placeholder="Ask about condition, measurements, provenance… (Enter to send)"
                        rows={2}
                        style={{
                          flex: 1, background: 'var(--charcoal)', border: '1px solid var(--border)',
                          color: 'var(--ivory)', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                          padding: '0.6rem 0.875rem', resize: 'none', outline: 'none', lineHeight: 1.6,
                        }}
                      />
                      <button onClick={handleSendMsg} disabled={sending || !msgText.trim()}
                        style={{
                          background: msgText.trim() ? 'rgba(201,168,76,0.12)' : 'var(--charcoal)',
                          border: `1px solid ${msgText.trim() ? 'rgba(201,168,76,0.35)' : 'var(--border)'}`,
                          color: 'var(--gold)', cursor: msgText.trim() ? 'pointer' : 'default',
                          width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s', flexShrink: 0,
                        }}>
                        <Send size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!user && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--ivory-faint)' }}>
                <Link to="/auth" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link> to ask the seller a question
              </p>
            </div>
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
