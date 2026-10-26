import axios, { isAxiosError } from 'axios'
import { mockAdapter } from './mock'

export const TOKEN_KEY = 'taskflow-token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  adapter: import.meta.env.VITE_USE_MOCK === 'true' ? mockAdapter : undefined,
})

// main.ts mendaftarkan fungsi ini (hapus sesi + arahkan ke /masuk) supaya api.ts tidak bergantung pada router/store
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

// Semua request membawa token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

// 401 di luar login/daftar = token tidak valid atau kedaluwarsa -> keluar otomatis
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = String(error.config?.url ?? '')
    const method = String(error.config?.method ?? 'get').toLowerCase()
    const isCredentialCall = url.startsWith('/auth/login') || url.startsWith('/auth/register')
    const isSessionProbe = url === '/auth/me' && method === 'get' // ditangani sendiri oleh store.loadUser()
    if (isAxiosError(error) && error.response?.status === 401 && !isCredentialCall && !isSessionProbe) onUnauthorized?.()
    return Promise.reject(error)
  },
)
