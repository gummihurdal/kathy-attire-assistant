const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function analyseWardrobe(wardrobeItems) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/style-advisor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ wardrobeItems, requestType: 'full_analysis' }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export const OCCASION_ICONS = {
  'School':     '📚',
  'Weekend':    '☀️',
  'Sport':      '⚡',
  'Party':      '✨',
  'Cosy Day':   '☕',
  'Date':       '🌸',
  'Evening Out':'🌙',
}

export const OCCASION_COLORS = {
  'School':     '#6e8fb0',
  'Weekend':    '#7a9e7e',
  'Sport':      '#b07a6e',
  'Party':      '#9b7ab5',
  'Cosy Day':   '#b0956e',
  'Date':       '#c9a84c',
  'Evening Out':'#7a8fa8',
}
