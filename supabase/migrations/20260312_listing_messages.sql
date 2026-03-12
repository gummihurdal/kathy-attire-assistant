-- Listing messages for buyer <-> seller communication
CREATE TABLE IF NOT EXISTS listing_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

ALTER TABLE listing_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY msg_read ON listing_messages FOR SELECT 
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY msg_insert ON listing_messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY msg_update ON listing_messages FOR UPDATE 
  USING (receiver_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON listing_messages TO authenticated;

CREATE INDEX IF NOT EXISTS idx_msg_listing ON listing_messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_msg_receiver ON listing_messages(receiver_id, read_at);
