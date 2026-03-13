import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js'

Deno.serve(async () => {
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1 })
  try {
    await sql`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS ip TEXT`
    await sql`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS country TEXT`
    await sql`ALTER TABLE page_views ADD COLUMN IF NOT EXISTS city TEXT`
    await sql.end()
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    await sql.end()
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
