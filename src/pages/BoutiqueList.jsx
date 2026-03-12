import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { createListing, uploadListingImage, BRANDS, CONDITIONS, CATEGORIES } from '../lib/boutique'
import { useAuth } from '../lib/auth'
import { X, Upload, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BoutiqueList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    brand: '',
    category: '',
    size: '',
    condition: '',
    price: '',
    description: '',
  })

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const onDrop = useCallback(async (acceptedFiles) => {
    if (images.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 images', { className: 'toast-royal' })
      return
    }
    setUploading(true)
    try {
      const sellerId = user?.id || 'demo'
      const urls = await Promise.all(acceptedFiles.map(f => uploadListingImage(f, sellerId)))
      setImages(prev => [...prev, ...urls])
    } catch (e) {
      toast.error('Image upload failed — please try again', { className: 'toast-royal' })
    } finally {
      setUploading(false)
    }
  }, [images, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 10_000_000,
  })

  const handleSubmit = async () => {
    if (!form.title || !form.brand || !form.category || !form.condition || !form.price) {
      toast.error('Please fill in all required fields', { className: 'toast-royal' })
      return
    }
    if (images.length === 0) {
      toast.error('Please add at least one image', { className: 'toast-royal' })
      return
    }
    setSaving(true)
    try {
      const listing = await createListing({
        seller_id: user?.id || 'demo',
        title: form.title,
        brand: form.brand,
        category: form.category,
        size: form.size,
        condition: form.condition,
        price: parseFloat(form.price),
        description: form.description,
        images,
        status: 'active',
        is_exclusive: true,
      })
      toast.success('Your piece is now listed ♛', { className: 'toast-royal' })
      navigate(`/boutique/${listing.id}`)
    } catch (e) {
      toast.error(e.message || 'Failed to list item', { className: 'toast-royal' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '3rem 4rem 6rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem' }}>
          Private Boutique
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--ivory)', fontWeight: 300 }}>
          List Your Piece
        </h1>
        <p style={{ color: 'var(--ivory-faint)', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 500 }}>
          Every listing is exclusively available to Kathy Atelier members. Your buyer's payment is held in escrow until delivery is confirmed.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* Left — Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <p className="section-label" style={{ marginBottom: '1rem' }}>Images (up to 5)</p>

          {/* Image grid */}
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', background: 'var(--charcoal)' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', bottom: '0.3rem', left: '0.3rem',
                      background: 'rgba(8,8,8,0.8)', padding: '0.1rem 0.4rem',
                      fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase'
                    }}>Cover</div>
                  )}
                  <button
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute', top: '0.3rem', right: '0.3rem',
                      background: 'rgba(8,8,8,0.8)', border: 'none', cursor: 'pointer',
                      width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ivory)',
                    }}
                  >
                    <X size={11} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Dropzone */}
          {images.length < 5 && (
            <div {...getRootProps()} style={{
              border: `1px dashed ${isDragActive ? 'var(--gold)' : 'var(--border)'}`,
              background: isDragActive ? 'rgba(201,168,76,0.04)' : 'var(--charcoal)',
              padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <input {...getInputProps()} />
              {uploading ? (
                <p style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>Uploading…</p>
              ) : (
                <>
                  <Upload size={24} strokeWidth={1} style={{ color: 'var(--ivory-faint)', marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--ivory-dim)', marginBottom: '0.25rem' }}>
                    {isDragActive ? 'Drop here' : 'Drag photos or click to browse'}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--ivory-faint)' }}>JPG, PNG · max 10MB each</p>
                </>
              )}
            </div>
          )}

          {/* Photography tip */}
          <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'var(--charcoal)', borderLeft: '2px solid var(--gold)' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Photography tip</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--ivory-faint)', lineHeight: 1.6 }}>
              Shoot on a plain white or neutral background. Include close-ups of brand labels, hardware, and any wear. Natural light sells.
            </p>
          </div>
        </motion.div>

        {/* Right — Details form */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Neverfull MM in Damier Ebene" style={inputStyle} />
          </div>

          {/* Brand */}
          <div>
            <label style={labelStyle}>Brand *</label>
            <div style={{ position: 'relative' }}>
              <select value={form.brand} onChange={set('brand')} style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem' }}>
                <option value="">Select brand</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ivory-faint)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Category + Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <div style={{ position: 'relative' }}>
                <select value={form.category} onChange={set('category')} style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem' }}>
                  <option value="">Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} strokeWidth={1.5} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ivory-faint)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Size</label>
              <input value={form.size} onChange={set('size')} placeholder="XS / 36 / One size" style={inputStyle} />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label style={labelStyle}>Condition *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {CONDITIONS.map(c => (
                <label key={c.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: form.condition === c.value ? 'var(--gold-glow)' : 'var(--charcoal)',
                  border: `1px solid ${form.condition === c.value ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input type="radio" name="condition" value={c.value} checked={form.condition === c.value}
                    onChange={set('condition')} style={{ marginTop: '0.15rem', accentColor: 'var(--gold)' }} />
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ivory)', fontWeight: 400 }}>{c.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ivory-faint)' }}>{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={labelStyle}>Asking Price (EUR) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ivory-faint)', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>€</span>
              <input type="number" value={form.price} onChange={set('price')} placeholder="0"
                style={{ ...inputStyle, paddingLeft: '2rem' }} min="0" step="1" />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--ivory-faint)', marginTop: '0.35rem' }}>
              Platform fee: 8% · You receive {form.price ? `€${Math.round(parseFloat(form.price) * 0.92).toLocaleString('de-DE')}` : '—'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={set('description')}
              rows={4} placeholder="Provenance, purchase history, reason for selling, any notable details…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="btn-royal"
            style={{ marginTop: '0.5rem', fontSize: '0.75rem', letterSpacing: '0.16em', padding: '1.1rem' }}
          >
            {saving ? 'Listing…' : '♛ Publish to Boutique'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--stone)', lineHeight: 1.6 }}>
            By listing, you agree that all details are accurate and that you own the item described. Buyer payment is held in escrow until delivery is confirmed.
          </p>
        </motion.div>
      </div>

      {/* Mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"][style*="gap: '3rem'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--ivory-faint)', marginBottom: '0.4rem', fontFamily: 'var(--font-body)',
}

const inputStyle = {
  width: '100%', background: 'var(--charcoal)', border: '1px solid var(--border)',
  color: 'var(--ivory)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
  fontWeight: 300, padding: '0.75rem 1rem', borderRadius: 0,
  outline: 'none',
}
