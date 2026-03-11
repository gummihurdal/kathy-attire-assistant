import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'
import { getWardrobeItems, deleteWardrobeItem, saveWardrobeItem } from '../lib/supabase'
import ItemCard from '../components/Wardrobe/ItemCard'
import UploadModal from '../components/Wardrobe/UploadModal'

const CATEGORIES = ['All', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories', 'activewear']

export default function Wardrobe() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => { loadItems() }, [user])

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await getWardrobeItems(user?.id || 'demo')
      setItems(data)
    } catch (err) {
      toast.error('Could not load wardrobe', { className: 'toast-royal' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item) => {
    try {
      await deleteWardrobeItem(item.id, item.image_url)
      setItems(prev => prev.filter(i => i.id !== item.id))
      toast.success(`"${item.name}" removed`, { className: 'toast-royal' })
    } catch {
      toast.error('Could not remove item', { className: 'toast-royal' })
    }
  }

  const handleSaved = (newItem) => {
    setItems(prev => [newItem, ...prev])
  }

  const filtered = items.filter(item => {
    const matchCat = filter === 'All' || item.category === filter
    const matchSearch = !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.colors?.some(c => c.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

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
            {!user && <span style={{ color: 'var(--gold)', marginLeft: '0.75rem', fontSize: '0.75rem' }}>— Demo Mode</span>}
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
            <button key={cat} onClick={() => setFilter(cat)} style={{
              ...styles.filterTab,
              color: filter === cat ? 'var(--gold)' : 'var(--ivory-faint)',
              borderBottom: filter === cat ? '1px solid var(--gold)' : '1px solid transparent',
            }}>
              {cat}
              <span style={styles.count}>{cat === 'All' ? items.length : (counts[cat] || 0)}</span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search size={13} color="var(--ivory-faint)" strokeWidth={1.5}
            style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, colour, brand…"
            style={{ paddingLeft: '2.5rem', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      <div className="divider" style={{ margin: '0.5rem 0' }} />

      {/* Grid */}
      {loading ? (
        <div style={styles.grid}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="shimmer" style={{ aspectRatio: '3/4' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.empty}>
          <p style={{ fontSize: '2.5rem', opacity: 0.2 }}>✦</p>
          <p style={styles.emptyTitle}>{search ? 'No matches found' : 'Your wardrobe awaits'}</p>
          <p style={styles.emptyText}>
            {search ? `No items match "${search}"` : 'Start by photographing your first piece.'}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)} style={{ ...styles.addBtn, marginTop: '1rem' }}>
              <Plus size={14} strokeWidth={2} /> Add First Piece
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div layout style={styles.grid}>
          <AnimatePresence mode="popLayout">
            {filtered.map(item => (
              <ItemCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

const styles = {
  page: { padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 4rem)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 400, fontStyle: 'italic' },
  subtitle: { color: 'var(--ivory-faint)', fontSize: '0.85rem', fontWeight: 300 },
  addBtn: {
    background: 'var(--gold)', color: 'var(--obsidian)', border: 'none',
    padding: '0.75rem 1.5rem', fontSize: '0.7rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.5rem',
    flexShrink: 0, marginTop: '1rem',
  },
  filterBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' },
  filterTabs: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' },
  filterTab: {
    background: 'none', border: 'none', padding: '0.25rem 0 4px',
    fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 400,
    display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s',
  },
  count: { fontSize: '0.55rem', background: 'var(--muted)', padding: '1px 5px', borderRadius: '999px', color: 'var(--ivory-faint)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1px', background: 'var(--border)',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '0.75rem', padding: '8rem 2rem', textAlign: 'center',
  },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--ivory-dim)' },
  emptyText: { color: 'var(--ivory-faint)', fontSize: '0.85rem' },
}
