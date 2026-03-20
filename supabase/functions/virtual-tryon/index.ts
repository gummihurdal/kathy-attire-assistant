import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Poll every 2s, max 30 attempts = 60s
async function waitForPrediction(predictionId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${apiKey}` },
    })
    const d = await res.json()
    if (d.status === "succeeded") {
      const out = Array.isArray(d.output) ? d.output[0] : d.output
      if (out) return out as string
    }
    if (d.status === "failed" || d.status === "canceled") throw new Error(d.error || "Generation failed")
  }
  throw new Error("Timed out after 60s")
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const REPLICATE_KEY = Deno.env.get("REPLICATE_API_KEY") ?? ""
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""

  try {
    const body = await req.json()
    const { action } = body

    // ── SELECT OUTFIT ──────────────────────────────────────────────
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
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `You are a world-class personal stylist. Your client is a tall, athletic man with refined taste.
STYLE: ${style} — ${styleGuides[style] ?? style}

WARDROBE:
${JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({
  id: i.id, name: i.name, category: i.category, colors: i.colors,
  description: i.description,
  has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:")),
})))}

Select a complete stylish outfit. Prefer items with has_photo: true.
Respond ONLY valid JSON (no backticks):
{"outfit_name":"","tagline":"","selected_items":[{"id":"","name":"","category":"","image_url":null,"styling_note":""}],"top_garment":{"id":"","name":"","category":"tops","image_url":null,"description":""},"bottom_garment":{"id":"","name":"","category":"bottoms","image_url":null,"description":""},"color_story":"","image_prompt":"detailed head-to-toe outfit on a tall athletic man, photorealistic fashion editorial style","stylist_note":""}`,
          }],
        }),
      })
      const d = await r.json()
      if (!d.content?.[0]?.text) throw new Error(d.error?.message || "Empty response from AI")
      const outfit = JSON.parse((d.content[0].text as string).replace(/```json|```/g, "").trim())

      // Re-hydrate image_urls
      const itemMap = new Map((wardrobeItems as Record<string,unknown>[]).map(i => [i.id as string, i.image_url as string|null]))
      if (outfit.selected_items) outfit.selected_items = outfit.selected_items.map((i: Record<string,unknown>) => ({ ...i, image_url: itemMap.get(i.id as string) ?? null }))
      if (outfit.top_garment?.id) outfit.top_garment.image_url = itemMap.get(outfit.top_garment.id) ?? null
      if (outfit.bottom_garment?.id) outfit.bottom_garment.image_url = itemMap.get(outfit.bottom_garment.id) ?? null

      return new Response(JSON.stringify(outfit), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    // ── FLUX KONTEXT: redress person photo ─────────────────────────
    if (action === "tryon_flux") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, imagePrompt } = body
      const prompt = `Keep this exact person — same face, hair, body. Dress them in: ${imagePrompt}. Replace all clothing completely. Keep background. Photorealistic editorial fashion.`
      const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, input_image: personImageUrl, aspect_ratio: "2:3", output_format: "jpg", output_quality: 92, safety_tolerance: 3 } }),
      })
      const pred = await res.json()
      if (pred.error) throw new Error(pred.error)
      const resultUrl = await waitForPrediction(pred.id, REPLICATE_KEY)
      return new Response(JSON.stringify({ result_url: resultUrl }), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    // ── FALLBACK: pure generation (no person photo) ────────────────
    if (action === "generate_look") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { imagePrompt } = body
      const prompt = `Full body fashion editorial of a tall athletic man, ${imagePrompt}. Studio lighting, clean background, head to toe, high fashion quality.`
      const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3", output_format: "webp", output_quality: 90 } }),
      })
      const pred = await res.json()
      if (pred.error) throw new Error(pred.error)
      const resultUrl = await waitForPrediction(pred.id, REPLICATE_KEY)
      return new Response(JSON.stringify({ result_url: resultUrl }), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    throw new Error("Unknown action")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), { headers: { ...cors, "Content-Type": "application/json" }, status: 500 })
  }
})
