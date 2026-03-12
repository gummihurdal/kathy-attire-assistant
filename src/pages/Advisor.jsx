import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { analyseWardrobe, OCCASION_ICONS, OCCASION_COLORS } from '../lib/styleAdvisor'
import { getWardrobeItems } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const OCCASION_FILTERS = ['All', 'School', 'Weekend', 'Sport', 'Party', 'Cosy Day', 'Date', 'Evening Out']


const LOADING_STEPS = [
  { icon: '👗', text: 'Cataloguing your pieces…', ms: 0 },
  { icon: '🎨', text: 'Analysing your colour palette…', ms: 3500 },
  { icon: '✦', text: 'Finding the best combinations…', ms: 8000 },
  { icon: '📅', text: 'Matching outfits to occasions…', ms: 13000 },
  { icon: '♛', text: 'Writing your style report…', ms: 18000 },
]

function AdvisorLoading() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timers = LOADING_STEPS.slice(1).map((s, i) =>
      setTimeout(() => setStep(i + 1), s.ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [])
  const current = LOADING_STEPS[step]
  return (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '3rem', display: 'inline-block', marginBottom: '2rem' }}>✦</motion.div>
      <AnimatePresence mode="wait">
        <motion.p key={step}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          style={{ color: 'var(--ivory)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          {current.icon} {current.text}
        </motion.p>
      </AnimatePresence>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {LOADING_STEPS.map((s, i) => (
          <motion.div key={i}
            animate={{ background: i <= step ? 'var(--gold)' : 'rgba(255,255,255,0.1)', scale: i === step ? 1.3 : 1 }}
            transition={{ duration: 0.3 }}
            style={{ width: 8, height: 8, borderRadius: '50%' }} />
        ))}
      </div>
      <div style={{ width: 200, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${((step + 1) / LOADING_STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))', position: 'absolute', left: 0 }} />
      </div>
      <p style={{ color: 'var(--stone)', fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', marginTop: '1.25rem', letterSpacing: '0.08em' }}>
        This takes about 20–30 seconds
      </p>
    </motion.div>
  )
}

export default function Advisor() {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedOccasion, setSelectedOccasion] = useState('All')
  const [expandedOutfit, setExpandedOutfit] = useState(null)
  const [wardrobeItems, setWardrobeItems] = useState([])

  async function runAnalysis() {
    setLoading(true)
    setPhase('loading')
    try {
      const items = await getWardrobeItems(user?.id || "demo")
      setWardrobeItems(items)
      if (items.length < 3) {
        alert('Add at least 3 items to your wardrobe first!')
        setPhase('idle')
        setLoading(false)
        return
      }
      const result = await analyseWardrobe(items)
      setAnalysis(result)
      setPhase('done')
    } catch (e) {
      console.error(e)
      setErrorMsg(e.message || 'Something went wrong — please try again')
      setPhase('error')
      setLoading(false)
    }
  }

  const filteredOutfits = analysis?.outfit_suggestions?.filter(o =>
    selectedOccasion === 'All' || o.occasion === selectedOccasion
  ) ?? []

  // Map item IDs back to wardrobe items
  function getItemsForOutfit(outfit) {
    return outfit.item_ids.map(id => wardrobeItems.find(w => w.id === id)).filter(Boolean)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingTop: '80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✦</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3rem)', color: 'var(--ivory)', fontWeight: 300, marginBottom: '0.75rem' }}>
            Style Advisor
          </h1>
          <p style={{ color: 'var(--gold)', fontFamily: 'Jost, sans-serif', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Discover your best outfit combinations
          </p>
        </motion.div>

        {/* Idle state — CTA */}
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👗</div>
              <p style={{ color: 'var(--stone)', fontFamily: 'Jost, sans-serif', marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem', lineHeight: 1.7 }}>
                Kat will analyse everything in your wardrobe and show you the best outfit combinations — what goes with what, and why.
              </p>
              <button onClick={runAnalysis} className="btn-royal" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
                ✦ Analyse My Wardrobe
              </button>
              <p style={{ marginTop: '1.5rem', color: 'var(--ivory-faint)', fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                For personalised advice,{' '}
                <Link to="/profile" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>set your body profile</Link>
                {' '}first.
              </p>
            </motion.div>
          )}

          {/* Loading */}
          {phase === 'loading' && <AdvisorLoading />}

          {/* Error */}
          {phase === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</p>
              <p style={{ color: 'var(--ivory)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                Something went wrong
              </p>
              <p style={{ color: 'var(--stone)', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem', marginBottom: '2rem', maxWidth: 320, margin: '0 auto 2rem' }}>
                {errorMsg}
              </p>
              <button onClick={runAnalysis} className="btn-royal" style={{ fontSize: '0.9rem', padding: '0.875rem 2rem' }}>
                ↺ Try Again
              </button>
            </motion.div>
          )}

          {/* Results */}
          {phase === 'done' && analysis && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Score + Summary */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--charcoal)', border: '1px solid var(--gold)', borderRadius: 12, padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Score ring */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', border: `4px solid var(--gold)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                    <span style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 600, lineHeight: 1 }}>{analysis.wardrobe_score}</span>
                    <span style={{ color: 'var(--stone)', fontSize: '0.65rem', fontFamily: 'Jost', letterSpacing: '0.05em' }}>/ 100</span>
                  </div>
                  <div style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{analysis.score_label}</div>
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ color: 'var(--ivory)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '1rem' }}>{analysis.summary}</p>
                  {/* Color palette dots */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--stone)', fontFamily: 'Jost', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your palette:</span>
                    {(analysis.color_palette || []).map((c, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>{c}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Strengths + Gaps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  style={{ background: 'var(--charcoal)', border: '1px solid rgba(122,158,126,0.4)', borderRadius: 12, padding: '1.5rem' }}>
                  <div style={{ color: '#7a9e7e', fontFamily: 'Jost', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>✓ Wardrobe Strengths</div>
                  {(analysis.strengths || []).map((s, i) => (
                    <div key={i} style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.9rem', marginBottom: '0.4rem', paddingLeft: '0.5rem', borderLeft: '2px solid #7a9e7e' }}>{s}</div>
                  ))}
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  style={{ background: 'var(--charcoal)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '1.5rem' }}>
                  <div style={{ color: 'var(--gold)', fontFamily: 'Jost', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>✦ What to Add Next</div>
                  {(analysis.wishlist || []).map((w, i) => (
                    <div key={i} style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.9rem', marginBottom: '0.4rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--gold)' }}>{w}</div>
                  ))}
                </motion.div>
              </div>

              {/* Outfit suggestions */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--ivory)', fontSize: '1.6rem', fontWeight: 300, marginBottom: '1rem' }}>
                  Outfit Combinations
                </h2>

                {/* Occasion filter */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {OCCASION_FILTERS.map(occ => (
                    <button key={occ} onClick={() => setSelectedOccasion(occ)}
                      style={{ background: selectedOccasion === occ ? 'var(--gold)' : 'var(--charcoal)', color: selectedOccasion === occ ? 'var(--obsidian)' : 'var(--stone)', border: `1px solid ${selectedOccasion === occ ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '0.35rem 0.9rem', fontFamily: 'Jost', fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s' }}>
                      {OCCASION_ICONS[occ] || ''} {occ}
                    </button>
                  ))}
                </div>

                {/* Outfit cards */}
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <AnimatePresence>
                    {filteredOutfits.map((outfit, i) => {
                      const items = getItemsForOutfit(outfit)
                      const isExpanded = expandedOutfit === outfit.id
                      const occasionColor = OCCASION_COLORS[outfit.occasion] || '#b0956e'

                      return (
                        <motion.div key={outfit.id}
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: i * 0.06 }}
                          style={{ background: 'var(--charcoal)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
                          onClick={() => setExpandedOutfit(isExpanded ? null : outfit.id)}>

                          {/* Card header */}
                          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Occasion badge */}
                            <div style={{ background: `${occasionColor}22`, border: `1px solid ${occasionColor}66`, borderRadius: 8, padding: '0.35rem 0.7rem', flexShrink: 0 }}>
                              <div style={{ color: occasionColor, fontFamily: 'Jost', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {OCCASION_ICONS[outfit.occasion] || '✦'} {outfit.occasion}
                              </div>
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ color: 'var(--ivory)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 500 }}>{outfit.name}</div>
                              <div style={{ color: 'var(--stone)', fontFamily: 'Jost', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                {outfit.item_names?.join(' · ')}
                              </div>
                            </div>

                            {/* Confidence */}
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                              <div style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem' }}>{outfit.confidence}%</div>
                              <div style={{ color: 'var(--stone)', fontFamily: 'Jost', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>match</div>
                            </div>

                            <div style={{ color: 'var(--stone)', fontSize: '1rem', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</div>
                          </div>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ padding: '1.5rem', display: 'grid', gap: '1.25rem' }}>

                                  {/* Item photos */}
                                  {items.length > 0 && (
                                    <div>
                                      <div style={{ color: 'var(--stone)', fontFamily: 'Jost', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Items in this outfit</div>
                                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {items.map(item => (
                                          <div key={item.id} style={{ textAlign: 'center', width: 80 }}>
                                            <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: 'var(--obsidian)', marginBottom: '0.35rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                              {item.image_url && !item.image_url.startsWith('data:') ? (
                                                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                              ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)', fontSize: '1.5rem' }}>👕</div>
                                              )}
                                            </div>
                                            <div style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.7rem', lineHeight: 1.3 }}>{item.name}</div>
                                          </div>
                                        ))}
                                        {/* Fallback: show names for items without wardrobe match */}
                                        {outfit.item_names?.filter((_, i) => !items[i]).map((name, i) => (
                                          <div key={`name-${i}`} style={{ textAlign: 'center', width: 80 }}>
                                            <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--obsidian)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)', fontSize: '1.5rem', marginBottom: '0.35rem' }}>✦</div>
                                            <div style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.7rem', lineHeight: 1.3 }}>{name}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                      <div style={{ color: 'var(--gold)', fontFamily: 'Jost', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>How to wear it</div>
                                      <p style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.88rem', lineHeight: 1.65 }}>{outfit.description}</p>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--gold)', fontFamily: 'Jost', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Why it works</div>
                                      <p style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.88rem', lineHeight: 1.65 }}>{outfit.why_it_works}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Styling tips */}
              {analysis.styling_tips?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ background: 'var(--charcoal)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ color: 'var(--gold)', fontFamily: 'Jost', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>✦ Kat's Styling Tips</div>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {analysis.styling_tips.map((tip, i) => (
                      <div key={i} style={{ color: 'var(--ivory)', fontFamily: 'Jost', fontSize: '0.9rem', display: 'flex', gap: '0.75rem', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✦</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Re-analyse button */}
              <div style={{ textAlign: 'center' }}>
                <button onClick={runAnalysis} disabled={loading}
                  style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 8, padding: '0.75rem 2rem', fontFamily: 'Jost', fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ↺ Refresh Analysis
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
