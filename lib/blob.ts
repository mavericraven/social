import { put, list, del } from '@vercel/blob'

export async function uploadMedia(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const blob = await put(filename, file, {
    access: 'public',
    contentType,
  })
  return { url: blob.url, path: blob.pathname }
}

export async function listMedia(prefix: string): Promise<any[]> {
  const { blobs } = await list({ prefix })
  return blobs
}

export async function deleteMedia(path: string): Promise<void> {
  await del(path)
}

export async function getMediaUrl(path: string): Promise<string | null> {
  const { blobs } = await list({ prefix: path })
  return blobs[0]?.url || null
}
