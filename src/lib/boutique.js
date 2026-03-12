import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function getListings({ category, brand, limit = 50 } = {}) {
  let q = supabase.from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(limit)
  if (category) q = q.eq('category', category)
  if (brand) q = q.ilike('brand', `%${brand}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getListing(id) {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single()
  if (error) throw error
  // increment views
  supabase.from('listings').update({ views: (data.views || 0) + 1 }).eq('id', id)
  return data
}

export async function createListing(listing) {
  const { data, error } = await supabase.from('listings').insert([listing]).select().single()
  if (error) throw error
  return data
}

export async function updateListing(id, updates) {
  const { data, error } = await supabase.from('listings').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) throw error
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export async function uploadListingImage(file, sellerId) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG and WebP images are accepted')
  }
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `listings/${sellerId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('wardrobe').upload(path, file, { upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('wardrobe').getPublicUrl(path)
  return publicUrl
}

export const BRANDS = [
  'Louis Vuitton', 'Hermès', 'Chanel', 'Prada', 'Gucci', 'Dior', 'Bottega Veneta',
  'Saint Laurent', 'Balenciaga', 'Valentino', 'Givenchy', 'Celine', 'Loewe', 'Loro Piana',
  'Brunello Cucinelli', 'Jacquemus', 'Toteme', 'The Row', 'Acne Studios', 'Maison Margiela',
  'Rick Owens', 'Jil Sander', 'Isabel Marant', 'A.P.C.', 'Other'
]

export const CONDITIONS = [
  { value: 'new_tags', label: 'New with tags', desc: 'Never worn, original tags attached' },
  { value: 'new_no_tags', label: 'New without tags', desc: 'Never worn, tags removed' },
  { value: 'excellent', label: 'Excellent', desc: 'Worn once or twice, pristine' },
  { value: 'very_good', label: 'Very good', desc: 'Minimal signs of wear' },
  { value: 'good', label: 'Good', desc: 'Some light signs of wear' },
]

export const CATEGORIES = [
  'Bags', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Jewellery', 'Scarves', 'Other'
]
