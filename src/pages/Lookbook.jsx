import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'
import { getSavedOutfits, deleteOutfit } from '../lib/supabase'
import { STYLE_PROFILES } from '../lib/claude'

const DEMO_OUTFITS = [
  {
    id: '1',
    name: 'The Ivory Afternoon',
    style: 'smart_casual',
    created_at: new Date().toISOString(),
    data: {
      outfit_name: 'The Ivory Afternoon',
      tagline: 'Effortless sophistication for the discerning woman.',
      color_story: 'A serene ivory and cream palette with warm neutral undertones.',
      accessories_suggestion: 'Gold hoops, slim leather belt, structured clutch.',
      stylist_secret: 'Tuck the blouse asymmetrically for an editorial edge.',
      style_tags: ['Refined', 'Minimal', 'Effortless'],
      items: [
        { item_name: 'White silk blouse', styling_note: 'Half-tucked with a soft press.' },
        { item_name: 'Black tailored trousers', styling_note: 'Cropped to the ankle.' },
        { item_name: 'Cream stilettos', styling_note: 'Elongates the leg line.' },
      ]
    }
  }
]

export default function Lookbook() {
  const { user } = useAuth()
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    loadOutfits()
  }, [user])

  const loadOutfits = async () => {
    setLoading(true)
    try {
      const data = user ? await getSavedOutfits(user.id) : DEMO_OUTFITS
      setOutfits(data)
    } catch {
      setOutfits(DEMO_OUTFITS)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (outfit) => {
    try {
      if (user) await deleteOutfit(outfit.id)
      setOutfits(prev => prev.filter(o => o.id !== outfit.id))
      toast.success('Outfit removed from Lookbook', { className: 'toast-royal' })
    } catch {
      toast.error('Could not remove outfit', { className: 'toast-royal' })
    }
  }

  const styleProfile = (key) => STYLE_PROFILES[key] || STYLE_PROFILES.casual

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="section-label">Saved Looks</p>
        <h1 style={styles.title}>Lookbook</h1>
        <span className="gold-line" />
        <p style={styles.subtitle}>
          {outfits.length} curated look{outfits.length !== 1 ? 's' : ''} in your collection
        </p>
      </div>

      {loading ? (
        <div style={styles.loadingGrid}>
          {[1,2,3].map(i => (
            <div key={i} className="shimmer" style={styles.skeleton} />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '2rem', opacity: 0.3 }}>♛</p>
          <p style={styles.emptyTitle}>Your Lookbook is Empty</p>
          <p style={styles.emptyText}>Save outfits from the Generator to build your personal style archive.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          <AnimatePresence>
            {outfits.map((outfit, i) => {
              const data = outfit.data || {}
              const profile = styleProfile(outfit.style)
              const isExpanded = expanded === outfit.id

              return (
                <motion.div
                  key={outfit.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06 }}
                  style={styles.card}
                >
                  {/* Card header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.styleTag}>
                      <span>{profile.icon}</span>
                      <span>{profile.label}</span>
                    </div>
                    <p style={styles.date}>
                      {new Date(outfit.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Outfit name */}
                  <h2 style={styles.outfitName}>{outfit.name}</h2>
                  {data.tagline && <p style={styles.tagline}>{data.tagline}</p>}

                  {/* Style chips */}
                  {data.style_tags?.length > 0 && (
                    <div style={styles.chips}>
                      {data.style_tags.map(t => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Items preview */}
                  {data.items?.length > 0 && (
                    <div style={styles.itemsPreview}>
                      {data.items.slice(0, isExpanded ? 100 : 3).map((item, j) => (
                        <div key={j} style={styles.previewItem}>
                          <span style={styles.previewDot} />
                          <span style={styles.previewName}>{item.item_name}</span>
                        </div>
                      ))}
                      {!isExpanded && data.items.length > 3 && (
                        <p style={styles.more}>+{data.items.length - 3} more pieces</p>
                      )}
                    </div>
                  )}

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="divider" />
                        {data.color_story && (
                          <div style={styles.detailRow}>
                            <p className="section-label">Colour Story</p>
                            <p style={styles.detailText}>{data.color_story}</p>
                          </div>
                        )}
                        {data.accessories_suggestion && (
                          <div style={styles.detailRow}>
                            <p className="section-label">Accessories</p>
                            <p style={styles.detailText}>{data.accessories_suggestion}</p>
                          </div>
                        )}
                        {data.stylist_secret && (
                          <div style={styles.detailRow}>
                            <p className="section-label">Stylist's Secret</p>
                            <p style={styles.detailText}>{data.stylist_secret}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div style={styles.cardFooter}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : outfit.id)}
                      style={styles.expandBtn}
                    >
                      {isExpanded ? 'Less detail' : 'View full look'}
                    </button>
                    <button
                      onClick={() => handleDelete(outfit)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: '3rem 4rem', minHeight: '100vh' },
  header: { marginBottom: '3rem' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
    fontWeight: 400,
    fontStyle: 'italic',
  },
  subtitle: { color: 'var(--ivory-faint)', fontSize: '0.85rem', fontWeight: 300 },
  loadingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--border)' },
  skeleton: { height: 320 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '1rem', padding: '8rem 2rem', textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)', fontSize: '1.5rem',
    fontStyle: 'italic', color: 'var(--ivory-dim)',
  },
  emptyText: { color: 'var(--ivory-faint)', fontSize: '0.85rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1px',
    background: 'var(--border)',
  },
  card: {
    background: 'var(--charcoal)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  styleTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    fontWeight: 400,
  },
  date: { fontSize: '0.65rem', color: 'var(--ivory-faint)', fontWeight: 300 },
  outfitName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 400,
    fontStyle: 'italic',
  },
  tagline: { fontSize: '0.8rem', color: 'var(--ivory-dim)', fontStyle: 'italic', fontWeight: 300 },
  chips: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  itemsPreview: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  previewItem: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  previewDot: { width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 },
  previewName: { fontSize: '0.8rem', color: 'var(--ivory)', fontFamily: 'var(--font-display)', fontWeight: 400 },
  more: { fontSize: '0.65rem', color: 'var(--ivory-faint)', letterSpacing: '0.05em' },
  detailRow: { marginBottom: '1rem' },
  detailText: { fontSize: '0.8rem', color: 'var(--ivory-dim)', fontWeight: 300, lineHeight: 1.6, marginTop: '0.35rem' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' },
  expandBtn: {
    background: 'none', border: 'none', color: 'var(--gold)',
    fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 400,
  },
  deleteBtn: {
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--ivory-faint)', cursor: 'pointer',
    width: 28, height: 28, display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'border-color 0.2s, color 0.2s',
  },
}
