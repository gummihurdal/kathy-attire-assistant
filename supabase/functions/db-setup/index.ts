import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js'

Deno.serve(async () => {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')!
  const sql = postgres(dbUrl, { max: 1 })

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS listing_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        sender_email TEXT NOT NULL,
        receiver_id UUID NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        read_at TIMESTAMPTZ
      )
    `
    await sql`ALTER TABLE listing_messages ENABLE ROW LEVEL SECURITY`
    await sql`DROP POLICY IF EXISTS msg_read ON listing_messages`
    await sql`DROP POLICY IF EXISTS msg_insert ON listing_messages`  
    await sql`DROP POLICY IF EXISTS msg_update ON listing_messages`
    await sql`CREATE POLICY msg_read ON listing_messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid())`
    await sql`CREATE POLICY msg_insert ON listing_messages FOR INSERT WITH CHECK (sender_id = auth.uid())`
    await sql`CREATE POLICY msg_update ON listing_messages FOR UPDATE USING (receiver_id = auth.uid())`
    await sql`GRANT SELECT, INSERT, UPDATE ON listing_messages TO authenticated`
    await sql`CREATE INDEX IF NOT EXISTS idx_msg_listing ON listing_messages(listing_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_msg_receiver ON listing_messages(receiver_id, read_at)`
    await sql.end()
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    await sql.end()
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
