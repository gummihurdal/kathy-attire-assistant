import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        casual: "relaxed, effortless, everyday cool",
        smart_casual: "polished but not stiff, elevated basics",
        sporty: "functional, dynamic, active lifestyle",
        business: "sharp, commanding, confident",
        evening: "alluring, sophisticated, occasion-worthy",
        formal: "breathtaking, black-tie, grand occasions",
        weekend: "cosy, carefree, relaxed charm",
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocks: any[] = [{
        type: "text",
        text: `You are an elite personal stylist for Katherina.
STYLE: ${style} — ${styleGuides[style] ?? style}
WARDROBE: ${JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({
  id: i.id, name: i.name, category: i.category,
  colors: i.colors, description: i.description,
  has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:"))
})))}

Select the best complete outfit. Prefer items that HAVE photos (has_photo: true) as these can be tried on directly.
Include: 1 top OR dress, 1 bottom (unless dress), shoes if available.

For IDM-VTON try-on: identify ONE primary garment (top or dress) with a photo — this will be composited directly onto her body.
Also write image_prompt for fallback generation.

Respond ONLY valid JSON (no backticks):
{
  "outfit_name": "",
  "tagline": "",
  "selected_items": [{"id":"","name":"","category":"","image_url":null,"styling_note":""}],
  "primary_garment": {"id":"","name":"","category":"upper_body","image_url":null,"description":""},
  "color_story": "",
  "image_prompt": "vivid full outfit description for AI image generation",
  "stylist_note": ""
}`,
      }]

      if (personPhotoUrl && !personPhotoUrl.startsWith("data:")) {
        blocks.push({ type: "text", text: "Katherina:" })
        blocks.push({ type: "image", source: { type: "url", url: personPhotoUrl } })
      }
      const withPhotos = (wardrobeItems as Record<string,unknown>[])
        .filter(i => i.image_url && !(i.image_url as string).startsWith("data:")).slice(0, 6)
      for (const item of withPhotos) {
        blocks.push({ type: "text", text: `[${item.category}] ${item.name}:` })
        blocks.push({ type: "image", source: { type: "url", url: item.image_url } })
      }

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 1200, messages: [{ role: "user", content: blocks }] }),
      })
      const d = await r.json()
      const txt = (d.content?.[0]?.text ?? "") as string
      const outfit = JSON.parse(txt.replace(/```json|```/g, "").trim())
      return new Response(JSON.stringify(outfit), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    // ── IDM-VTON: identity-preserving try-on ──────────────────────
    // Uses person photo + actual garment photo → composites garment onto person
    if (action === "tryon_idmvton") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, garmentImageUrl, garmentDescription, garmentCategory } = body

      // Map category to IDM-VTON category
      const categoryMap: Record<string, string> = {
        tops: "upper_body", dresses: "upper_body", outerwear: "upper_body",
        bottoms: "lower_body", shoes: "lower_body", accessories: "upper_body",
      }
      const idmCategory = categoryMap[garmentCategory] ?? "upper_body"

      const r = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
          input: {
            human_img: personImageUrl,
            garm_img: garmentImageUrl,
            garment_des: garmentDescription || "stylish garment",
            category: idmCategory,
            crop: false,
            steps: 30,
            seed: 42,
            force_dc: false,
          },
        }),
      })
      const pred = await r.json()
      if (pred.error) throw new Error(pred.error)
      if (pred.detail) throw new Error(pred.detail)
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── FLUX KONTEXT PRO: style-based redress ─────────────────────
    // Fallback when no garment photo available
    if (action === "tryon_flux") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, imagePrompt } = body
      const prompt = `Keep this exact person — identical face, hair, body proportions and pose. Only change the clothing to: ${imagePrompt}. Photorealistic, high fashion quality.`
      const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, input_image: personImageUrl, aspect_ratio: "2:3", output_format: "jpg", output_quality: 90, safety_tolerance: 3 } }),
      })
      const pred = await r.json()
      if (pred.error) throw new Error(pred.error)
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── FLUX 1.1 PRO: pure generation (no person photo) ──────────
    if (action === "generate_look") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { imagePrompt } = body
      const prompt = `Full body fashion editorial photograph of an elegant woman, ${imagePrompt}. Studio lighting, clean background, high fashion magazine quality, head to toe.`
      const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3", output_format: "webp", output_quality: 90 } }),
      })
      const pred = await r.json()
      if (pred.error) throw new Error(pred.error)
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // ── POLL ──────────────────────────────────────────────────────
    if (action === "poll") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { prediction_id } = body
      const r = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
        headers: { Authorization: `Token ${REPLICATE_KEY}` },
      })
      const d = await r.json()
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
