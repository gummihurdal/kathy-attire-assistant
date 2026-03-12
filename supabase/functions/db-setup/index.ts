import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js'

Deno.serve(async () => {
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1 })
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        site TEXT NOT NULL DEFAULT 'my-outfit',
        path TEXT NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        user_id UUID,
        session_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`ALTER TABLE page_views ENABLE ROW LEVEL SECURITY`
    await sql`DROP POLICY IF EXISTS pv_insert ON page_views`
    await sql`DROP POLICY IF EXISTS pv_read ON page_views`
    await sql`CREATE POLICY pv_insert ON page_views FOR INSERT WITH CHECK (true)`
    await sql`CREATE POLICY pv_read ON page_views FOR SELECT USING (auth.role() = 'service_role')`
    await sql`GRANT INSERT ON page_views TO anon, authenticated`
    await sql`CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(site, path)`
    await sql`CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at DESC)`
    await sql.end()
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    await sql.end()
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
