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

// Step 1: Claude selects outfit from wardrobe
export async function selectOutfitForStyle({ wardrobeItems, style }) {
  return callEdge('select_outfit', { wardrobeItems, style })
}

// Step 2a: Flux Kontext — redress person photo with selected outfit (~20s)
export async function runFluxTryOn({ personImageUrl, imagePrompt }) {
  const data = await callEdge('tryon_flux', { personImageUrl, imagePrompt })
  return data.result_url
}

// Step 2b: Fallback — pure AI generation (no person photo needed)
export async function generateLookImage({ imagePrompt }) {
  const data = await callEdge('generate_look', { imagePrompt })
  return data.result_url
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
