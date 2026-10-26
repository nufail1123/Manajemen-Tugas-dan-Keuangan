import axios from 'axios'
import { mockAdapter } from './mock'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  adapter: import.meta.env.VITE_USE_MOCK === 'true' ? mockAdapter : undefined,
})

// Contoh: tempel token auth di sini bila backend Go memakai JWT
api.interceptors.request.use((config) => config)
