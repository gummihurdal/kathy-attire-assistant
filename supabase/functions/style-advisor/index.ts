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
      colors: i.colors, description: i.description, brand: i.brand,
      has_photo: !!(i.image_url && !(i.image_url as string).startsWith("data:"))
    })))

    // Build image blocks for items that have real photos (max 12)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageBlocks: any[] = []
    const withPhotos = (wardrobeItems as Record<string,unknown>[])
      .filter(i => i.image_url && !(i.image_url as string).startsWith("data:"))
      .slice(0, 12)
    for (const item of withPhotos) {
      imageBlocks.push({ type: "text", text: `[ID:${item.id}] ${item.name} (${item.category})` })
      imageBlocks.push({ type: "image", source: { type: "url", url: item.image_url } })
    }

    if (requestType === "full_analysis") {
      const systemPrompt = `You are Kat, a warm and enthusiastic personal stylist for Katherina, a teenage girl. You speak in a friendly, encouraging tone — like an older sister who loves fashion. All suggestions must be age-appropriate, stylish, and fun.`

      const userPrompt = `Here is Katherina's complete wardrobe (${wardrobeItems.length} items):
${itemsSummary}
${imageBlocks.length > 0 ? `\nI've also attached photos of ${imageBlocks.length / 2} items so you can see the actual colours and textures.` : ""}

Analyse her whole wardrobe and generate outfit combinations that actually work together. Be specific about which exact items pair well and why.

Return ONLY valid JSON (no backticks, no markdown):
{
  "wardrobe_score": 82,
  "score_label": "Versatile & fun",
  "summary": "2-3 sentence friendly overview of her wardrobe",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["what's missing that would unlock more outfits"],
  "color_palette": ["her dominant colour 1", "colour 2", "colour 3", "colour 4"],
  "outfit_suggestions": [
    {
      "id": "outfit_1",
      "name": "Outfit name",
      "occasion": "School",
      "vibe": "Casual",
      "item_ids": ["uuid1", "uuid2", "uuid3"],
      "item_names": ["Item Name 1", "Item Name 2", "Item Name 3"],
      "description": "How to wear this — specific styling tips",
      "why_it_works": "Colour / proportion / texture reasoning",
      "confidence": 95
    }
  ],
  "styling_tips": ["Practical tip 1", "tip 2", "tip 3"],
  "wishlist": ["One item to buy that would unlock 3+ more outfits", "second suggestion"]
}

Generate 6-8 outfit suggestions across different occasions: School, Weekend, Sport, Party, Cosy Day, Date, Evening Out. Use the actual item IDs from the wardrobe list. Be specific and enthusiastic.`

      const content = [{ type: "text", text: userPrompt }, ...imageBlocks]

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 3000, system: systemPrompt, messages: [{ role: "user", content }] }),
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
