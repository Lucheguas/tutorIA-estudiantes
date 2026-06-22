import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://llm.mystic-byte.com/api/v1'
const API_KEY = import.meta.env.VITE_API_KEY ?? 'etutor-dev-key-2026'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }
  // Fallback to API key
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, { headers })
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export { API_URL, API_KEY }
