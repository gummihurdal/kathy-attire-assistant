import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'
import { getWardrobeItems, deleteWardrobeItem } from '../lib/supabase'
import ItemCard from '../components/Wardrobe/ItemCard'
import UploadModal from '../components/Wardrobe/UploadModal'

const CATEGORIES = ['All', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories', 'activewear']

// Demo items for when not authenticated
const DEMO_ITEMS = [
  { id: '1', name: 'White silk blouse', category: 'tops', colors: ['White', 'Cream'], brand: 'Demo', image_url: null, created_at: new Date().toISOString() },
  { id: '2', name: 'Black tailored trousers', category: 'bottoms', colors: ['Black'], brand: 'Demo', image_url: null, created_at: new Date().toISOString() },
  { id: '3', name: 'Navy wrap dress', category: 'dresses', colors: ['Navy'], brand: 'Demo', image_url: null, created_at: new Date().toISOString() },
  { id: '4', name: 'Camel wool coat', category: 'outerwear', colors: ['Beige', 'Brown'], brand: 'Demo', image_url: null, created_at: new Date().toISOString() },
  { id: '5', name: 'Cream stilettos', category: 'shoes', colors: ['Cream'], brand: 'Demo', image_url: null, created_at: new Date().toISOString() },
  { id: '6', name: 'Black leather tote', category: 'bags', colors: ['Black'], brand: 'Demo', image_url: null, created_at: new Date().toISOString() },
]

export default function Wardrobe() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadItems()
  }, [user])

  const loadItems = async () => {
    setLoading(true)
    try {
      if (user) {
        const data = await getWardrobeItems(user.id)
        setItems(data)
      } else {
        // Demo mode
        setItems(DEMO_ITEMS)
      }
    } catch (err) {
      toast.error('Could not load wardrobe', { className: 'toast-royal' })
      setItems(DEMO_ITEMS)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item) => {
    try {
      if (user) {
        await deleteWardrobeItem(item.id, item.image_url)
      }
      setItems(prev => prev.filter(i => i.id !== item.id))
      toast.success(`"${item.name}" removed`, { className: 'toast-royal' })
    } catch (err) {
      toast.error('Could not remove item', { className: 'toast-royal' })
    }
  }

  const handleSaved = (newItem) => {
    setItems(prev => [newItem, ...prev])
  }

  const filtered = items.filter(item => {
    const matchCat = filter === 'All' || item.category === filter
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.colors?.some(c => c.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  // Category counts
  const counts = {}
  items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1 })

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p className="section-label">My Collection</p>
          <h1 style={styles.title}>Wardrobe</h1>
          <span className="gold-line" />
          <p style={styles.subtitle}>
            {items.length} piece{items.length !== 1 ? 's' : ''} in your collection
            {!user && <span style={{ color: 'var(--gold)', marginLeft: '0.75rem' }}>— Demo Mode</span>}
          </p>
        </div>

        <button onClick={() => setShowUpload(true)} style={styles.addBtn}>
          <Plus size={14} strokeWidth={2} />
          Add Piece
        </button>
      </div>

      {/* Filters + Search */}
      <div style={styles.filterBar}>
        <div style={styles.filterTabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                ...styles.filterTab,
                color: filter === cat ? 'var(--gold)' : 'var(--ivory-faint)',
                borderBottom: filter === cat ? '1px solid var(--gold)' : '1px solid transparent',
              }}
            >
              {cat === 'All' ? 'All' : cat}
              {cat !== 'All' && counts[cat] ? (
                <span style={styles.count}>{counts[cat]}</span>
              ) : null}
              {cat === 'All' && (
                <span style={styles.count}>{items.length}</span>
              )}
            </button>
          ))}
        </div>

        <div style={styles.searchWrap}>
          <Search size={14} color="var(--ivory-faint)" strokeWidth={1.5} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, colour, brand…"
            style={{ ...styles.searchInput, paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      <div className="divider" />

      {/* Grid */}
      {loading ? (
        <div style={styles.loadingGrid}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="shimmer" style={styles.skeletonCard} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={styles.empty}
        >
          <p style={styles.emptyIcon}>✦</p>
          <p style={styles.emptyTitle}>Your wardrobe awaits</p>
          <p style={styles.emptyText}>
            {search ? 'No items match your search.' : 'Start by adding your first piece.'}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)} style={styles.addBtn}>
              <Plus size={14} strokeWidth={2} />
              Add First Piece
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          style={styles.grid}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

const styles = {
  page: { padding: '3rem 4rem', minHeight: '100vh' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
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
  },
  addBtn: {
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
    marginTop: '1rem',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  filterTabs: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  filterTab: {
    background: 'none',
    border: 'none',
    padding: '0.25rem 0',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontWeight: 400,
    paddingBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'color 0.2s',
  },
  count: {
    fontSize: '0.55rem',
    background: 'var(--muted)',
    padding: '1px 5px',
    borderRadius: '999px',
    color: 'var(--ivory-faint)',
  },
  searchWrap: { position: 'relative', minWidth: 260 },
  searchInput: {
    width: '100%',
    background: 'var(--charcoal)',
    border: '1px solid var(--border)',
    color: 'var(--ivory)',
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-body)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1px',
    background: 'var(--border)',
    marginTop: '0.5rem',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1px',
    background: 'var(--border)',
  },
  skeletonCard: {
    aspectRatio: '3/4',
    background: 'var(--charcoal)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '8rem 2rem',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: '2rem', color: 'var(--gold)', opacity: 0.4 },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontStyle: 'italic',
    color: 'var(--ivory-dim)',
  },
  emptyText: { color: 'var(--ivory-faint)', fontSize: '0.85rem' },
}
