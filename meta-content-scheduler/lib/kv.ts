import { kv } from '@vercel/kv'

export { kv }

export async function set(key: string, value: string, options?: { ex?: number }) {
  await kv.set(key, value, options)
}

export async function get<T>(key: string): Promise<T | null> {
  const value = await kv.get(key)
  return value ? JSON.parse(value) : null
}

export async function del(key: string | string[]) {
  await kv.del(key)
}

export async function incr(key: string): Promise<number> {
  return await kv.incr(key)
}

export async function expire(key: string, seconds: number) {
  await kv.expire(key, seconds)
}

export async function keys(pattern: string): Promise<string[]> {
  const keys = await kv.keys(pattern)
  return keys
}
