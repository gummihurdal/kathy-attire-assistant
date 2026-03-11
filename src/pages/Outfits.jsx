import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'
import { getWardrobeItems, saveOutfit } from '../lib/supabase'
import { generateOutfitRecommendation, STYLE_PROFILES } from '../lib/claude'
import ItemCard from '../components/Wardrobe/ItemCard'

const DEMO_ITEMS = [
  { id: '1', name: 'White silk blouse', category: 'tops', colors: ['White', 'Cream'], image_url: null },
  { id: '2', name: 'Black tailored trousers', category: 'bottoms', colors: ['Black'], image_url: null },
  { id: '3', name: 'Navy wrap dress', category: 'dresses', colors: ['Navy'], image_url: null },
  { id: '4', name: 'Camel wool coat', category: 'outerwear', colors: ['Beige', 'Brown'], image_url: null },
  { id: '5', name: 'Cream stilettos', category: 'shoes', colors: ['Cream'], image_url: null },
  { id: '6', name: 'Black leather tote', category: 'bags', colors: ['Black'], image_url: null },
]

export default function Outfits() {
  const { user } = useAuth()
  const [wardrobeItems, setWardrobeItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [style, setStyle] = useState('smart_casual')
  const [occasion, setOccasion] = useState('')
  const [preferences, setPreferences] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)

  useEffect(() => {
    loadWardrobe()
  }, [user])

  const loadWardrobe = async () => {
    setLoading(true)
    try {
      const data = user ? await getWardrobeItems(user.id) : DEMO_ITEMS
      setWardrobeItems(data)
    } catch {
      setWardrobeItems(DEMO_ITEMS)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (wardrobeItems.length < 2) {
      toast.error('Please add at least 2 items to your wardrobe first', { className: 'toast-royal' })
      return
    }
    setGenerating(true)
    setResult(null)
    try {
      const outfit = await generateOutfitRecommendation({
        wardrobeItems,
        style,
        occasion,
        preferences,
      })
      setResult(outfit)
    } catch (err) {
      toast.error(err.message || 'Could not generate outfit — check your API key', { className: 'toast-royal' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await saveOutfit({
        user_id: user?.id || 'demo',
        name: result.outfit_name,
        style,
        data: result,
        item_ids: result.items?.map(i => i.item_id) || [],
      })
      toast.success(`✦ "${result.outfit_name}" saved to Lookbook`, { className: 'toast-royal' })
    } catch (err) {
      toast.error('Could not save outfit', { className: 'toast-royal' })
    } finally {
      setSaving(false)
    }
  }

  // Get recommended items from wardrobe
  const recommendedItems = result?.items
    ?.map(ri => wardrobeItems.find(w => w.id === ri.item_id || w.name === ri.item_name))
    .filter(Boolean) || []

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <p className="section-label">AI Stylist</p>
        <h1 style={styles.title}>Outfit Generator</h1>
        <span className="gold-line" />
        <p style={styles.subtitle}>
          Select a style direction and let your personal stylist compose the perfect look.
        </p>
      </div>

      <div style={styles.layout}>
        {/* Left panel: Controls */}
        <div style={styles.controls}>
          {/* Style selector */}
          <div style={styles.controlSection}>
            <p className="section-label" style={{ marginBottom: '1rem' }}>Style Direction</p>
            <div style={styles.styleGrid}>
              {Object.entries(STYLE_PROFILES).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  style={{
                    ...styles.styleBtn,
                    background: style === key ? 'var(--gold-glow)' : 'transparent',
                    borderColor: style === key ? 'var(--gold)' : 'var(--border)',
                    color: style === key ? 'var(--gold)' : 'var(--ivory-dim)',
                  }}
                >
                  <span style={styles.styleIcon}>{profile.icon}</span>
                  <span style={styles.styleLabel}>{profile.label}</span>
                  <span style={styles.styleDesc}>{profile.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div style={styles.controlSection}>
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>Occasion (optional)</p>
            <input
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              placeholder="e.g. Annual dinner, job interview, birthday lunch…"
              style={{ width: '100%' }}
            />
          </div>

          {/* Preferences toggle */}
          <div style={styles.controlSection}>
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              style={styles.prefsToggle}
            >
              <span>Style Preferences</span>
              {showPrefs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showPrefs && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <textarea
                    value={preferences}
                    onChange={e => setPreferences(e.target.value)}
                    placeholder="e.g. I prefer looser fits, I love layering, avoid bright colours, I like a monochrome palette…"
                    rows={4}
                    style={{ width: '100%', marginTop: '0.75rem', resize: 'vertical' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wardrobe count */}
          <p style={styles.wardrobeNote}>
            Drawing from <strong style={{ color: 'var(--gold)' }}>{wardrobeItems.length}</strong> pieces
            {!user && <em style={{ color: 'var(--ivory-faint)' }}> (demo wardrobe)</em>}
          </p>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              ...styles.generateBtn,
              opacity: generating ? 0.7 : 1,
              cursor: generating ? 'wait' : 'pointer',
            }}
          >
            {generating ? (
              <><Loader size={16} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} /> Curating your look…</>
            ) : (
              <><Sparkles size={16} strokeWidth={1.5} /> Generate Outfit</>
            )}
          </button>
        </div>

        {/* Right panel: Result */}
        <div style={styles.resultPanel}>
          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.loadingState}
              >
                <Sparkles size={32} color="var(--gold)" strokeWidth={1} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                <p style={styles.loadingText}>Your stylist is composing your look…</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ivory-faint)' }}>
                  Analysing your wardrobe, colour harmony & occasion…
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.result}
              >
                {/* Outfit header */}
                <div style={styles.resultHeader}>
                  <div>
                    <p className="section-label">Your Look</p>
                    <h2 style={styles.outfitName}>{result.outfit_name}</h2>
                    <p style={styles.outfitTagline}>{result.tagline}</p>
                  </div>
                  {result.confidence_score && (
                    <div style={styles.scoreCircle}>
                      <span style={styles.scoreNum}>{result.confidence_score}</span>
                      <span style={styles.scoreLabel}>Match</span>
                    </div>
                  )}
                </div>

                {/* Style tags */}
                {result.style_tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {result.style_tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="divider" />

                {/* Items */}
                {result.items?.length > 0 && (
                  <div style={styles.section}>
                    <p className="section-label" style={{ marginBottom: '1rem' }}>The Look</p>
                    <div style={styles.itemsList}>
                      {result.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={styles.itemRow}
                        >
                          <div style={styles.itemDot} />
                          <div>
                            <p style={styles.itemName}>{item.item_name}</p>
                            <p style={styles.itemNote}>{item.styling_note}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="divider" />

                {/* Details grid */}
                <div style={styles.detailsGrid}>
                  {result.color_story && (
                    <div style={styles.detailCard}>
                      <p style={styles.detailIcon}>🎨</p>
                      <p className="section-label" style={{ marginBottom: '0.4rem' }}>Colour Story</p>
                      <p style={styles.detailText}>{result.color_story}</p>
                    </div>
                  )}
                  {result.shoes_note && (
                    <div style={styles.detailCard}>
                      <p style={styles.detailIcon}>👠</p>
                      <p className="section-label" style={{ marginBottom: '0.4rem' }}>Shoes</p>
                      <p style={styles.detailText}>{result.shoes_note}</p>
                    </div>
                  )}
                  {result.accessories_suggestion && (
                    <div style={styles.detailCard}>
                      <p style={styles.detailIcon}>✦</p>
                      <p className="section-label" style={{ marginBottom: '0.4rem' }}>Accessories</p>
                      <p style={styles.detailText}>{result.accessories_suggestion}</p>
                    </div>
                  )}
                  {result.stylist_secret && (
                    <div style={styles.detailCard}>
                      <p style={styles.detailIcon}>♛</p>
                      <p className="section-label" style={{ marginBottom: '0.4rem' }}>Stylist's Secret</p>
                      <p style={styles.detailText}>{result.stylist_secret}</p>
                    </div>
                  )}
                </div>

                {/* Save button */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      ...styles.saveBtn,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    <Heart size={14} strokeWidth={1.5} />
                    {saving ? 'Saving…' : 'Save to Lookbook'}
                  </button>
                  <button
                    onClick={handleGenerate}
                    style={styles.regenerateBtn}
                  >
                    Regenerate
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.emptyState}
              >
                <div style={styles.emptyDecor}>
                  {Object.values(STYLE_PROFILES).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.emptyDecorItem,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    >
                      {p.icon}
                    </div>
                  ))}
                </div>
                <h2 style={styles.emptyTitle}>Your Look Awaits</h2>
                <p style={styles.emptyText}>
                  Select a style direction and tap Generate Outfit to receive<br />
                  a curated recommendation from your personal wardrobe.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
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
  subtitle: {
    color: 'var(--ivory-faint)',
    fontSize: '0.85rem',
    fontWeight: 300,
    maxWidth: 500,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '3rem',
    alignItems: 'start',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    position: 'sticky',
    top: '5rem',
  },
  controlSection: {},
  styleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  styleBtn: {
    border: '1px solid',
    padding: '0.875rem 1rem',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s, background 0.2s, color 0.2s',
    display: 'grid',
    gridTemplateColumns: '20px 1fr',
    gridTemplateRows: 'auto auto',
    gap: '0 0.5rem',
    alignItems: 'start',
  },
  styleIcon: { gridRow: '1 / 3', fontSize: '0.9rem', paddingTop: '2px' },
  styleLabel: {
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  styleDesc: {
    fontSize: '0.65rem',
    letterSpacing: '0.02em',
    opacity: 0.7,
    fontWeight: 300,
  },
  prefsToggle: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--ivory-dim)',
    padding: '0.75rem 1rem',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wardrobeNote: {
    fontSize: '0.75rem',
    color: 'var(--ivory-faint)',
    fontWeight: 300,
  },
  generateBtn: {
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    border: 'none',
    padding: '1rem 2rem',
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    width: '100%',
    transition: 'opacity 0.2s',
  },
  resultPanel: {
    minHeight: 400,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '6rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border)',
    background: 'var(--charcoal)',
  },
  loadingText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontStyle: 'italic',
    color: 'var(--ivory-dim)',
  },
  result: {
    border: '1px solid var(--border)',
    background: 'var(--charcoal)',
    padding: '2.5rem',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    gap: '1rem',
  },
  outfitName: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 400,
    fontStyle: 'italic',
    marginTop: '0.25rem',
  },
  outfitTagline: {
    color: 'var(--ivory-dim)',
    fontSize: '0.9rem',
    fontWeight: 300,
    fontStyle: 'italic',
    marginTop: '0.5rem',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    border: '1px solid var(--gold)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreNum: {
    color: 'var(--gold)',
    fontSize: '1rem',
    fontWeight: 500,
    fontFamily: 'var(--font-display)',
  },
  scoreLabel: {
    color: 'var(--ivory-faint)',
    fontSize: '0.5rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  section: { marginBottom: '1.5rem' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--gold)',
    marginTop: '6px',
    flexShrink: 0,
  },
  itemName: {
    fontSize: '0.875rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    color: 'var(--ivory)',
  },
  itemNote: {
    fontSize: '0.75rem',
    color: 'var(--ivory-dim)',
    fontWeight: 300,
    marginTop: '0.2rem',
    lineHeight: 1.5,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1px',
    background: 'var(--border)',
    marginBottom: '1.5rem',
  },
  detailCard: {
    background: 'var(--onyx)',
    padding: '1.25rem',
  },
  detailIcon: { fontSize: '1.2rem', marginBottom: '0.5rem' },
  detailText: {
    fontSize: '0.8rem',
    color: 'var(--ivory-dim)',
    fontWeight: 300,
    lineHeight: 1.6,
  },
  saveBtn: {
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    border: 'none',
    padding: '0.75rem 1.5rem',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'opacity 0.2s',
  },
  regenerateBtn: {
    background: 'none',
    color: 'var(--ivory-dim)',
    border: '1px solid var(--border)',
    padding: '0.75rem 1.5rem',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border)',
    minHeight: 400,
  },
  emptyDecor: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyDecorItem: {
    fontSize: '1.5rem',
    opacity: 0.2,
    animation: 'float 3s ease-in-out infinite',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontStyle: 'italic',
    fontWeight: 400,
    color: 'var(--ivory-dim)',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '0.85rem',
    color: 'var(--ivory-faint)',
    fontWeight: 300,
    lineHeight: 1.7,
  },
}
