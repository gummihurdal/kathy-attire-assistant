import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json()
    const rawPath = body.path || '/'
    // Strip zero-width spaces and other invisible unicode chars
    const path = rawPath.replace(/[\u200B-\u200D\uFEFF\u2028\u2029]/g, '').trim() || '/'
    const { referrer, user_id, session_id, user_agent } = body

    // Get real IP from headers (Supabase Edge sets these)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      null

    // Resolve country via ip-api.com (free, no key needed, 45 req/min)
    let country = null, city = null
    if (ip && ip !== '127.0.0.1' && !ip.startsWith('192.') && !ip.startsWith('10.')) {
      try {
        const geo = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, {
          signal: AbortSignal.timeout(2000)
        })
        const geoData = await geo.json()
        if (geoData.status === 'success') {
          country = geoData.country
          city = geoData.city
        }
      } catch (_) {}
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await sb.from('page_views').insert({
      site: 'my-outfit',
      path: path || '/',
      referrer: referrer || null,
      user_agent: user_agent || null,
      user_id: user_id || null,
      session_id: session_id || null,
      ip,
      country,
      city,
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
