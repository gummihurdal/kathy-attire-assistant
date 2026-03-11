import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// LocalStorage fallback — works even before SQL tables are created
const LS_WARDROBE = 'kathy_wardrobe_items'
const LS_OUTFITS  = 'kathy_saved_outfits'

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function lsSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}
function lsUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export async function uploadClothingImage(file, userId) {
  try {
    const ext = file.name.split('.').pop()
    const filename = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('wardrobe').upload(filename, file, { upsert: false })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('wardrobe').getPublicUrl(filename)
    return publicUrl
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

export async function saveWardrobeItem(item) {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items').insert([item]).select().single()
    if (error) throw error
    return data
  } catch {
    const items = lsGet(LS_WARDROBE)
    const newItem = { ...item, id: lsUUID(), created_at: new Date().toISOString() }
    lsSet(LS_WARDROBE, [newItem, ...items])
    return newItem
  }
}

export async function getWardrobeItems(userId) {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const lsItems = lsGet(LS_WARDROBE).filter(i => i.user_id === userId)
    const dbIds = new Set(data.map(i => i.id))
    return [...data, ...lsItems.filter(i => !dbIds.has(i.id))]
  } catch {
    return lsGet(LS_WARDROBE).filter(i => !userId || i.user_id === userId)
  }
}

export async function deleteWardrobeItem(id, imagePath) {
  lsSet(LS_WARDROBE, lsGet(LS_WARDROBE).filter(i => i.id !== id))
  try {
    if (imagePath && imagePath.includes('/wardrobe/')) {
      const path = imagePath.split('/wardrobe/')[1]
      if (path) await supabase.storage.from('wardrobe').remove([path])
    }
    await supabase.from('wardrobe_items').delete().eq('id', id)
  } catch {}
}

export async function saveOutfit(outfit) {
  try {
    const { data, error } = await supabase
      .from('saved_outfits').insert([outfit]).select().single()
    if (error) throw error
    return data
  } catch {
    const outfits = lsGet(LS_OUTFITS)
    const newOutfit = { ...outfit, id: lsUUID(), created_at: new Date().toISOString() }
    lsSet(LS_OUTFITS, [newOutfit, ...outfits])
    return newOutfit
  }
}

export async function getSavedOutfits(userId) {
  try {
    const { data, error } = await supabase
      .from('saved_outfits').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const lsOutfits = lsGet(LS_OUTFITS).filter(i => i.user_id === userId)
    const dbIds = new Set(data.map(i => i.id))
    return [...data, ...lsOutfits.filter(i => !dbIds.has(i.id))]
  } catch {
    return lsGet(LS_OUTFITS).filter(i => !userId || i.user_id === userId)
  }
}

export async function deleteOutfit(id) {
  lsSet(LS_OUTFITS, lsGet(LS_OUTFITS).filter(i => i.id !== id))
  try { await supabase.from('saved_outfits').delete().eq('id', id) } catch {}
}
