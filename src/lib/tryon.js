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

// Step 1: Claude selects outfit and writes image prompt
export async function selectOutfitForStyle({ wardrobeItems, style, personPhotoUrl }) {
  return callEdge('select_outfit', { wardrobeItems, style, personPhotoUrl })
}

// Step 2a: Flux Kontext Pro — redress the actual photo of Katherina
export async function runVirtualTryOn({ personImageUrl, imagePrompt, styleName }) {
  return callEdge('tryon', { personImageUrl, imagePrompt, styleName })
}

// Step 2b: Flux 1.1 Pro — full fashion image when no person photo
export async function generateLookImage({ imagePrompt, styleName }) {
  return callEdge('generate_look', { imagePrompt, styleName })
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
