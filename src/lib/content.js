import { signStoragePath, supabase } from './supabase'

export const contentTables = ['gallery_images', 'videos', 'important_updates', 'downloadable_documents']
export async function listContent(table, { admin = false, limit = 100 } = {}) {
  if (!supabase) return []
  let query = supabase.from(table).select('*')
  if (table === 'important_updates') query = query.order('is_pinned', { ascending: false }).order('published_at', { ascending: false })
  else query = query.order('created_at', { ascending: false })
  query = query.limit(limit)
  if (!admin) {
    query = query.eq('published', true)
    if (table === 'important_updates') query = query.or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().slice(0, 10)}`)
  }
  const { data, error } = await query
  if (error) throw error
  return Promise.all((data || []).map(async row => {
    const bucket = table === 'gallery_images' ? 'gallery' : table === 'videos' ? 'video-thumbnails' : 'documents'
    const paths = table === 'gallery_images' ? [['image_url','storage_path']] : table === 'videos' ? [['thumbnail_url','storage_path']] : table === 'important_updates' ? [['attachment_url','attachment_storage_path']] : [['file_url','storage_path']]
    const next = { ...row }
    for (const [urlKey,pathKey] of paths) if (next[pathKey]) next[urlKey] = await signStoragePath(bucket, next[pathKey])
    return next
  }))
}
export async function saveContent(table, row, id) {
  if (!supabase) throw new Error('Supabase is not configured. See README setup steps.')
  const result = id ? await supabase.from(table).update(row).eq('id', id).select().single() : await supabase.from(table).insert(row).select().single()
  if (result.error) throw result.error
  return result.data
}
export async function removeContent(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
export async function getSchoolProfile() {
  if (!supabase) return null
  const { data, error } = await supabase.from('school_profile').select('*').limit(1).maybeSingle()
  if (error) throw error
  if (!data) return data
  const [logo, hero, principal] = await Promise.all([signStoragePath('school-assets', data.logo_storage_path), signStoragePath('school-assets', data.hero_storage_path), signStoragePath('school-assets', data.principal_image_storage_path)])
  return { ...data, logo_url: data.logo_storage_path ? logo : data.logo_url, hero_image_url: data.hero_storage_path ? hero : data.hero_image_url, principal_image_url: data.principal_image_storage_path ? principal : data.principal_image_url }
}
export async function saveSchoolProfile(row, id) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = id ? await supabase.from('school_profile').update(row).eq('id', id).select().single() : await supabase.from('school_profile').insert(row).select().single()
  if (error) throw error
  return data
}
