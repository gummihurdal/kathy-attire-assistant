import { supabase } from './supabase'

// Send a message from buyer to seller
export async function sendMessage({ listingId, sellerId, sellerEmail, message }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('listing_messages')
    .insert({
      listing_id: listingId,
      sender_id: user.id,
      sender_email: user.email,
      receiver_id: sellerId,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Reply from seller to buyer
export async function replyMessage({ listingId, buyerId, buyerEmail, message }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('listing_messages')
    .insert({
      listing_id: listingId,
      sender_id: user.id,
      sender_email: user.email,
      receiver_id: buyerId,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get thread for a listing (all messages between current user and the other party)
export async function getThread(listingId) {
  const { data, error } = await supabase
    .from('listing_messages')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Get all conversations for inbox (grouped by listing)
export async function getInbox() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('listing_messages')
    .select(`
      *,
      listing:listings(id, title, brand, images, seller_id)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Group by listing_id, keep only the latest message per listing
  const seen = new Set()
  return (data || []).filter(m => {
    if (seen.has(m.listing_id)) return false
    seen.add(m.listing_id)
    return true
  })
}

// Count unread messages (received, not yet read)
export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('listing_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .is('read_at', null)

  if (error) return 0
  return count || 0
}

// Mark all messages in a thread as read
export async function markThreadRead(listingId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('listing_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('listing_id', listingId)
    .eq('receiver_id', user.id)
    .is('read_at', null)
}
