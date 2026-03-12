import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""

  try {
    const { wardrobeItems, requestType, styleProfile } = await req.json()

    const itemsSummary = JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({
      id: i.id, name: i.name, category: i.category,
      colors: i.colors, brand: i.brand,
      has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:"))
    })))

    // Text-only analysis — image fetching adds 25s+ latency with no meaningful accuracy gain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageBlocks: any[] = []

    // Build body profile context
    let profileContext = ""
    if (styleProfile) {
      const shapeMap: Record<string,string> = { hourglass:"Hourglass", pear:"Pear", apple:"Apple", rectangle:"Rectangle", inverted_triangle:"Inverted Triangle" }
      const heightMap: Record<string,string> = { petite:"Petite (under 163cm)", average:"Average (163-173cm)", tall:"Tall (over 173cm)" }
      if (styleProfile.body_shape) profileContext += `\nBody shape: ${shapeMap[styleProfile.body_shape] || styleProfile.body_shape}`
      if (styleProfile.height) profileContext += `\nHeight: ${heightMap[styleProfile.height] || styleProfile.height}`
      if (styleProfile.emphasise?.length) profileContext += `\nWants to emphasise: ${styleProfile.emphasise.join(", ")}`
      if (styleProfile.avoid?.length) profileContext += `\nMust NEVER suggest: ${styleProfile.avoid.join(", ")}`
    }

    if (requestType === "full_analysis") {
      const systemPrompt = `You are Kat, Katherina's personal stylist. Be warm but brief. Age-appropriate only. Reply ONLY with compact valid JSON — no markdown, no backticks, no long explanations.`

      const userPrompt = `Wardrobe (${wardrobeItems.length} items): ${itemsSummary}${profileContext ? "\n\nKatherina's body profile:" + profileContext + "\nUse this to ensure every outfit flatters her shape and height. Respect the avoid list strictly." : ""}


Return this exact JSON structure:
{
  "wardrobe_score": 82,
  "score_label": "Versatile & fun",
  "summary": "2-3 sentence overview",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1"],
  "color_palette": ["color 1", "color 2", "color 3"],
  "outfit_suggestions": [
    {
      "id": "outfit_1",
      "name": "Name",
      "occasion": "School",
      "item_ids": ["uuid1", "uuid2"],
      "item_names": ["Name 1", "Name 2"],
      "description": "Brief tip (max 15 words)",
      "why_it_works": "Brief reason (max 10 words)",
      "confidence": 90
    }
  ],
  "styling_tips": ["tip 1", "tip 2"],
  "wishlist": ["item to buy 1"]
}

Generate 6 outfit suggestions across: School, Weekend, Sport, Party, Cosy Day, Date. Use real item IDs.`

      const content = [{ type: "text", text: userPrompt }, ...imageBlocks]

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",  // faster than haiku for JSON-heavy tasks
          max_tokens: 1200,            // ← reduced from 3000
          system: systemPrompt,
          messages: [{ role: "user", content }]
        }),
      })
      const d = await r.json()
      const txt = (d.content?.[0]?.text ?? "") as string
      const analysis = JSON.parse(txt.replace(/```json|```/g, "").trim())
      return new Response(JSON.stringify(analysis), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    throw new Error("Unknown requestType")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), { headers: { ...cors, "Content-Type": "application/json" }, status: 500 })
  }
})
