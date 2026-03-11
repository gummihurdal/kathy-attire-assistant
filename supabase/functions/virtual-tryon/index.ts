import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const REPLICATE_KEY = Deno.env.get('REPLICATE_API_KEY')
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!REPLICATE_KEY) throw new Error('REPLICATE_API_KEY not configured')
    if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const { action, ...payload } = await req.json()

    // ── Action 1: Claude selects the outfit ──────────────────────
    if (action === 'select_outfit') {
      const { wardrobeItems, style, personPhotoUrl } = payload

      const contentBlocks: any[] = [
        {
          type: 'text',
          text: `You are a world-class personal stylist. Your client is Katherina.

You have her full-body photo and her wardrobe items below.

STYLE REQUEST: ${style}

WARDROBE ITEMS:
${JSON.stringify(wardrobeItems.map((i: any) => ({
  id: i.id, name: i.name, category: i.category,
  colors: i.colors, description: i.description, image_url: i.image_url
})), null, 2)}

Select the BEST complete outfit for her. You MUST include exactly:
- 1 top OR 1 dress (if dress, skip bottom)
- 1 bottom (unless dress chosen)
- 1 shoes item (if available)
- optionally 1 outerwear (if appropriate for style)

Respond ONLY with JSON:
{
  "outfit_name": "Poetic name",
  "tagline": "One sentence",
  "selected_items": [
    { "id": "item_id", "name": "item name", "category": "category", "image_url": "url or null", "styling_note": "how to wear" }
  ],
  "color_story": "brief colour description",
  "stylist_note": "One tip to elevate the look"
}`
        }
      ]

      // Add person photo
      if (personPhotoUrl) {
        contentBlocks.push({ type: 'text', text: 'Here is Katherina:' })
        contentBlocks.push({ type: 'image', source: { type: 'url', url: personPhotoUrl } })
      }

      // Add wardrobe photos
      const itemsWithImages = wardrobeItems.filter((i: any) => i.image_url && !i.image_url.startsWith('data:')).slice(0, 8)
      for (const item of itemsWithImages) {
        contentBlocks.push({ type: 'text', text: `[${item.category}] ${item.name}:` })
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

    // ── Action 2: Virtual try-on via Replicate ────────────────────
    if (action === 'tryon') {
      const { personImageUrl, garmentImageUrl, garmentCategory, outfitDescription } = payload

      // Use IDM-VTON for realistic virtual try-on
      const prediction = await fetch('https://api.replicate.com/v1/models/cuuupid/idm-vton/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=60',
        },
        body: JSON.stringify({
          input: {
            human_img: personImageUrl,
            garm_img: garmentImageUrl,
            garment_des: outfitDescription || `A stylish ${garmentCategory}`,
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
          }
        })
      })

      const predData = await prediction.json()

      if (predData.error) throw new Error(predData.error)

      // If still processing, poll for result
      let result = predData
      if (result.status === 'processing' || result.status === 'starting') {
        const pollUrl = predData.urls?.get
        if (pollUrl) {
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 3000))
            const poll = await fetch(pollUrl, {
              headers: { 'Authorization': `Bearer ${REPLICATE_KEY}` }
            })
            result = await poll.json()
            if (result.status === 'succeeded' || result.status === 'failed') break
          }
        }
      }

      if (result.status === 'failed') throw new Error(result.error || 'Try-on failed')

      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output
      return new Response(JSON.stringify({ result_url: outputUrl, status: result.status }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    // ── Action 3: Generate AI outfit image when no garment photos ──
    // Uses DALL-E style prompt via Replicate's SDXL
    if (action === 'generate_look') {
      const { personDescription, outfitDescription, style } = payload

      const styleMap: Record<string, string> = {
        casual: 'casual, relaxed, everyday chic',
        smart_casual: 'smart casual, polished, put-together',
        business: 'professional, sharp, business attire',
        formal: 'formal, elegant, black tie',
        sporty: 'athletic, sporty, activewear',
        evening: 'evening wear, glamorous, sophisticated',
        weekend: 'weekend casual, cosy, relaxed',
      }

      const prompt = `Full body fashion photograph of a stylish woman, ${personDescription || 'elegant European woman'}, wearing ${outfitDescription}, ${styleMap[style] || style} style, high fashion editorial photography, studio lighting, white background, professional fashion shoot, sharp detail`

      const prediction = await fetch('https://api.replicate.com/v1/models/stability-ai/sdxl/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=60',
        },
        body: JSON.stringify({
          input: {
            prompt,
            negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy, cropped',
            width: 768,
            height: 1024,
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }
        })
      })

      const predData = await prediction.json()
      let result = predData

      if (result.status === 'processing' || result.status === 'starting') {
        const pollUrl = predData.urls?.get
        if (pollUrl) {
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000))
            const poll = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${REPLICATE_KEY}` } })
            result = await poll.json()
            if (result.status === 'succeeded' || result.status === 'failed') break
          }
        }
      }

      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output
      return new Response(JSON.stringify({ result_url: outputUrl }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (err: any) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
