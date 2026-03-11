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

// Step 1: Claude selects outfit for style
export async function selectOutfitForStyle({ wardrobeItems, style, personPhotoUrl }) {
  return callEdge('select_outfit', { wardrobeItems, style, personPhotoUrl })
}

// Step 2a: Virtual try-on with real garment photo (best quality)
export async function runVirtualTryOn({ personImageUrl, garmentImageUrl, garmentCategory, outfitDescription }) {
  return callEdge('tryon', { personImageUrl, garmentImageUrl, garmentCategory, outfitDescription })
}

// Step 2b: Generate AI outfit image (when no garment photos available)
export async function generateLookImage({ personDescription, outfitDescription, style }) {
  return callEdge('generate_look', { personDescription, outfitDescription, style })
}

export const STYLES = [
  { key: 'casual',       label: 'Casual',       icon: '☁️',  color: '#7a9e7e' },
  { key: 'smart_casual', label: 'Smart Casual',  icon: '✦',   color: '#9e8a7a' },
  { key: 'sporty',       label: 'Sporty',        icon: '◎',   color: '#7a8a9e' },
  { key: 'business',     label: 'Business',      icon: '◈',   color: '#5a6a7e' },
  { key: 'evening',      label: 'Evening',       icon: '◇',   color: '#7a5a8e' },
  { key: 'formal',       label: 'Formal',        icon: '♛',   color: '#c9a84c' },
  { key: 'weekend',      label: 'Weekend',       icon: '○',   color: '#8e7a5a' },
]
