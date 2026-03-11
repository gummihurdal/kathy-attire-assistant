import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? ""

  try {
    const { wardrobeItems, requestType } = await req.json()

    const itemsSummary = JSON.stringify(wardrobeItems.map((i: Record<string,unknown>) => ({
      id: i.id, name: i.name, category: i.category,
      colors: i.colors, brand: i.brand,
      has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:"))
    })))

    // Max 6 images — fewer = faster
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageBlocks: any[] = []
    const withPhotos = (wardrobeItems as Record<string,unknown>[])
      .filter(i => i.image_url && !(i.image_url as string).startsWith("data:"))
      .slice(0, 6)
    for (const item of withPhotos) {
      imageBlocks.push({ type: "text", text: `[ID:${item.id}] ${item.name} (${item.category})` })
      imageBlocks.push({ type: "image", source: { type: "url", url: item.image_url } })
    }

    if (requestType === "full_analysis") {
      const systemPrompt = `You are Kat, a personal stylist for Katherina, a teenage girl. Be friendly and encouraging. All suggestions must be age-appropriate. Reply ONLY with valid JSON — no markdown, no backticks.`

      const userPrompt = `Wardrobe (${wardrobeItems.length} items): ${itemsSummary}
${imageBlocks.length > 0 ? `Photos attached for ${imageBlocks.length / 2} items.` : ""}

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
      "description": "Styling tip",
      "why_it_works": "Reason",
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
          model: "claude-haiku-4-5-20251001",  // ← Sonnet: 3-5x faster than Opus
          max_tokens: 2000,            // ← reduced from 3000
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
