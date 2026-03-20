import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function falTryOn(modelImage: string, garmentImage: string, category: string, falKey: string): Promise<string> {
  const submitRes = await fetch("https://queue.fal.run/fal-ai/fashn/tryon/v1.6", {
    method: "POST",
    headers: { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model_image: modelImage,
      garment_image: garmentImage,
      category,
      mode: "balanced",
      garment_photo_type: "auto",
      restore_background: true,
    }),
  })
  const submitted = await submitRes.json()
  if (submitted.detail) throw new Error(submitted.detail)
  const requestId = submitted.request_id
  if (!requestId) throw new Error("No request_id from fal.ai")

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`https://queue.fal.run/fal-ai/fashn/requests/${requestId}`, {
      headers: { "Authorization": `Key ${falKey}` },
    })
    const result = await res.json()
    if (result.images?.[0]?.url) return result.images[0].url
    if (result.detail && !result.detail.includes("still processing")) throw new Error(result.detail)
  }
  throw new Error("FASHN timed out")
}

async function fluxTryOn(personImageUrl: string, imagePrompt: string, replicateKey: string): Promise<string> {
  const prompt = `Keep this exact person — same face, hair, body. Dress them in: ${imagePrompt}. Replace all clothing. Photorealistic editorial fashion.`
  const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
    method: "POST",
    headers: { Authorization: `Token ${replicateKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: { prompt, input_image: personImageUrl, aspect_ratio: "2:3", output_format: "jpg", output_quality: 92, safety_tolerance: 3 } }),
  })
  const pred = await res.json()
  if (pred.error) throw new Error(pred.error)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const poll = await (await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, { headers: { Authorization: `Token ${replicateKey}` } })).json()
    if (poll.status === "succeeded") { const out = Array.isArray(poll.output) ? poll.output[0] : poll.output; if (out) return out }
    if (poll.status === "failed") throw new Error(poll.error || "Replicate failed")
  }
  throw new Error("Flux timed out")
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const REPLICATE_KEY = Deno.env.get("REPLICATE_API_KEY") ?? ""
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""
  const FAL_KEY = Deno.env.get("FAL_KEY") ?? ""

  try {
    const body = await req.json()
    const { action } = body

    if (action === "select_outfit") {
      const { wardrobeItems, style } = body
      const styleGuides: Record<string, string> = {
        casual:       "relaxed, effortless — chinos or jeans, simple top, clean sneakers",
        smart_casual: "polished but not stiff — neat trousers, structured shirt or knit",
        sporty:       "athletic — performance tee, shorts or joggers, training shoes",
        business:     "sharp — tailored trousers, dress shirt, blazer, leather shoes",
        evening:      "sophisticated — statement shirt or fine knit, elegant trousers, dress shoes",
        formal:       "impeccable — suit, polished shoes, refined accessories",
        weekend:      "comfortable and considered — relaxed layers, casual trousers, clean shoes",
      }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 1200,
          messages: [{ role: "user", content: `You are a world-class personal stylist. Your client is a tall, athletic man with refined taste.
STYLE: ${style} — ${styleGuides[style] ?? style}

WARDROBE:
${JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({
  id: i.id, name: i.name, category: i.category, colors: i.colors,
  description: i.description,
  has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:")),
})))}

Select a complete stylish outfit. Prefer items with has_photo: true.
Respond ONLY valid JSON (no backticks):
{"outfit_name":"","tagline":"","selected_items":[{"id":"","name":"","category":"","image_url":null,"styling_note":""}],"top_garment":{"id":"","name":"","category":"tops","image_url":null,"description":""},"bottom_garment":{"id":"","name":"","category":"bottoms","image_url":null,"description":""},"color_story":"","image_prompt":"detailed head-to-toe outfit description, tall athletic man, photorealistic fashion editorial","stylist_note":""}` }],
        }),
      })
      const d = await r.json()
      if (!d.content?.[0]?.text) throw new Error(d.error?.message || "Empty AI response")
      const outfit = JSON.parse((d.content[0].text as string).replace(/```json|```/g, "").trim())
      const itemMap = new Map((wardrobeItems as Record<string,unknown>[]).map(i => [i.id as string, i.image_url as string|null]))
      if (outfit.selected_items) outfit.selected_items = outfit.selected_items.map((i: Record<string,unknown>) => ({ ...i, image_url: itemMap.get(i.id as string) ?? null }))
      if (outfit.top_garment?.id) outfit.top_garment.image_url = itemMap.get(outfit.top_garment.id) ?? null
      if (outfit.bottom_garment?.id) outfit.bottom_garment.image_url = itemMap.get(outfit.bottom_garment.id) ?? null
      return new Response(JSON.stringify(outfit), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    if (action === "tryon_flux") {
      const { personImageUrl, imagePrompt, topGarmentUrl, bottomGarmentUrl } = body

      // FASHN: use actual garment photo from wardrobe (top first, then bottom)
      if (FAL_KEY && topGarmentUrl && !topGarmentUrl.startsWith("data:")) {
        try {
          const resultUrl = await falTryOn(personImageUrl, topGarmentUrl, "tops", FAL_KEY)
          // If we also have a bottom, do a second FASHN pass
          if (bottomGarmentUrl && !bottomGarmentUrl.startsWith("data:")) {
            try {
              const resultUrl2 = await falTryOn(resultUrl, bottomGarmentUrl, "bottoms", FAL_KEY)
              return new Response(JSON.stringify({ result_url: resultUrl2 }), { headers: { ...cors, "Content-Type": "application/json" } })
            } catch { /* Return top-only result */ }
          }
          return new Response(JSON.stringify({ result_url: resultUrl }), { headers: { ...cors, "Content-Type": "application/json" } })
        } catch (e) {
          console.error("FASHN failed:", e instanceof Error ? e.message : e)
        }
      }

      // Fallback: Flux Kontext (style redress from text)
      const resultUrl = await fluxTryOn(personImageUrl, imagePrompt, REPLICATE_KEY)
      return new Response(JSON.stringify({ result_url: resultUrl }), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    if (action === "generate_look") {
      const { imagePrompt } = body
      const prompt = `Full body fashion editorial of a tall athletic man, ${imagePrompt}. Studio lighting, clean background, head to toe.`
      const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3", output_format: "webp", output_quality: 90 } }),
      })
      const pred = await res.json()
      if (pred.error) throw new Error(pred.error)
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const poll = await (await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, { headers: { Authorization: `Token ${REPLICATE_KEY}` } })).json()
        if (poll.status === "succeeded") { const out = Array.isArray(poll.output) ? poll.output[0] : poll.output; if (out) return new Response(JSON.stringify({ result_url: out }), { headers: { ...cors, "Content-Type": "application/json" } }) }
        if (poll.status === "failed") throw new Error(poll.error || "Failed")
      }
      throw new Error("Timed out")
    }

    throw new Error("Unknown action")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), { headers: { ...cors, "Content-Type": "application/json" }, status: 500 })
  }
})
