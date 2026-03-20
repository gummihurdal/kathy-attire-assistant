import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Wait for a Replicate prediction to complete
async function waitForPrediction(predictionId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 4000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${apiKey}` },
    })
    const d = await res.json()
    if (d.status === "succeeded") {
      const out = Array.isArray(d.output) ? d.output[0] : d.output
      if (out) return out as string
    }
    if (d.status === "failed" || d.status === "canceled") {
      throw new Error(d.error || "Prediction failed")
    }
  }
  throw new Error("Timed out")
}

// Start one IDM-VTON prediction
async function startIDMVTON(humanImg: string, garmImg: string, garmDesc: string, category: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
      input: { human_img: humanImg, garm_img: garmImg, garment_des: garmDesc, category, crop: false, steps: 30, seed: 42, force_dc: false },
    }),
  })
  const pred = await res.json()
  if (pred.error || pred.detail) throw new Error(pred.error || pred.detail)
  return pred.id as string
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const REPLICATE_KEY = Deno.env.get("REPLICATE_API_KEY") ?? ""
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""

  try {
    const body = await req.json()
    const { action } = body

    // ── SELECT OUTFIT ─────────────────────────────────────────────
    if (action === "select_outfit") {
      const { wardrobeItems, style, personPhotoUrl } = body

      const styleGuides: Record<string, string> = {
        casual:       "relaxed, effortless, everyday cool — jeans or chinos, simple top, clean sneakers",
        smart_casual: "polished but not stiff — elevated basics, neat trousers or dark jeans, structured top",
        sporty:       "ATHLETIC — gym t-shirt or tank top, shorts or leggings, running shoes. Performance fabrics. No jeans, no blazers.",
        business:     "sharp, commanding — tailored suit or blazer, dress shirt, leather shoes",
        evening:      "alluring, sophisticated — statement top or dress, elegant trousers or skirt, heels",
        formal:       "breathtaking elegance — suit or gown, polished shoes, refined accessories",
        weekend:      "cosy, carefree — comfortable layers, casual trousers, flat shoes",
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocks: any[] = [{
        type: "text",
        text: `You are a personal stylist for Katherina, a teenage girl. All outfit suggestions must be age-appropriate, modest, and suitable for a young person. Never suggest revealing, provocative, or adult clothing.
STYLE: ${style} — ${styleGuides[style] ?? style}

WARDROBE: ${JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({
  id: i.id, name: i.name, category: i.category, colors: i.colors,
  description: i.description,
  has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:"))
})))}

Select a COMPLETE outfit appropriate for the style. Be strict about style rules.
For SPORTY: must be athletic wear — gym tee/tank, shorts/leggings, running/training shoes. No exceptions.
Prefer items with has_photo: true as these can be composited directly.

Identify:
- top_garment: the shirt/tee/top (with image_url if available)
- bottom_garment: shorts/trousers/skirt (with image_url if available)

Respond ONLY valid JSON (no backticks):
{
  "outfit_name": "",
  "tagline": "",
  "selected_items": [{"id":"","name":"","category":"","image_url":null,"styling_note":""}],
  "top_garment": {"id":"","name":"","category":"tops","image_url":null,"description":""},
  "bottom_garment": {"id":"","name":"","category":"bottoms","image_url":null,"description":""},
  "color_story": "",
  "image_prompt": "vivid complete outfit description for AI generation — all items head to toe",
  "stylist_note": ""
}`,
      }]

      // Skip sending person photo to Anthropic — Supabase storage URLs are not
      // accessible from Anthropic's servers. Outfit selection is text-only.
      void personPhotoUrl
      const withPhotos = (wardrobeItems as Record<string,unknown>[])
        .filter(i => i.image_url && !(i.image_url as string).startsWith("data:")).slice(0, 6)
      // NOTE: We intentionally skip sending wardrobe images to Anthropic here.
      // Supabase storage URLs are not publicly accessible from Anthropic's servers,
      // causing image fetch errors. Claude selects outfits from text metadata alone.
      // Images are used downstream in the actual try-on step only.
      void withPhotos // suppress unused warning

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 1200, messages: [{ role: "user", content: blocks }] }),
      })
      const d = await r.json()
      if (!d.content?.[0]?.text) throw new Error(d.error?.message || "Empty response from AI")
      const txt = (d.content[0].text) as string
      const outfit = JSON.parse(txt.replace(/```json|```/g, "").trim())

      // Re-hydrate image_url fields — Claude returned nulls since it couldn't see photos
      const itemMap = new Map((wardrobeItems as Record<string,unknown>[]).map(i => [i.id as string, i.image_url as string|null]))
      if (outfit.selected_items) {
        outfit.selected_items = outfit.selected_items.map((i: Record<string,unknown>) => ({
          ...i, image_url: itemMap.get(i.id as string) ?? i.image_url ?? null
        }))
      }
      if (outfit.top_garment?.id) outfit.top_garment.image_url = itemMap.get(outfit.top_garment.id) ?? null
      if (outfit.bottom_garment?.id) outfit.bottom_garment.image_url = itemMap.get(outfit.bottom_garment.id) ?? null

      return new Response(JSON.stringify(outfit), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    // ── CHAINED IDM-VTON: top → bottom → Flux finish ──────────────
    // For full outfit: apply top first, feed result to bottom pass, then Flux for shoes/accessories
    if (action === "tryon_full") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, topGarment, bottomGarment, imagePrompt } = body

      let currentImage = personImageUrl

      // Pass 1: apply top (upper_body)
      if (topGarment?.image_url && !topGarment.image_url.startsWith("data:")) {
        const predId = await startIDMVTON(
          currentImage, topGarment.image_url,
          topGarment.description || topGarment.name,
          "upper_body", REPLICATE_KEY
        )
        currentImage = await waitForPrediction(predId, REPLICATE_KEY)
      }

      // Pass 2: apply bottom (lower_body) onto result of pass 1
      if (bottomGarment?.image_url && !bottomGarment.image_url.startsWith("data:")) {
        const predId = await startIDMVTON(
          currentImage, bottomGarment.image_url,
          bottomGarment.description || bottomGarment.name,
          "lower_body", REPLICATE_KEY
        )
        currentImage = await waitForPrediction(predId, REPLICATE_KEY)
      }

      // Pass 3: Flux Kontext to add shoes + finish (only if we have garment photos to build on)
      const didApplyGarments = 
        (topGarment?.image_url && !topGarment.image_url.startsWith("data:")) ||
        (bottomGarment?.image_url && !bottomGarment.image_url.startsWith("data:"))

      if (didApplyGarments && imagePrompt) {
        const prompt = `Keep this exact person — same face, hair, body. Complete the outfit by adding: ${imagePrompt}. Keep already-worn clothing unchanged. Only add missing pieces like shoes and accessories. Photorealistic.`
        const predRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
          method: "POST",
          headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input: { prompt, input_image: currentImage, aspect_ratio: "2:3", output_format: "jpg", output_quality: 92, safety_tolerance: 3 } }),
        })
        const pred = await predRes.json()
        if (!pred.error) {
          try {
            currentImage = await waitForPrediction(pred.id, REPLICATE_KEY)
          } catch {
            // Keep IDM-VTON result if Flux fails
          }
        }
      }

      return new Response(JSON.stringify({ result_url: currentImage }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── SINGLE IDM-VTON (fire only, poll separately) ──────────────
    if (action === "tryon_idmvton") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, garmentImageUrl, garmentDescription, garmentCategory } = body
      const categoryMap: Record<string, string> = {
        tops: "upper_body", dresses: "upper_body", outerwear: "upper_body",
        bottoms: "lower_body", shoes: "lower_body", accessories: "upper_body",
      }
      const predId = await startIDMVTON(
        personImageUrl, garmentImageUrl,
        garmentDescription || "stylish garment",
        categoryMap[garmentCategory] ?? "upper_body",
        REPLICATE_KEY
      )
      return new Response(JSON.stringify({ prediction_id: predId, status: "starting" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── FLUX KONTEXT: style-based redress (no garment photos) ─────
    if (action === "tryon_flux") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, imagePrompt } = body
      const prompt = `Keep this exact person — identical face, hair, body. Change ONLY the clothing to a complete ${imagePrompt}. Every item of clothing should change to match the style. Photorealistic, high fashion quality.`
      const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, input_image: personImageUrl, aspect_ratio: "2:3", output_format: "jpg", output_quality: 90, safety_tolerance: 3 } }),
      })
      const pred = await res.json()
      if (pred.error) throw new Error(pred.error)
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── FLUX 1.1 PRO: full generation (no person photo) ──────────
    if (action === "generate_look") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { imagePrompt } = body
      const prompt = `Full body fashion editorial photograph of an elegant woman, ${imagePrompt}. Studio lighting, clean background, head to toe, high fashion quality.`
      const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3", output_format: "webp", output_quality: 90 } }),
      })
      const pred = await res.json()
      if (pred.error) throw new Error(pred.error)
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── POLL ──────────────────────────────────────────────────────
    if (action === "poll") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { prediction_id } = body
      const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
        headers: { Authorization: `Token ${REPLICATE_KEY}` },
      })
      const d = await res.json()
      const out = Array.isArray(d.output) ? d.output[0] : d.output
      return new Response(JSON.stringify({
        status: d.status,
        result_url: d.status === "succeeded" ? out : null,
        error: d.error ?? null,
      }), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    throw new Error("Unknown action")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 500,
    })
  }
})
