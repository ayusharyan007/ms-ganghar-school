import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
export const configured = Boolean(url && key && !url.includes('your-project'))
export const supabase = configured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null

export async function signStoragePath(bucket, path) {
  if (!supabase || !path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

export function publicQuery(table) {
  if (!supabase) return Promise.resolve({ data: [], error: null })
  return supabase.from(table).select('*').order('created_at', { ascending: false })
}

export async function uploadFile(bucket, file, { maxBytes = 10 * 1024 * 1024, allowed = [] } = {}) {
  if (!supabase) throw new Error('Connect Supabase in .env.local before uploading files.')
  if (allowed.length && !allowed.includes(file.type)) throw new Error('This file type is not allowed.')
  let upload = file
  if (file.type.startsWith('image/')) upload = await compressImage(file)
  if (upload.size > maxBytes) throw new Error(`File must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB after image compression.`)
  const safeName = file.name.normalize('NFKD').replace(/[^\w.-]+/g, '-').toLowerCase().replace(/\.[^.]+$/, upload.type === 'image/webp' ? '.webp' : '')
  const path = `${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from(bucket).upload(path, upload, { upsert: false, contentType: upload.type })
  if (error) throw error
  const url = await signStoragePath(bucket, path)
  return { path, url }
}
export async function removeStorageFile(bucket, path) {
  if (!supabase || !path) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const source = URL.createObjectURL(file)
    image.onload = () => {
      const scale = Math.min(1, 2000 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(source)
      canvas.toBlob(blob => blob ? resolve(new File([blob], file.name, { type: 'image/webp', lastModified: Date.now() })) : reject(new Error('Could not compress this image.')), 'image/webp', 0.82)
    }
    image.onerror = () => { URL.revokeObjectURL(source); reject(new Error('Could not read this image.')) }
    image.src = source
  })
}
