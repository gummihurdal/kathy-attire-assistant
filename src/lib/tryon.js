const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callEdge(action, payload) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/virtual-tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function pollUntilDone(predictionId, onProgress) {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 4000))
    const result = await callEdge('poll', { prediction_id: predictionId })
    if (onProgress) onProgress(result.status)
    if (result.status === 'succeeded' && result.result_url) return result.result_url
    if (result.status === 'failed') throw new Error(result.error || 'Generation failed')
  }
  throw new Error('Timed out')
}

// Step 1: Claude selects outfit
export async function selectOutfitForStyle({ wardrobeItems, style, personPhotoUrl }) {
  return callEdge('select_outfit', { wardrobeItems, style, personPhotoUrl })
}

// Step 2: Full chained try-on — top → bottom → Flux finish
// Handles complete outfit including shorts + shoes for sporty etc.
export async function runFullTryOn({ personImageUrl, topGarment, bottomGarment, imagePrompt }, onProgress) {
  if (onProgress) onProgress('applying')
  // This action runs all passes server-side and returns final result directly
  const result = await callEdge('tryon_full', {
    personImageUrl,
    topGarment,
    bottomGarment,
    imagePrompt,
  })
  return result.result_url
}

// Single IDM-VTON pass (fire + poll)
export async function runIDMVTON({ personImageUrl, garmentImageUrl, garmentDescription, garmentCategory }, onProgress) {
  const { prediction_id } = await callEdge('tryon_idmvton', {
    personImageUrl, garmentImageUrl, garmentDescription, garmentCategory
  })
  return pollUntilDone(prediction_id, onProgress)
}

// Flux Kontext — full style redress (no garment photos)
export async function runFluxTryOn({ personImageUrl, imagePrompt }, onProgress) {
  const { prediction_id } = await callEdge('tryon_flux', { personImageUrl, imagePrompt })
  return pollUntilDone(prediction_id, onProgress)
}

// Flux 1.1 Pro — pure generation (no person photo)
export async function generateLookImage({ imagePrompt }, onProgress) {
  const { prediction_id } = await callEdge('generate_look', { imagePrompt })
  return pollUntilDone(prediction_id, onProgress)
}

export const STYLES = [
  { key: 'casual',       label: 'Casual',       icon: '☁️',  color: '#7a9e7e' },
  { key: 'smart_casual', label: 'Smart Casual',  icon: '✦',   color: '#b0956e' },
  { key: 'sporty',       label: 'Sporty',        icon: '◎',   color: '#6e8fb0' },
  { key: 'business',     label: 'Business',      icon: '◈',   color: '#7a8fa8' },
  { key: 'evening',      label: 'Evening',       icon: '◇',   color: '#9b7ab5' },
  { key: 'formal',       label: 'Formal',        icon: '♛',   color: '#c9a84c' },
  { key: 'weekend',      label: 'Weekend',       icon: '○',   color: '#a8956e' },
]
