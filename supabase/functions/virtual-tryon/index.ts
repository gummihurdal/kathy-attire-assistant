import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function pollReplicate(predictionId: string, apiKey: string, maxWait = 120000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 3000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const data = await res.json()
    if (data.status === 'succeeded') {
      const out = Array.isArray(data.output) ? data.output[0] : data.output
      if (out) return out
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(data.error || 'Replicate prediction failed')
    }
  }
  throw new Error('Timed out waiting for image generation')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const REPLICATE_KEY = Deno.env.get('REPLICATE_API_KEY')
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!REPLICATE_KEY) throw new Error('REPLICATE_API_KEY not configured')
    if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const { action, ...payload } = await req.json()

    // ── Action 1: Claude selects outfit ──────────────────────────
    if (action === 'select_outfit') {
      const { wardrobeItems, style, personPhotoUrl } = payload

      const stylePrompts: Record<string, string> = {
        casual:       'casually chic, relaxed but put-together, comfortable and stylish — weekend brunch, city stroll',
        smart_casual: 'smart casual, elevated and polished — dinner with friends, creative office',
        sporty:       'athletic and sporty, functional yet stylish — gym, outdoor activities, active lifestyle',
        business:     'sharp professional business attire — commanding, authoritative, office meetings',
        evening:      'sophisticated evening wear — alluring, glamorous, cocktail parties or theatre',
        formal:       'formal black-tie elegance — breathtaking, occasion-worthy, galas and grand events',
        weekend:      'relaxed weekend wear — cosy, free-spirited, lazy Sunday or farmers market',
      }

      const contentBlocks: any[] = [{
        type: 'text',
        text: `You are a world-class personal stylist for Katherina — a woman of refined taste.

STYLE: ${style} — ${stylePrompts[style] || style}

WARDROBE:
${JSON.stringify(wardrobeItems.map((i: any) => ({
  id: i.id, name: i.name, category: i.category,
  colors: i.colors, description: i.description,
  has_photo: !!(i.image_url && !i.image_url.startsWith('data:'))
})), null, 2)}

Select the BEST complete outfit. Rules:
- Must include: 1 top OR 1 dress (if dress, skip bottoms)
- Must include: 1 bottom (unless dress)
- Include shoes if available
- Include outerwear only if it enhances the style

Also write a vivid, detailed outfit description for AI image generation — describe colours, fabrics, silhouette, and styling in detail.

Respond ONLY in JSON (no markdown):
{
  "outfit_name": "Poetic outfit name",
  "tagline": "One evocative sentence",
  "selected_items": [
    { "id": "item_id", "name": "item name", "category": "category", "image_url": "url or null", "styling_note": "how to wear" }
  ],
  "color_story": "colour palette description",
  "image_prompt": "Detailed description of the full outfit for AI generation — fabrics, colours, silhouette, styling — e.g. 'ivory silk blouse with a relaxed drape, tucked into high-waisted black tailored trousers with a subtle pleat, cream pointed-toe heels elongating the leg. Polished and effortless.'",
  "stylist_note": "One insider tip"
}`
      }]

      if (personPhotoUrl) {
        contentBlocks.push({ type: 'text', text: 'Here is Katherina — note her body type, skin tone, and proportions:' })
        contentBlocks.push({ type: 'image', source: { type: 'url', url: personPhotoUrl } })
      }

      const itemsWithImages = wardrobeItems
        .filter((i: any) => i.image_url && !i.image_url.startsWith('data:'))
        .slice(0, 6)
      for (const item of itemsWithImages) {
        contentBlocks.push({ type: 'text', text: `[${item.category.toUpperCase()}] ${item.name}:` })
        contentBlocks.push({ type: 'image', source: { type: 'url', url: item.image_url } })
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 1200, messages: [{ role: 'user', content: contentBlocks }] })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const outfit = JSON.parse(text.replace(/```json|```/g, '').trim())

      return new Response(JSON.stringify(outfit), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // ── Action 2: Flux Kontext Pro — redress Katherina ───────────
    if (action === 'tryon') {
      const { personImageUrl, imagePrompt, styleName } = payload

      // Flux Kontext Pro: takes input_image and modifies it via prompt
      // Perfect for: "change the outfit on this person to X"
      const prompt = `Keep the exact same person, face, hair, body, pose and background. Change ONLY the clothing. Dress her in: ${imagePrompt}. The outfit should look natural and realistic on her body, with proper fit and draping. High-end fashion photography quality.`

      const predRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt,
            input_image: personImageUrl,
            aspect_ratio: '2:3',
            output_format: 'webp',
            output_quality: 90,
            safety_tolerance: 3,
          }
        })
      })

      const pred = await predRes.json()
      if (pred.error) throw new Error(pred.error)

      // Poll for result
      const resultUrl = await pollReplicate(pred.id, REPLICATE_KEY)
      return new Response(JSON.stringify({ result_url: resultUrl }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    // ── Action 3: Fallback — generate fashion image (no person photo) ──
    if (action === 'generate_look') {
      const { imagePrompt, styleName } = payload

      const prompt = `Full body fashion editorial photograph of an elegant European woman, ${imagePrompt}. Professional fashion photography, studio lighting, clean background, high fashion magazine quality, sharp focus, full figure visible from head to toe.`

      const predRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: '2:3',
            output_format: 'webp',
            output_quality: 90,
            safety_tolerance: 3,
          }
        })
      })

      const pred = await predRes.json()
      if (pred.error) throw new Error(pred.error)

      const resultUrl = await pollReplicate(pred.id, REPLICATE_KEY)
      return new Response(JSON.stringify({ result_url: resultUrl }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (err: any) {
    console.error('virtual-tryon error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
