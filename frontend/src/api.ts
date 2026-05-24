/// <reference types="vite/client" />

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let token: string | null = localStorage.getItem('nexus_token')

export function setToken(t: string) {
  token = t
  localStorage.setItem('nexus_token', t)
}

export function getToken() { return token }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// Auth
export const authLogin = (email: string, password: string) =>
  request<{ access_token: string; user_id: string; full_name: string; is_admin: boolean }>(
    '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
  )

export const authRegister = (email: string, password: string, full_name: string) =>
  request<{ access_token: string; user_id: string; full_name: string; is_admin: boolean }>(
    '/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name }) }
  )

export const authTelegram = (initData: string) =>
  request<{ access_token: string }>(
    '/auth/telegram', { method: 'POST', body: JSON.stringify({ init_data: initData }) }
  )

export const authGuest = () =>
  request<{ access_token: string }>(
    '/api/auth/guest', { method: 'POST' }
  )

// Profile
export const saveProfile = (data: object) =>
  request<{ profile: object; completeness: number; stage: string }>('/profile', {
    method: 'POST', body: JSON.stringify(data)
  })

export const getProfile = () =>
  request<{ profile: object | null; completeness: number }>('/profile')

// Ideas
export const generateIdeas = () =>
  request<{ session_id: string; status: string }>('/ideas/generate', { method: 'POST' })

export const getSessionStatus = (sessionId: string) =>
  request<{
    session_id: string
    status: string
    ideas: any[]
    contradictions: any[]
    generation_warnings: string[]
    error: string | null
  }>(`/ideas/session/${sessionId}`)

export const selectIdea = (sessionId: string, ideaId: string) =>
  request<{ ok: boolean }>(`/ideas/session/${sessionId}/select/${ideaId}`, { method: 'POST' })

// Financial
export const createFinancialModel = (sessionId: string, ideaId: string, adj?: object) =>
  request<object>(`/financial/model/${sessionId}/${ideaId}`, {
    method: 'POST',
    body: JSON.stringify(adj || {}),
  })

export const getFinancialModel = (sessionId: string, ideaId: string) =>
  request<object>(`/financial/model/${sessionId}/${ideaId}`)
