import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Sparkles, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../lib/auth'
import { uploadClothingImage, saveWardrobeItem } from '../../lib/supabase'
import { analyzeClothingItem } from '../../lib/claude'

const CATEGORIES = [
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
  'bags', 'accessories', 'activewear',
]

const COLORS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f0e8' },
  { name: 'Cream', hex: '#e8dcc8' },
  { name: 'Navy', hex: '#1a2744' },
  { name: 'Beige', hex: '#c8b89a' },
  { name: 'Brown', hex: '#6b4c2a' },
  { name: 'Grey', hex: '#7a7a7a' },
  { name: 'Red', hex: '#c0392b' },
  { name: 'Pink', hex: '#d4829e' },
  { name: 'Burgundy', hex: '#722f37' },
  { name: 'Green', hex: '#2d6a4f' },
  { name: 'Olive', hex: '#6b6b3a' },
  { name: 'Blue', hex: '#2e5fa3' },
  { name: 'Sky Blue', hex: '#7ec8e3' },
  { name: 'Purple', hex: '#6b2fa0' },
  { name: 'Yellow', hex: '#d4a843' },
  { name: 'Orange', hex: '#d4672a' },
  { name: 'Gold', hex: '#c9a84c' },
  { name: 'Silver', hex: '#a8a8b0' },
  { name: 'Leopard', hex: '#c8a04a' },
  { name: 'Stripe', hex: '#888888' },
  { name: 'Floral', hex: '#d480aa' },
]

export default function UploadModal({ onClose, onSaved }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    colors: [],
    description: '',
    brand: '',
    season: [],
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))

    // Auto-analyze with Claude
    setAnalyzing(true)
    try {
      const analysis = await analyzeClothingItem(f)
      if (analysis) {
        setForm(prev => ({
          ...prev,
          name: analysis.suggested_name || '',
          category: analysis.category || '',
          colors: analysis.colors || [],
          description: analysis.description || '',
        }))
        toast.success('✦ Analysed by your stylist', { className: 'toast-royal' })
      }
    } catch {
      // silent fail
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const toggleColor = (colorName) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter(c => c !== colorName)
        : [...prev.colors, colorName],
    }))
  }

  const toggleSeason = (s) => {
    setForm(prev => ({
      ...prev,
      season: prev.season.includes(s)
        ? prev.season.filter(x => x !== s)
        : [...prev.season, s],
    }))
  }

  const handleSave = async () => {
    if (!file || !form.name || !form.category) {
      toast.error('Please add a photo, name, and category', { className: 'toast-royal' })
      return
    }
    setSaving(true)
    try {
      const userId = user?.id || 'demo'
      let imageUrl = preview

      if (user) {
        imageUrl = await uploadClothingImage(file, userId)
      }

      const item = await saveWardrobeItem({
        user_id: userId,
        name: form.name,
        category: form.category,
        colors: form.colors,
        description: form.description,
        brand: form.brand,
        season: form.season,
        image_url: imageUrl,
      })

      toast.success(`✦ "${form.name}" added to your wardrobe`, { className: 'toast-royal' })
      onSaved(item)
      onClose()
    } catch (err) {
      toast.error(err.message, { className: 'toast-royal' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={styles.modal}
        >
          {/* Header */}
          <div style={styles.modalHeader}>
            <div>
              <p className="section-label">Add to Wardrobe</p>
              <h2 style={styles.modalTitle}>New Piece</h2>
            </div>
            <button onClick={onClose} style={styles.closeBtn}>
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div style={styles.divider} />

          <div style={styles.body}>
            {/* Left: Upload */}
            <div style={styles.uploadCol}>
              <div
                {...getRootProps()}
                style={{
                  ...styles.dropzone,
                  borderColor: isDragActive ? 'var(--gold)' : 'var(--border)',
                  background: isDragActive ? 'var(--gold-glow)' : 'var(--charcoal)',
                }}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div style={styles.previewWrap}>
                    <img src={preview} alt="preview" style={styles.previewImg} />
                    {analyzing && (
                      <div style={styles.analyzingOverlay}>
                        <Sparkles size={16} color="var(--gold)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Analysing…</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.dropzoneInner}>
                    <Upload size={24} color="var(--ivory-faint)" strokeWidth={1} />
                    <p style={styles.dropText}>
                      {isDragActive ? 'Drop it here' : 'Drop photo here or click to browse'}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ivory-faint)', marginTop: '0.25rem' }}>
                      JPG, PNG, WEBP
                    </p>
                  </div>
                )}
              </div>

              {/* Colors */}
              <div style={{ marginTop: '1.5rem' }}>
                <p className="section-label" style={{ marginBottom: '0.75rem' }}>Colours</p>
                <div style={styles.colorGrid}>
                  {COLORS.map(c => (
                    <button
                      key={c.name}
                      title={c.name}
                      onClick={() => toggleColor(c.name)}
                      style={{
                        ...styles.colorSwatch,
                        background: c.hex,
                        outline: form.colors.includes(c.name) ? '2px solid var(--gold)' : '2px solid transparent',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                {form.colors.length > 0 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--ivory-dim)', marginTop: '0.5rem' }}>
                    {form.colors.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Form */}
            <div style={styles.formCol}>
              <div style={styles.field}>
                <label style={styles.label}>Item Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ivory silk blouse"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Category *</label>
                <div style={styles.tagRow}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`tag ${form.category === cat ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, category: cat }))}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Brand (optional)</label>
                <input
                  value={form.brand}
                  onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                  placeholder="e.g. Zara, H&M, Chanel..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Season</label>
                <div style={styles.tagRow}>
                  {['Spring', 'Summer', 'Autumn', 'Winter', 'All Season'].map(s => (
                    <button
                      key={s}
                      className={`tag ${form.season.includes(s) ? 'active' : ''}`}
                      onClick={() => toggleSeason(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Any notes about fit, styling, or occasion…"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? (
                  <><Loader size={14} className="spin" /> Saving…</>
                ) : (
                  '✦  Add to Wardrobe'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '1rem',
  },
  modal: {
    background: 'var(--onyx)',
    border: '1px solid var(--border)',
    width: '100%',
    maxWidth: 800,
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
  },
  modalHeader: {
    padding: '2rem 2rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 400,
    fontStyle: 'italic',
    marginTop: '0.25rem',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--ivory-faint)',
    cursor: 'pointer',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.2s, color 0.2s',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
    margin: '0 2rem',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '2rem',
    padding: '2rem',
  },
  uploadCol: {},
  formCol: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  dropzone: {
    border: '1px dashed',
    borderRadius: '2px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    minHeight: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dropzoneInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    textAlign: 'center',
  },
  dropText: {
    fontSize: '0.8rem',
    color: 'var(--ivory-dim)',
    fontWeight: 300,
  },
  previewWrap: {
    width: '100%',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    display: 'block',
  },
  analyzingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    border: 'none',
    cursor: 'pointer',
    borderRadius: '1px',
    transition: 'outline 0.15s',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: {
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ivory-faint)',
    fontWeight: 400,
  },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  saveBtn: {
    marginTop: '0.5rem',
    background: 'var(--gold)',
    color: 'var(--obsidian)',
    border: 'none',
    padding: '0.875rem 2rem',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'center',
  },
}
