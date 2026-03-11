import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)

// ──────────────────────────────────────────────
// Wardrobe helpers
// ──────────────────────────────────────────────

export async function uploadClothingImage(file, userId) {
  const ext = file.name.split('.').pop()
  const filename = `${userId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('wardrobe')
    .upload(filename, file, { upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage
    .from('wardrobe')
    .getPublicUrl(filename)
  return publicUrl
}

export async function saveWardrobeItem(item) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert([item])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getWardrobeItems(userId) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteWardrobeItem(id, imagePath) {
  if (imagePath) {
    const path = imagePath.split('/wardrobe/')[1]
    if (path) await supabase.storage.from('wardrobe').remove([path])
  }
  const { error } = await supabase.from('wardrobe_items').delete().eq('id', id)
  if (error) throw error
}

export async function saveOutfit(outfit) {
  const { data, error } = await supabase
    .from('saved_outfits')
    .insert([outfit])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSavedOutfits(userId) {
  const { data, error } = await supabase
    .from('saved_outfits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteOutfit(id) {
  const { error } = await supabase.from('saved_outfits').delete().eq('id', id)
  if (error) throw error
}
