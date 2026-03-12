// All Anthropic calls go through our Supabase Edge Function
// so the API key never touches the frontend bundle
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callClaude(payload) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/outfit-generator`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  )
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || err.error || 'AI request failed')
  }
  return response.json()
}

export const STYLE_PROFILES = {
  casual: {
    label: 'Casual', icon: '☁️',
    description: 'Relaxed, effortless, everyday elegance',
    prompt: 'Create a casually chic outfit — relaxed but put-together, comfortable yet stylish. Think weekend brunch, a stroll through the city, meeting friends.',
  },
  smart_casual: {
    label: 'Smart Casual', icon: '✦',
    description: 'Polished yet approachable',
    prompt: 'Create a smart-casual outfit — elevated basics that look intentional. Think dinner with friends, a creative office, afternoon meetings.',
  },
  business: {
    label: 'Business', icon: '◈',
    description: 'Commanding, sharp, authoritative',
    prompt: 'Create a professional business outfit — sharp, commanding, and powerful. Conveys authority and competence without sacrificing style.',
  },
  formal: {
    label: 'Formal', icon: '♛',
    description: 'Black tie, galas, special occasions',
    prompt: 'Create a formal or black-tie outfit — breathtakingly elegant, occasion-worthy, and sophisticated. For galas, formal dinners, or grand events.',
  },
  sporty: {
    label: 'Sporty', icon: '◎',
    description: 'Athletic, energetic, functional',
    prompt: 'Create a sporty or activewear outfit — functional, athletic, and still stylish. For gym, outdoor activities, or a sporty everyday look.',
  },
  evening: {
    label: 'Evening', icon: '◇',
    description: 'Cocktail, dinner, night out',
    prompt: 'Create a sophisticated evening look — alluring, polished, and memorable. For cocktail parties, upscale dinners, gallery openings, theatre.',
  },
  weekend: {
    label: 'Weekend', icon: '○',
    description: 'Cosy, free-spirited, laid-back',
    prompt: 'Create a perfect weekend outfit — cosy but thoughtful, free-spirited and relaxed. For a lazy Sunday, farmers market, or a day trip.',
  },
}

export async function generateOutfitRecommendation({ wardrobeItems, style, occasion = '', preferences = '' }) {
  const styleProfile = STYLE_PROFILES[style]
  const wardrobeSummary = wardrobeItems.map(item => ({
    id: item.id, name: item.name, category: item.category,
    colors: item.colors, description: item.description || '',
  }))

  const contentBlocks = [{
    type: 'text',
    text: `You are a world-class personal stylist to royalty and A-list celebrities. Your client is Katherina — a woman of refined taste and discerning style.

WARDROBE INVENTORY:
${JSON.stringify(wardrobeSummary, null, 2)}

STYLE REQUEST: ${styleProfile.label}
STYLE BRIEF: ${styleProfile.prompt}
${occasion ? `OCCASION: ${occasion}` : ''}
${preferences ? `SPECIAL PREFERENCES: ${preferences}` : ''}

Please create a complete, stunning outfit recommendation.

Respond ONLY with a JSON object (no markdown, no preamble):
{
  "outfit_name": "A poetic, memorable name for this look",
  "tagline": "One evocative sentence capturing the essence",
  "items": [
    { "item_id": "id from wardrobe", "item_name": "name", "styling_note": "How to wear this piece" }
  ],
  "color_story": "Brief description of the colour palette and why it works",
  "accessories_suggestion": "Suggested accessories to complete the look",
  "shoes_note": "Specific shoe recommendation from wardrobe or style guidance",
  "occasion_fit": "Why this outfit is perfect for the occasion",
  "stylist_secret": "One insider tip to elevate the look further",
  "confidence_score": 95,
  "style_tags": ["tag1", "tag2", "tag3"]
}`
  }]

  // Include images for items that have them (up to 6)
  const itemsWithImages = wardrobeItems.filter(i => i.image_url && !i.image_url.startsWith('data:')).slice(0, 6)
  for (const item of itemsWithImages) {
    contentBlocks.push({ type: 'text', text: `[${item.category.toUpperCase()}] ${item.name} (ID: ${item.id}):` })
    contentBlocks.push({ type: 'image', source: { type: 'url', url: item.image_url } })
  }

  const data = await callClaude({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  const text = data.content[0]?.text || ''
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('Failed to parse outfit recommendation')
  }
}

export async function analyzeClothingItem(imageFile) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(imageFile)
  })

  try {
    const data = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: imageFile.type || 'image/jpeg', data: base64 } },
          { type: 'text', text: `Analyse this clothing item and respond ONLY with JSON (no markdown):
{
  "suggested_name": "A refined name for this piece",
  "category": "one of: tops, bottoms, dresses, outerwear, shoes, bags, accessories, activewear, swimwear, lingerie",
  "colors": ["primary color", "secondary color if any"],
  "style_tags": ["casual", "formal" etc - up to 3],
  "description": "One sentence describing the piece and its potential",
  "care_note": "Brief care suggestion"
}` }
        ]
      }]
    })
    const text = data.content[0]?.text || ''
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}
