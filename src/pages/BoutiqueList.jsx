import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { createListing, uploadListingImage, BRANDS, CONDITIONS, CATEGORIES } from '../lib/boutique'
import { useAuth } from '../lib/auth'
import { X, Upload, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

// Smart size options per category
const SIZE_OPTIONS = {
  Bags:        ['One Size'],
  Shoes:       ['35','35.5','36','36.5','37','37.5','38','38.5','39','39.5','40','40.5','41','42','43','44'],
  Accessories: ['One Size','XS/S','M/L'],
  Jewellery:   ['One Size','Ring size 48','Ring size 50','Ring size 52','Ring size 54','Ring size 56','Ring size 58'],
  Scarves:     ['One Size','Small','Large'],
  default:     ['XXS','XS','S','M','L','XL','XXL','34','36','38','40','42','44','46','48','One Size'],
}

function getSizes(category) {
  return SIZE_OPTIONS[category] || SIZE_OPTIONS.default
}

export default function BoutiqueList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '', brand: '', category: '', size: '', condition: '', price: '', description: '',
  })

  const set = (k) => (e) => {
    const val = e.target.value
    setForm(prev => {
      // Reset size when category changes
      if (k === 'category') return { ...prev, category: val, size: '' }
      return { ...prev, [k]: val }
    })
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (images.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 images', { className: 'toast-royal' }); return
    }
    setUploading(true)
    try {
      const urls = await Promise.all(acceptedFiles.map(f => uploadListingImage(f, user?.id || 'demo')))
      setImages(prev => [...prev, ...urls])
    } catch {
      toast.error('Upload failed — please try again', { className: 'toast-royal' })
    } finally { setUploading(false) }
  }, [images, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 10_000_000,
  })

  const handleSubmit = async () => {
    if (!form.title || !form.brand || !form.category || !form.condition || !form.price) {
      toast.error('Please fill in all required fields', { className: 'toast-royal' }); return
    }
    if (images.length === 0) {
      toast.error('Please add at least one image', { className: 'toast-royal' }); return
    }
    setSaving(true)
    try {
      const listing = await createListing({
        seller_id: user?.id || 'demo',
        title: form.title, brand: form.brand, category: form.category,
        size: form.size, condition: form.condition,
        price: parseFloat(form.price), description: form.description,
        images, status: 'active', is_exclusive: true,
      })
      toast.success('Your piece is now listed ♛', { className: 'toast-royal' })
      navigate(`/boutique/${listing.id}`)
    } catch (e) {
      toast.error(e.message || 'Failed to list — please try again', { className: 'toast-royal' })
    } finally { setSaving(false) }
  }

  const sizes = getSizes(form.category)
  const sellerTake = form.price ? `€${Math.round(parseFloat(form.price) * 0.92).toLocaleString('de-DE')}` : '—'

  return (
    <div className="boutique-list-page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.6rem' }}>
          Private Boutique
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: 'var(--ivory)', fontWeight: 300 }}>
          List Your Piece
        </h1>
        <p style={{ color: 'var(--ivory-faint)', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 480 }}>
          Exclusively available to Kathy Atelier members. Buyer payment held in escrow until delivery confirmed.
        </p>
      </motion.div>

      <div className="boutique-list-grid">

        {/* ── Left: Images ── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <p className="section-label" style={{ marginBottom: '0.875rem' }}>Images (up to 5)</p>

          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.625rem' }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', background: 'var(--charcoal)', overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(8,8,8,0.85)', padding: '0.1rem 0.4rem', fontSize: '0.52rem', letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                      Cover
                    </div>
                  )}
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(8,8,8,0.85)', border: 'none', cursor: 'pointer', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ivory)' }}>
                    <X size={11} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <div {...getRootProps()} style={{
              border: `1px dashed ${isDragActive ? 'var(--gold)' : 'var(--border)'}`,
              background: isDragActive ? 'rgba(201,168,76,0.05)' : 'var(--charcoal)',
              padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <input {...getInputProps()} />
              {uploading
                ? <p style={{ color: 'var(--gold)', fontSize: '0.82rem' }}>Uploading…</p>
                : <>
                  <Upload size={22} strokeWidth={1} style={{ color: 'var(--ivory-faint)', marginBottom: '0.6rem' }} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--ivory-dim)', marginBottom: '0.2rem' }}>
                    {isDragActive ? 'Drop here' : 'Drag photos or tap to browse'}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--ivory-faint)' }}>JPG · PNG · max 10MB</p>
                </>
              }
            </div>
          )}

          <div style={{ marginTop: '1rem', padding: '0.875rem 1.125rem', background: 'var(--charcoal)', borderLeft: '2px solid var(--gold)' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Photography tip</p>
            <p style={{ fontSize: '0.74rem', color: 'var(--ivory-faint)', lineHeight: 1.6 }}>
              Plain white background, natural light. Include brand label, hardware, and any wear details.
            </p>
          </div>
        </motion.div>

        {/* ── Right: Form ── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

          {/* Title */}
          <div>
            <label style={L}>Title *</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Neverfull MM in Damier Ebène" style={I} />
          </div>

          {/* Brand */}
          <div>
            <label style={L}>Brand *</label>
            <div style={{ position: 'relative' }}>
              <select value={form.brand} onChange={set('brand')} style={{ ...I, appearance: 'none', paddingRight: '2.5rem' }}>
                <option value="">Select brand</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} style={chevron} />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={L}>Category *</label>
            <div style={{ position: 'relative' }}>
              <select value={form.category} onChange={set('category')} style={{ ...I, appearance: 'none', paddingRight: '2.5rem' }}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} style={chevron} />
            </div>
          </div>

          {/* Size — dropdown, smart options */}
          <div>
            <label style={L}>Size</label>
            <div style={{ position: 'relative' }}>
              <select value={form.size} onChange={set('size')} style={{ ...I, appearance: 'none', paddingRight: '2.5rem' }}
                disabled={!form.category}>
                <option value="">{form.category ? 'Select size' : 'Select category first'}</option>
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} style={{ ...chevron, opacity: form.category ? 1 : 0.4 }} />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label style={L}>Condition *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {CONDITIONS.map(c => (
                <label key={c.value} onClick={() => setForm(prev => ({ ...prev, condition: c.value }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem 1rem', cursor: 'pointer',
                    background: form.condition === c.value ? 'rgba(201,168,76,0.08)' : 'var(--charcoal)',
                    border: `1px solid ${form.condition === c.value ? 'rgba(201,168,76,0.45)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                  {/* Custom radio dot */}
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `1px solid ${form.condition === c.value ? 'var(--gold)' : 'var(--ivory-faint)'}`,
                    background: form.condition === c.value ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {form.condition === c.value && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--obsidian)' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ivory)', fontWeight: 400, lineHeight: 1.2 }}>{c.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ivory-faint)', marginTop: '0.1rem' }}>{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={L}>Asking Price (EUR) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ivory-faint)', fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>€</span>
              <input type="number" value={form.price} onChange={set('price')} placeholder="0"
                style={{ ...I, paddingLeft: '1.75rem' }} min="0" step="1" />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--ivory-faint)', marginTop: '0.3rem' }}>
              8% platform fee · You receive <strong style={{ color: 'var(--ivory-dim)' }}>{sellerTake}</strong>
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={L}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              placeholder="Provenance, purchase history, reason for selling, any notable details…"
              style={{ ...I, resize: 'vertical', lineHeight: 1.7 }} />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={saving || uploading} className="btn-royal"
            style={{ fontSize: '0.75rem', letterSpacing: '0.16em', padding: '1.1rem', marginTop: '0.25rem' }}>
            {saving ? 'Publishing…' : '♛ Publish to Boutique'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--stone)', lineHeight: 1.6 }}>
            By listing you confirm all details are accurate and you own this item. Buyer funds held in escrow until delivery confirmed.
          </p>
        </motion.div>
      </div>

      <style>{`
        .boutique-list-page {
          min-height: 100vh;
          padding: 3rem 4rem 6rem;
          max-width: 940px;
          margin: 0 auto;
        }
        .boutique-list-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .boutique-list-page {
            padding: 1.75rem 1.25rem 5rem;
          }
          .boutique-list-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  )
}

const L = {
  display: 'block', fontSize: '0.62rem', letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'var(--ivory-faint)',
  marginBottom: '0.4rem', fontFamily: 'var(--font-body)',
}

const I = {
  width: '100%', background: 'var(--charcoal)', border: '1px solid var(--border)',
  color: 'var(--ivory)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
  fontWeight: 300, padding: '0.75rem 1rem', borderRadius: 0, outline: 'none',
}

const chevron = {
  position: 'absolute', right: '1rem', top: '50%',
  transform: 'translateY(-50%)', color: 'var(--ivory-faint)', pointerEvents: 'none',
}
