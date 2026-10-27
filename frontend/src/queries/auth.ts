import { useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { AuthResponse } from '@/types'
import type { LoginInput, RegisterInput } from '@/lib/schemas'

export function useLogin() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (v: LoginInput) => api.post<AuthResponse>('/auth/login', v).then((r) => r.data),
    onSuccess: (res) => auth.setSession(res),
  })
}

export function useRegister() {
  const auth = useAuthStore()
  return useMutation({
    // confirmPassword hanya untuk validasi di form, tidak dikirim. recaptchaToken diverifikasi backend ke Google.
    mutationFn: ({ confirmPassword: _c, ...body }: RegisterInput & { recaptchaToken: string }) =>
      api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
    onSuccess: (res) => auth.setSession(res), // backend langsung mengembalikan token -> otomatis masuk
  })
}

export function useLogout() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: async () => { try { await api.post('/auth/logout') } catch { /* tetap keluar di sisi klien */ } },
    onSettled: () => auth.clearSession(),
  })
}

export function useDeleteAccount() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (password: string) => api.delete('/auth/me', { data: { password } }),
    onSuccess: () => auth.clearSession(),
  })
}
