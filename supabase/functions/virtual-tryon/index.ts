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

    // ── SELECT OUTFIT (Claude) ────────────────────────────────────
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
        text: `You are an elite stylist for Katherina.
STYLE: ${style} — ${styleGuides[style] ?? style}
WARDROBE: ${JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({ id:i.id, name:i.name, category:i.category, colors:i.colors, description:i.description })))}
Pick: 1 top OR dress, 1 bottom (unless dress), shoes if available.
Write image_prompt: vivid outfit description for AI image generation (colours, fabrics, silhouette, styling details).
Respond ONLY valid JSON no backticks:
{"outfit_name":"","tagline":"","selected_items":[{"id":"","name":"","category":"","image_url":null,"styling_note":""}],"color_story":"","image_prompt":"","stylist_note":""}`,
      }]

      if (personPhotoUrl && !personPhotoUrl.startsWith("data:")) {
        blocks.push({ type: "text", text: "Katherina:" })
        blocks.push({ type: "image", source: { type: "url", url: personPhotoUrl } })
      }
      const withPhotos = (wardrobeItems as Record<string,unknown>[])
        .filter(i => i.image_url && !(i.image_url as string).startsWith("data:")).slice(0, 5)
      for (const item of withPhotos) {
        blocks.push({ type: "text", text: `[${item.category}] ${item.name}:` })
        blocks.push({ type: "image", source: { type: "url", url: item.image_url } })
      }

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 1000, messages: [{ role: "user", content: blocks }] }),
      })
      const d = await r.json()
      const txt = (d.content?.[0]?.text ?? "") as string
      const outfit = JSON.parse(txt.replace(/```json|```/g, "").trim())
      return new Response(JSON.stringify(outfit), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    // ── START TRY-ON (Flux Kontext Pro) — returns prediction_id immediately ──
    if (action === "tryon") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { personImageUrl, imagePrompt } = body
      const prompt = `Keep this exact person — same face, hair, body, pose, background. Change ONLY the clothing to: ${imagePrompt}. Photorealistic high fashion editorial quality.`
      const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Bearer ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, input_image: personImageUrl, aspect_ratio: "2:3", output_format: "webp", output_quality: 90, safety_tolerance: 3 } }),
      })
      const pred = await r.json()
      if (pred.error) throw new Error(pred.error)
      // Return immediately — frontend polls
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" }
      })
    }

    // ── START GENERATE LOOK (Flux 1.1 Pro) — returns prediction_id immediately ──
    if (action === "generate_look") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { imagePrompt } = body
      const prompt = `Full body fashion editorial photograph of an elegant woman, ${imagePrompt}. Studio lighting, clean background, high fashion magazine quality, head to toe visible.`
      const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
        method: "POST",
        headers: { Authorization: `Bearer ${REPLICATE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3", output_format: "webp", output_quality: 90 } }),
      })
      const pred = await r.json()
      if (pred.error) throw new Error(pred.error)
      // Return immediately — frontend polls
      return new Response(JSON.stringify({ prediction_id: pred.id, status: pred.status }), {
        headers: { ...cors, "Content-Type": "application/json" }
      })
    }

    // ── POLL prediction status ────────────────────────────────────
    if (action === "poll") {
      if (!REPLICATE_KEY) throw new Error("REPLICATE_API_KEY not configured")
      const { prediction_id } = body
      const r = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
        headers: { Authorization: `Bearer ${REPLICATE_KEY}` },
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
