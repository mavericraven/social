import { kv, get, set, del, keys, expire } from '../kv'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
}

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await kv.get(key)
  return data ? JSON.parse(data) : null
}

export async function setCached<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  const ttl = options?.ttl || 3600 // Default 1 hour
  await set(key, JSON.stringify(value), { ex: ttl })
}

export async function deleteCached(key: string): Promise<void> {
  await del(key)
}

export async function deleteCachedPattern(pattern: string): Promise<void> {
  const matchedKeys = await keys(pattern)
  if (matchedKeys.length > 0) {
    await del(matchedKeys)
  }
}

export async function getMultipleCached<T>(keyPrefix: string): Promise<Map<string, T>> {
  const pattern = `${keyPrefix}:*`
  const matchedKeys = await keys(pattern)
  const result = new Map<string, T>()
  
  for (const key of matchedKeys) {
    const value = await getCached<T>(key)
    if (value !== null) {
      result.set(key, value)
    }
  }
  
  return result
}

export async function setMultipleCached<T>(
  items: Map<string, T>,
  options?: CacheOptions
): Promise<void> {
  for (const [key, value] of items.entries()) {
    await setCached(key, value, options)
  }
}

export async function invalidateCachePattern(pattern: string): Promise<number> {
  const matchedKeys = await keys(pattern)
  if (matchedKeys.length === 0) return 0
  
  await del(matchedKeys)
  return matchedKeys.length
}

export async function refreshCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return cached
  }
  
  const value = await fetchFn()
  await setCached(key, value, options)
  return value
}

export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<{ data: T; fromCache: boolean }> {
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return { data: cached, fromCache: true }
  }
  
  const data = await fetchFn()
  await setCached(key, data, options)
  return { data, fromCache: false }
}

export async function getCacheStats(pattern: string): Promise<{
  totalKeys: number
  totalSize: number
}> {
  const matchedKeys = await keys(pattern)
  let totalSize = 0
  
  for (const key of matchedKeys) {
    const data = await kv.get(key)
    if (data) {
      totalSize += Buffer.byteLength(data, 'utf8')
    }
  }
  
  return {
    totalKeys: matchedKeys.length,
    totalSize,
  }
}

export async function extendCache(key: string, ttl: number): Promise<void> {
  await expire(key, ttl)
}

export async function setCachedIfAbsent<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  const existing = await getCached<T>(key)
  if (existing !== null) {
    return false // Already exists
  }
  
  await setCached(key, value, options)
  return true // Successfully set
}
