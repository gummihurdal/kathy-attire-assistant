import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Camera, Sparkles, Loader, Trash2, Star, Download, ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react'
import { exportStoryCard } from '../lib/storyExport'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth'
import {
  uploadProfilePhoto, saveProfilePhoto, getProfilePhotos,
  deleteProfilePhoto, getWardrobeItems, saveTryOnResult, getTryOnResults
} from '../lib/supabase'
import { selectOutfitForStyle, runFluxTryOn, generateLookImage, STYLES } from '../lib/tryon'

const HAIR_TIPS = {
  sporty: {
    headline: 'Keep it out of the way — but make it cute',
    looks: [
      { name: 'High Ponytail', tip: 'Sleek or slightly messy — instant sporty energy' },
      { name: 'Space Buns', tip: 'Fun, youthful, stays put during movement' },
      { name: 'Sporty Braid', tip: 'Dutch braid or boxer braids — zero fuss, all style' },
    ],
    avoid: 'Loose blow-dried hair — it clashes with the athletic vibe',
  },
  casual: {
    headline: 'Effortless is the goal — undone is perfect',
    looks: [
      { name: 'Messy Bun', tip: 'Pull a few strands out — intentionally imperfect' },
      { name: 'Half-Up Claw Clip', tip: '90s comeback, works with everything casual' },
      { name: 'Loose Waves', tip: 'Air-dry or quick diffuse — relaxed and natural' },
    ],
    avoid: 'Overly structured or stiff styles — too formal for the vibe',
  },
  smart_casual: {
    headline: 'Polished but relaxed — put-together without trying too hard',
    looks: [
      { name: 'Sleek Low Pony', tip: 'Clean and chic — elevates any smart casual outfit' },
      { name: 'Soft Waves', tip: 'Bouncy, defined waves — classic and versatile' },
      { name: 'French Tuck Updo', tip: 'Loose chignon with a few face-framing pieces' },
    ],
    avoid: 'Very messy styles — undercuts the polished look',
  },
  business: {
    headline: 'Neat, intentional, professional',
    looks: [
      { name: 'Blowout', tip: 'Smooth and voluminous — ultimate professional confidence' },
      { name: 'Low Chignon', tip: 'Elegant and timeless for formal settings' },
      { name: 'Sleek Straight', tip: 'Flat-ironed with shine spray — sharp and modern' },
    ],
    avoid: 'Messy buns or undone styles — save for weekends',
  },
  evening: {
    headline: 'Make a statement — this is your moment',
    looks: [
      { name: 'Glam Waves', tip: 'Old Hollywood curls — instantly dressy' },
      { name: 'Elegant Updo', tip: 'Twisted or pinned up — shows off your outfit and neckline' },
      { name: 'Sleek High Pony', tip: 'Dramatic and modern — with a few face-framing pieces' },
    ],
    avoid: 'Flat, unstyled hair — the outfit deserves more',
  },
  formal: {
    headline: 'Flawless — every detail counts',
    looks: [
      { name: 'Classic Updo', tip: 'Braided, twisted or pinned — timeless elegance' },
      { name: 'Old Hollywood Waves', tip: 'Set curls or hot rollers — utterly glamorous' },
      { name: 'Sculptural Bun', tip: 'Sleek and structured — modern and sophisticated' },
    ],
    avoid: 'Anything undone or overly casual',
  },
  weekend: {
    headline: 'Low effort, high style',
    looks: [
      { name: 'Claw Clip Updo', tip: 'Throw it up and go — effortlessly cute' },
      { name: 'Braided Pigtails', tip: 'Playful and practical for a relaxed day out' },
      { name: 'Natural Air-Dry', tip: 'Embrace your texture — add a headband if needed' },
    ],
    avoid: 'Anything that takes more than 5 minutes',
  },
}



export default function Mirror() {
  const { user, loading: authLoading } = useAuth()
  const [photos, setPhotos] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [wardrobeItems, setWardrobeItems] = useState([])
  const [activeStyle, setActiveStyle] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [phase, setPhase] = useState('') // 'selecting' | 'generating'
  const [result, setResult] = useState(null)
  const [outfit, setOutfit] = useState(null)
  const [savedResults, setSavedResults] = useState([])
  const [exporting, setExporting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const resultPanelRef = useRef(null)

  useEffect(() => {
    if (!authLoading) loadData()
  }, [user, authLoading])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const loadData = async () => {
    const userId = user?.id || 'demo'
    const [p, w, r] = await Promise.all([
      getProfilePhotos(userId).catch(() => []),
      getWardrobeItems(userId).catch(() => []),
      getTryOnResults(userId).catch(() => []),
    ])
    setPhotos(p)
    setWardrobeItems(w)
    setSavedResults(r)
    if (p.length > 0 && !selectedPhoto) {
      setSelectedPhoto(p.find(ph => ph.is_primary) || p[0])
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const userId = user?.id || 'demo'
      const imageUrl = await uploadProfilePhoto(file, userId)
      const photo = await saveProfilePhoto({
        user_id: userId,
        image_url: imageUrl,
        label: `Photo ${photos.length + 1}`,
        is_primary: photos.length === 0,
      })
      setPhotos(prev => [photo, ...prev])
      setSelectedPhoto(photo)
      toast.success('Photo added ✦', { className: 'toast-royal' })
    } catch (err) {
      toast.error(err.message || 'Could not upload photo', { className: 'toast-royal' })
    } finally {
      setUploadingPhoto(false)
    }
  }, [photos, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const handleDeletePhoto = async (photo) => {
    await deleteProfilePhoto(photo.id, photo.image_url)
    const updated = photos.filter(p => p.id !== photo.id)
    setPhotos(updated)
    if (selectedPhoto?.id === photo.id) setSelectedPhoto(updated[0] || null)
    toast.success('Photo removed', { className: 'toast-royal' })
  }

  const handleExportStory = async () => {
    if (!result) return
    try {
      setExporting(true)
      await exportStoryCard({ resultUrl: result, styleName: activeStyleObj?.label || '' })
    } catch {
      toast.error('Could not create story card', { className: 'toast-royal' })
    } finally {
      setExporting(false)
    }
  }

  const handleStyleClick = async (styleKey) => {
    if (!selectedPhoto) {
      toast.error('Please add a photo of yourself first', { className: 'toast-royal' })
      return
    }
    if (wardrobeItems.length < 1) {
      toast.error('Please add at least 1 item to your wardrobe first', { className: 'toast-royal' })
      return
    }

    setActiveStyle(styleKey)
    setGenerating(true)
    setResult(null)
    setOutfit(null)
    setPhase('selecting')

    // Scroll result panel into view on mobile
    setTimeout(() => {
      resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    try {
      // Step 1: Select outfit
      const selectedOutfit = await selectOutfitForStyle({ wardrobeItems, style: styleKey })
      setOutfit(selectedOutfit)
      setPhase('generating')

      // Step 2: If photo is base64, upload to storage first so Replicate can fetch it
      let personPhotoUrl = selectedPhoto?.image_url || null
      if (personPhotoUrl?.startsWith('data:')) {
        try {
          const res = await fetch(personPhotoUrl)
          const blob = await res.blob()
          const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
          const uploaded = await uploadProfilePhoto(file, user?.id || 'demo')
          if (!uploaded.startsWith('data:')) {
            personPhotoUrl = uploaded
            setSelectedPhoto(prev => ({ ...prev, image_url: uploaded }))
          }
        } catch {}
      }

      const imagePrompt = selectedOutfit.image_prompt ||
        (selectedOutfit.selected_items || []).map(i => i.name).join(', ')
      const hasPersonPhoto = personPhotoUrl && !personPhotoUrl.startsWith('data:')

      let resultUrl = null

      // Step 3: FASHN try-on (5-15s) with garment photos, Flux fallback
      if (hasPersonPhoto) {
        try {
          const topUrl = selectedOutfit.top_garment?.image_url && !selectedOutfit.top_garment.image_url.startsWith('data:')
            ? selectedOutfit.top_garment.image_url : null
          const bottomUrl = selectedOutfit.bottom_garment?.image_url && !selectedOutfit.bottom_garment.image_url.startsWith('data:')
            ? selectedOutfit.bottom_garment.image_url : null
          resultUrl = await runFluxTryOn({
            personImageUrl: personPhotoUrl,
            imagePrompt,
            topGarmentUrl: topUrl,
            bottomGarmentUrl: bottomUrl,
          })
        } catch (e) {
          console.warn('Try-on failed, falling back to generation:', e.message)
        }
      }

      // Step 4: Fallback — pure generation if no photo or Flux failed
      if (!resultUrl) {
        resultUrl = await generateLookImage({ imagePrompt })
      }

      setResult(resultUrl)

      await saveTryOnResult({
        user_id: user?.id || 'demo',
        profile_photo_url: selectedPhoto.image_url,
        style: styleKey,
        outfit_name: selectedOutfit.outfit_name,
        result_url: resultUrl,
        outfit_items: selectedOutfit.selected_items || [],
      })
      setSavedResults(prev => [{
        style: styleKey, outfit_name: selectedOutfit.outfit_name,
        result_url: resultUrl, created_at: new Date().toISOString()
      }, ...prev])

    } catch (err) {
      toast.error(err.message || 'Could not generate look — check Replicate API key', { className: 'toast-royal' })
      setActiveStyle(null)
    } finally {
      setGenerating(false)
      setPhase('')
    }
  }

  const phaseLabel = phase === 'selecting'
    ? 'Your stylist is selecting the perfect outfit…'
    : 'Creating your look…'

  const activeStyleObj = STYLES.find(s => s.key === activeStyle)

  return (
    <div style={styles.page}>
      {authLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--ivory-faint)' }}>
          <Loader size={20} strokeWidth={1} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
          <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>Loading…</span>
        </div>
      )}
      {!authLoading && <>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p className="section-label">AI Virtual Mirror</p>
          <h1 style={styles.title}>Try It On</h1>
          <span className="gold-line" />
          <p style={styles.subtitle}>
            Upload a full-body photo, choose your style, and see yourself dressed by AI.
          </p>
        </div>
        {savedResults.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} style={styles.historyBtn}>
            {showHistory ? 'Hide History' : `History (${savedResults.length})`}
          </button>
        )}
      </div>

      <div className="mirror-layout">
        {/* ── LEFT: Photo panel ── */}
        <div className="mirror-photo-panel" style={styles.photoPanel}>
          <p className="section-label" style={{ marginBottom: '1rem' }}>Your Photos</p>

          {/* Selected photo */}
          <div style={styles.mainPhotoWrap}>
            {selectedPhoto ? (
              <div style={styles.mainPhotoInner}>
                <img src={selectedPhoto.image_url} alt="You" style={styles.mainPhoto} />
                <div style={styles.photoOverlay}>
                  <span style={styles.photoLabel}>{selectedPhoto.label}</span>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                style={{
                  ...styles.dropzone,
                  borderColor: isDragActive ? 'var(--gold)' : 'var(--border)',
                  background: isDragActive ? 'var(--gold-glow)' : 'var(--charcoal)',
                }}
              >
                <input {...getInputProps()} />
                <Camera size={32} color="var(--ivory-faint)" strokeWidth={1} />
                <p style={styles.dropText}>Drop a full-body photo here</p>
                <p style={styles.dropHint}>Stand in front of a plain background for best results</p>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 0 && (
            <div style={styles.thumbStrip}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  style={{
                    ...styles.thumb,
                    outline: selectedPhoto?.id === photo.id ? '2px solid var(--gold)' : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img src={photo.image_url} alt={photo.label} style={styles.thumbImg} />
                  <button
                    style={styles.thumbDelete}
                    onClick={e => { e.stopPropagation(); handleDeletePhoto(photo) }}
                  >
                    <Trash2 size={10} strokeWidth={1.5} />
                  </button>
                </div>
              ))}

              {/* Add more */}
              <div
                {...getRootProps()}
                style={styles.thumbAdd}
              >
                <input {...getInputProps()} />
                {uploadingPhoto ? <Loader size={16} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} strokeWidth={1.5} />}
              </div>
            </div>
          )}

          {/* Wardrobe count */}
          <div style={styles.wardrobeInfo}>
            <span style={{ color: 'var(--gold)' }}>{wardrobeItems.length}</span>
            {' '}pieces in wardrobe
          </div>
        </div>

        {/* ── MIDDLE: Style buttons ── */}
        <div className="mirror-style-panel" style={styles.stylePanel}>
          <p className="section-label" style={{ marginBottom: '1.5rem' }}>Choose Your Style</p>
          <div style={styles.styleButtons} className="style-buttons-grid">
            {STYLES.map(s => (
              <motion.button
                key={s.key}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStyleClick(s.key)}
                disabled={generating}
                className="style-btn"
                style={{
                  ...styles.styleBtn,
                  borderColor: activeStyle === s.key ? s.color : 'var(--border)',
                  background: activeStyle === s.key ? `${s.color}18` : 'transparent',
                  opacity: generating && activeStyle !== s.key ? 0.4 : 1,
                }}
              >
                <span className="style-btn-icon" style={{ ...styles.styleBtnIcon, color: activeStyle === s.key ? s.color : 'var(--ivory-faint)' }}>
                  {s.icon}
                </span>
                <span className="style-btn-label" style={{ ...styles.styleBtnLabel, color: activeStyle === s.key ? 'var(--ivory)' : 'var(--ivory-dim)' }}>
                  {s.label}
                </span>
                {generating && activeStyle === s.key && (
                  <Loader size={12} strokeWidth={1.5} style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite', color: s.color }} />
                )}
              </motion.button>
            ))}
          </div>

          {/* Status message */}
          <AnimatePresence>
            {generating && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={styles.statusMsg}
              >
                <Sparkles size={14} color="var(--gold)" strokeWidth={1.5} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                <span>{phaseLabel}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Outfit details (when ready) */}
          <AnimatePresence>
            {outfit && !generating && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.outfitDetails}
              >
                <p className="section-label" style={{ marginBottom: '0.5rem' }}>Your Look</p>
                <h3 style={styles.outfitName}>{outfit.outfit_name}</h3>
                <p style={styles.outfitTagline}>{outfit.tagline}</p>
                <div className="divider" style={{ margin: '1rem 0' }} />
                {outfit.selected_items?.map((item, i) => (
                  <div key={i} style={styles.outfitItem}>
                    <span style={styles.itemDot} />
                    <div>
                      <p style={styles.itemName}>{item.name}</p>
                      <p style={styles.itemNote}>{item.styling_note}</p>
                    </div>
                  </div>
                ))}
                {outfit.stylist_note && (
                  <div style={styles.stylistNote}>
                    <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>♛</span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ivory-dim)', fontStyle: 'italic', fontWeight: 300 }}>
                      {outfit.stylist_note}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Result ── */}
        <div ref={resultPanelRef} className="mirror-result-panel" style={styles.resultPanel}>
          <p className="section-label" style={{ marginBottom: '1rem' }}>
            {result ? `Styled — ${activeStyleObj?.label}` : 'Your Look Will Appear Here'}
          </p>

          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.resultLoading}
              >
                <div style={styles.loadingShimmer}>
                  {selectedPhoto && (
                    <img src={selectedPhoto.image_url} alt="" style={{ ...styles.resultImg, filter: 'blur(12px) brightness(0.25)', position: 'absolute', inset: 0 }} />
                  )}
                  <div style={{ ...styles.loadingOverlay, zIndex: 2, background: 'rgba(0,0,0,0.55)' }}>
                    <Sparkles size={36} color="var(--gold)" strokeWidth={1} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                    <p style={{ ...styles.loadingTitle, color: 'var(--ivory)', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                      {phase === 'selecting' ? 'Selecting your outfit…' : 'Creating your look…'}
                    </p>
                    <p style={{ ...styles.loadingSubtitle, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {phase === 'selecting' ? 'Claude is styling you' : 'AI try-on in progress · up to 30s'}
                    </p>
                    <div style={{ width: 120, height: 2, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: '0.5rem' }}>
                      <motion.div
                        style={{ height: '100%', background: 'var(--gold)', borderRadius: 2 }}
                        initial={{ width: '0%' }}
                        animate={{ width: phase === 'selecting' ? '40%' : '90%' }}
                        transition={{ duration: phase === 'selecting' ? 3 : 28, ease: 'linear' }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.resultWrap}
              >
                <img src={result} alt="Your styled look" style={styles.resultImg} />
                {/* Style badge */}
                <div style={{ ...styles.styleBadge, borderColor: activeStyleObj?.color, color: activeStyleObj?.color }}>
                  {activeStyleObj?.icon} {activeStyleObj?.label}
                </div>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', position: 'absolute', bottom: '1rem', right: '1rem', left: '1rem', justifyContent: 'flex-end' }}>
                  <a href={result} download={`kathy-${activeStyle}.jpg`} target="_blank" rel="noreferrer" style={{ ...styles.downloadBtn, position: 'relative', bottom: 'auto', right: 'auto' }}>
                    <Download size={13} strokeWidth={1.5} />
                    Save
                  </a>
                  <button onClick={handleExportStory} disabled={exporting} style={{ ...styles.downloadBtn, position: 'relative', bottom: 'auto', right: 'auto', background: 'rgba(201,168,76,0.2)', border: '1px solid var(--gold)', color: 'var(--gold)', cursor: 'pointer', opacity: exporting ? 0.6 : 1 }}>
                    {exporting ? <Loader size={13} strokeWidth={1.5} style={{ animation: 'spin 1s linear infinite' }} /> : <Share2 size={13} strokeWidth={1.5} />}
                    {exporting ? 'Creating…' : 'Story Card'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.resultEmpty}
              >
                {selectedPhoto ? (
                  <>
                    <img src={selectedPhoto.image_url} alt="You" style={{ ...styles.resultImg, filter: 'brightness(0.3)' }} />
                    <div style={styles.emptyOverlay}>
                      <p style={styles.emptyIcon}>✦</p>
                      <p style={styles.emptyLabel}>Choose a style to begin</p>
                    </div>
                  </>
                ) : (
                  <div style={styles.noPhotoState}>
                    <p style={{ fontSize: '3rem', opacity: 0.15 }}>👗</p>
                    <p style={styles.emptyLabel}>Add your photo to get started</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Hair Suggestions ── */}
      {result && HAIR_TIPS[activeStyle] && (() => {
        const h = HAIR_TIPS[activeStyle]
        return (
          <div style={{ padding: '2rem clamp(1rem, 4vw, 3rem)', borderTop: '1px solid var(--border)' }}>
            <p className="section-label" style={{ marginBottom: '0.4rem' }}>Hair Suggestion</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--ivory)', marginBottom: '1.25rem' }}>{h.headline}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1px', background: 'var(--border)', marginBottom: '1rem' }}>
              {h.looks.map(look => (
                <div key={look.name} style={{ background: 'var(--charcoal)', padding: '1rem' }}>
                  <p style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.35rem' }}>✦ {look.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ivory-faint)', fontWeight: 300, lineHeight: 1.5 }}>{look.tip}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--stone)', fontStyle: 'italic' }}>◇ Avoid: {h.avoid}</p>
          </div>
        )
      })()}

      {/* ── History strip ── */}
      <AnimatePresence>
        {showHistory && savedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="divider" />
            <p className="section-label" style={{ marginBottom: '1.5rem' }}>Previous Looks</p>
            <div style={styles.historyGrid}>
              {savedResults.map((r, i) => {
                const s = STYLES.find(st => st.key === r.style)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={styles.historyCard}
                    onClick={() => { setResult(r.result_url); setActiveStyle(r.style) }}
                  >
                    <img src={r.result_url} alt={r.outfit_name} style={styles.historyImg} />
                    <div style={styles.historyInfo}>
                      <p style={{ fontSize: '0.75rem', color: s?.color || 'var(--gold)' }}>{s?.icon} {s?.label}</p>
                      <p style={styles.historyName}>{r.outfit_name}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
      </>}
    </div>
  )
}

const styles = {
  page: { padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 4rem)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 400, fontStyle: 'italic' },
  subtitle: { color: 'var(--ivory-faint)', fontSize: '0.85rem', fontWeight: 300, maxWidth: 480 },
  historyBtn: {
    background: 'none', border: '1px solid var(--border)', color: 'var(--ivory-faint)',
    padding: '0.6rem 1.25rem', fontSize: '0.65rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  // Photo panel
  photoPanel: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  mainPhotoWrap: { position: 'relative', background: 'var(--charcoal)', border: '1px solid var(--border)' },
  mainPhotoInner: { width: '100%', position: 'relative' },
  mainPhoto: { width: '100%', height: 'auto', display: 'block', objectFit: 'contain' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: '1rem 0.75rem 0.5rem',
  },
  photoLabel: { fontSize: '0.65rem', color: 'var(--ivory-faint)', letterSpacing: '0.1em' },
  dropzone: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    cursor: 'pointer', border: '1px dashed', padding: '1.5rem', textAlign: 'center',
    transition: 'border-color 0.2s, background 0.2s',
  },
  dropText: { fontSize: '0.8rem', color: 'var(--ivory-dim)', fontWeight: 300 },
  dropHint: { fontSize: '0.65rem', color: 'var(--ivory-faint)', lineHeight: 1.5 },
  thumbStrip: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  thumb: {
    width: 52, height: 68, position: 'relative', cursor: 'pointer',
    border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', background: 'var(--charcoal)' },
  thumbDelete: {
    position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)',
    border: 'none', color: 'var(--ivory)', cursor: 'pointer', width: 16, height: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  thumbAdd: {
    width: 52, height: 68, border: '1px dashed var(--border)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    color: 'var(--ivory-faint)', flexShrink: 0,
  },
  wardrobeInfo: { fontSize: '0.72rem', color: 'var(--ivory-faint)', fontWeight: 300, letterSpacing: '0.05em' },
  // Style panel
  stylePanel: { display: 'flex', flexDirection: 'column' },
  styleButtons: { display: 'flex', flexDirection: 'column', gap: '6px' },
  styleBtn: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    border: '1px solid', padding: '0.875rem 1rem', cursor: 'pointer',
    fontFamily: 'var(--font-body)', background: 'transparent',
    transition: 'all 0.2s', textAlign: 'left',
  },
  styleBtnIcon: { fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0 },
  styleBtnLabel: { fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 },
  statusMsg: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginTop: '1.5rem', padding: '0.875rem',
    background: 'var(--gold-glow)', border: '1px solid var(--gold-dark)',
    fontSize: '0.75rem', color: 'var(--ivory-dim)', fontStyle: 'italic',
  },
  outfitDetails: { marginTop: '1.5rem', padding: '1.5rem', background: 'var(--charcoal)', border: '1px solid var(--border)' },
  outfitName: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', marginTop: '0.25rem' },
  outfitTagline: { fontSize: '0.75rem', color: 'var(--ivory-faint)', fontStyle: 'italic', marginTop: '0.25rem' },
  outfitItem: { display: 'flex', gap: '0.6rem', marginBottom: '0.75rem', alignItems: 'flex-start' },
  itemDot: { width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', marginTop: 5, flexShrink: 0 },
  itemName: { fontSize: '0.78rem', fontFamily: 'var(--font-display)', color: 'var(--ivory)' },
  itemNote: { fontSize: '0.68rem', color: 'var(--ivory-faint)', fontWeight: 300, lineHeight: 1.5 },
  stylistNote: { display: 'flex', gap: '0.6rem', marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(201,168,76,0.06)', border: '1px solid var(--gold-dark)', alignItems: 'flex-start' },
  // Result panel
  resultPanel: { },
  resultWrap: { position: 'relative', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--charcoal)' },
  resultImg: { width: '100%', display: 'block', maxHeight: '80vh', objectFit: 'contain', background: 'var(--charcoal)' },
  resultLoading: { position: 'relative', border: '1px solid var(--border)', overflow: 'hidden', minHeight: 400, background: 'var(--charcoal)' },
  loadingShimmer: { position: 'relative', width: '100%', minHeight: 400, overflow: 'hidden' },
  loadingOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '1rem',
  },
  loadingTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--ivory-dim)' },
  loadingSubtitle: { fontSize: '0.75rem', color: 'var(--ivory-faint)' },
  resultEmpty: { position: 'relative', border: '1px solid var(--border)', overflow: 'hidden', minHeight: 400, background: 'var(--charcoal)' },
  emptyOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
  },
  emptyIcon: { fontSize: '2rem', color: 'var(--gold)', opacity: 0.3 },
  emptyLabel: { fontSize: '0.85rem', color: 'var(--ivory-faint)', fontStyle: 'italic' },
  noPhotoState: {
    minHeight: 400, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '1rem',
  },
  styleBadge: {
    position: 'absolute', top: '1rem', left: '1rem',
    border: '1px solid', padding: '0.3rem 0.75rem',
    fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    fontWeight: 400, fontFamily: 'var(--font-body)',
    background: 'rgba(8,8,8,0.8)',
  },
  downloadBtn: {
    position: 'absolute', bottom: '1rem', right: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: 'rgba(8,8,8,0.85)', border: '1px solid var(--border)',
    color: 'var(--ivory-dim)', textDecoration: 'none',
    padding: '0.5rem 1rem', fontSize: '0.65rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', fontFamily: 'var(--font-body)',
  },
  // History
  historyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1px', background: 'var(--border)' },
  historyCard: { background: 'var(--charcoal)', cursor: 'pointer', overflow: 'hidden' },
  historyImg: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' },
  historyInfo: { padding: '0.75rem' },
  historyName: { fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginTop: '0.2rem', color: 'var(--ivory)' },
}
