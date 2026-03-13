import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'

const ADMIN_EMAILS = ['gudmundur.thordarson@snb.ch', 'gudmundur.thordarson@zoho.com', 'gth276@gmail.com', 'gudmundur765@gmail.com']

const BODY_SHAPES = [
  {
    key: 'hourglass',
    label: 'Hourglass',
    icon: '⧗',
    desc: 'Balanced shoulders & hips, defined waist',
    tips: ['Wrap dresses', 'Belted coats', 'High-waist jeans', 'Fitted tops'],
    avoid: ['Boxy shapes', 'Oversized everything'],
  },
  {
    key: 'pear',
    label: 'Pear',
    icon: '◉',
    desc: 'Hips wider than shoulders',
    tips: ['A-line skirts', 'Off-shoulder tops', 'Wide-leg trousers', 'Statement jackets'],
    avoid: ['Tight skirts', 'Heavy prints on hips'],
  },
  {
    key: 'apple',
    label: 'Apple',
    icon: '◎',
    desc: 'Fuller through the middle, great legs',
    tips: ['Empire waist', 'V-necks', 'Flowy tops', 'Straight-leg trousers'],
    avoid: ['Tight waistbands', 'Cropped tops'],
  },
  {
    key: 'rectangle',
    label: 'Rectangle',
    icon: '▭',
    desc: 'Shoulders, waist & hips similar width',
    tips: ['Peplum tops', 'Ruffles', 'Layering', 'Belted styles to create curves'],
    avoid: ['Shapeless shift dresses'],
  },
  {
    key: 'inverted_triangle',
    label: 'Inverted Triangle',
    icon: '▽',
    desc: 'Broader shoulders, narrower hips',
    tips: ['Wide-leg jeans', 'A-line skirts', 'Prints on bottom', 'Low-rise styles'],
    avoid: ['Padded shoulders', 'Boat necks'],
  },
]

const HEIGHTS = [
  { key: 'petite', label: 'Petite', sub: 'Under 163 cm' },
  { key: 'average', label: 'Average', sub: '163–173 cm' },
  { key: 'tall', label: 'Tall', sub: 'Over 173 cm' },
]

const EMPHASISE = [
  { key: 'waist', label: 'Waist', icon: '✦' },
  { key: 'legs', label: 'Legs', icon: '◇' },
  { key: 'shoulders', label: 'Shoulders', icon: '◈' },
  { key: 'bust', label: 'Bust', icon: '○' },
  { key: 'hips', label: 'Hips', icon: '◉' },
]

const AVOID = [
  { key: 'tight_fits', label: 'Tight fits' },
  { key: 'short_skirts', label: 'Short skirts' },
  { key: 'low_cut', label: 'Low necklines' },
  { key: 'bright_colours', label: 'Bright colours' },
  { key: 'loud_prints', label: 'Loud prints' },
  { key: 'cropped_tops', label: 'Cropped tops' },
]

const LS_KEY = 'kathy_style_profile'

export function getStyleProfile() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {} } catch { return {} }
  })
  const [saved, setSaved] = useState(false)

  function update(key, val) {
    setProfile(p => ({ ...p, [key]: val }))
    setSaved(false)
  }

  function toggleArr(key, val) {
    setProfile(p => {
      const arr = p[key] || []
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
    setSaved(false)
  }

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(profile))
    setSaved(true)
    toast.success('✦ Style profile saved — AI will use this for all recommendations', { className: 'toast-royal', duration: 4000 })
  }

  const selectedShape = BODY_SHAPES.find(s => s.key === profile.body_shape)

  return (
    <div style={P.page}>
      <div style={P.header}>
        <p className="section-label">Personal Style</p>
        <h1 style={P.title}>Style Profile</h1>
        <span className="gold-line" />
        {user && ADMIN_EMAILS.includes(user.email) && (
          <Link to="/admin" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', border: '1px solid var(--gold-dark)', padding: '0.35rem 0.875rem' }}>
            ♛ Admin Dashboard
          </Link>
        )}
        <p style={P.subtitle}>
          Tell Kat about your body — every outfit recommendation will be tailored to flatter you.
        </p>
      </div>

      {/* ── Body Shape ── */}
      <section style={P.section}>
        <p className="section-label" style={{ marginBottom: '1.25rem' }}>Body Shape</p>
        <div style={P.shapeGrid}>
          {BODY_SHAPES.map(shape => (
            <motion.button
              key={shape.key}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => update('body_shape', shape.key)}
              style={{
                ...P.shapeCard,
                borderColor: profile.body_shape === shape.key ? 'var(--gold)' : 'var(--border)',
                background: profile.body_shape === shape.key ? 'var(--gold-glow)' : 'var(--charcoal)',
              }}
            >
              <span style={{ ...P.shapeIcon, color: profile.body_shape === shape.key ? 'var(--gold)' : 'var(--ivory-faint)' }}>
                {shape.icon}
              </span>
              <span style={{ ...P.shapeLabel, color: profile.body_shape === shape.key ? 'var(--ivory)' : 'var(--ivory-dim)' }}>
                {shape.label}
              </span>
              <span style={P.shapeDesc}>{shape.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* Shape tips */}
        <AnimatePresence>
          {selectedShape && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={P.shapeTips}>
                <div style={P.tipCol}>
                  <p style={P.tipTitle}>✦ Works great for you</p>
                  {selectedShape.tips.map(t => (
                    <p key={t} style={P.tipItem}>— {t}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="divider" />

      {/* ── Height ── */}
      <section style={P.section}>
        <p className="section-label" style={{ marginBottom: '1.25rem' }}>Height</p>
        <div style={P.heightRow}>
          {HEIGHTS.map(h => (
            <button
              key={h.key}
              onClick={() => update('height', h.key)}
              style={{
                ...P.heightBtn,
                borderColor: profile.height === h.key ? 'var(--gold)' : 'var(--border)',
                background: profile.height === h.key ? 'var(--gold-glow)' : 'transparent',
                color: profile.height === h.key ? 'var(--gold)' : 'var(--ivory-dim)',
              }}
            >
              <span style={P.heightLabel}>{h.label}</span>
              <span style={P.heightSub}>{h.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Emphasise ── */}
      <section style={P.section}>
        <p className="section-label" style={{ marginBottom: '0.5rem' }}>What to Emphasise</p>
        <p style={P.sectionSub}>Choose the features you love and want to show off</p>
        <div style={P.tagRow}>
          {EMPHASISE.map(e => {
            const active = (profile.emphasise || []).includes(e.key)
            return (
              <button
                key={e.key}
                onClick={() => toggleArr('emphasise', e.key)}
                style={{ ...P.tag, borderColor: active ? 'var(--gold)' : 'var(--border)', color: active ? 'var(--gold)' : 'var(--ivory-dim)', background: active ? 'var(--gold-glow)' : 'transparent' }}
              >
                {e.icon} {e.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ── Avoid ── */}
      <section style={P.section}>
        <p className="section-label" style={{ marginBottom: '0.5rem' }}>What to Avoid</p>
        <p style={P.sectionSub}>Kat will never suggest these for you</p>
        <div style={P.tagRow}>
          {AVOID.map(a => {
            const active = (profile.avoid || []).includes(a.key)
            return (
              <button
                key={a.key}
                onClick={() => toggleArr('avoid', a.key)}
                style={{ ...P.tag, borderColor: active ? 'var(--ivory-faint)' : 'var(--border)', color: active ? 'var(--ivory)' : 'var(--ivory-dim)', background: active ? 'rgba(255,255,255,0.06)' : 'transparent' }}
              >
                {a.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ── Save ── */}
      <div style={P.saveRow}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={save}
          style={P.saveBtn}
        >
          {saved ? '✦ Saved!' : '✦ Save Style Profile'}
        </motion.button>
        {saved && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={P.savedNote}>
            Kat will use this for all outfit recommendations
          </motion.p>
        )}
      </div>
    </div>
  )
}

const P = {
  page: { padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 4rem)', minHeight: '100vh', maxWidth: 800, margin: '0 auto' },
  header: { marginBottom: '3rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 400, fontStyle: 'italic' },
  subtitle: { color: 'var(--ivory-faint)', fontSize: '0.9rem', fontWeight: 300, maxWidth: 500, marginTop: '0.5rem' },
  section: { padding: '2rem 0' },
  sectionSub: { color: 'var(--ivory-faint)', fontSize: '0.8rem', fontWeight: 300, marginBottom: '1.25rem' },
  shapeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1px', background: 'var(--border)', marginBottom: '1px' },
  shapeCard: { border: 'none', padding: '1.5rem 1rem', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center', transition: 'all 0.2s' },
  shapeIcon: { fontSize: '1.8rem', display: 'block' },
  shapeLabel: { fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 },
  shapeDesc: { fontSize: '0.65rem', color: 'var(--stone)', fontWeight: 300, lineHeight: 1.4 },
  shapeTips: { display: 'grid', gridTemplateColumns: '1fr', gap: '1px', background: 'var(--border)', marginTop: '1px' },
  tipCol: { background: 'var(--charcoal)', padding: '1.25rem' },
  tipTitle: { fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem' },
  tipItem: { fontSize: '0.8rem', color: 'var(--ivory-dim)', marginBottom: '0.35rem', fontWeight: 300 },
  heightRow: { display: 'flex', gap: '1px', background: 'var(--border)' },
  heightBtn: { flex: 1, border: 'none', padding: '1.25rem 1rem', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s' },
  heightLabel: { fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 },
  heightSub: { fontSize: '0.65rem', color: 'var(--stone)', fontWeight: 300 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  tag: { border: '1px solid', padding: '0.5rem 1rem', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' },
  saveRow: { padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' },
  saveBtn: { background: 'var(--gold)', color: 'var(--obsidian)', border: 'none', padding: '1rem 2.5rem', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', alignSelf: 'flex-start' },
  savedNote: { fontSize: '0.8rem', color: 'var(--ivory-faint)', fontStyle: 'italic' },
}
