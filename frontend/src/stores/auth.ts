import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isAxiosError } from 'axios'
import { api, TOKEN_KEY } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { AuthResponse, User } from '@/types'

// Sesi pengguna: token JWT (disimpan di localStorage) + profil
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const initials = computed(() =>
    (user.value?.name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join(''))

  function setSession(res: AuthResponse) {
    token.value = res.token
    user.value = res.user
    localStorage.setItem(TOKEN_KEY, res.token)
    queryClient.clear() // data pengguna sebelumnya tidak boleh terbawa
  }
  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    queryClient.clear()
  }
  /** Periksa token yang tersimpan ke server dan ambil profil. false = sesi tidak valid. */
  async function loadUser() {
    if (!token.value) return false
    if (user.value) return true
    try {
      user.value = (await api.get<User>('/auth/me')).data
      return true
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 401) { clearSession(); return false }
      return true // server mati/jaringan putus: jangan paksa keluar
    }
  }
  return { token, user, isLoggedIn, initials, setSession, clearSession, loadUser }
})
