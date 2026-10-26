import { isAxiosError } from 'axios'

/** Ubah error axios menjadi pesan yang ramah pengguna. `byStatus` menimpa pesan untuk status tertentu. */
export function authError(e: unknown, byStatus: Record<number, string> = {}) {
  if (!isAxiosError(e)) return 'Terjadi kesalahan, coba lagi.'
  if (!e.response) return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
  const status = e.response.status
  if (byStatus[status]) return byStatus[status]
  if (status >= 500) return 'Server sedang bermasalah, coba beberapa saat lagi.'
  return (e.response.data as { error?: string } | undefined)?.error ?? 'Terjadi kesalahan, coba lagi.'
}

/** Hanya izinkan alamat internal (cegah open redirect) */
export const safeRedirect = (v: unknown) => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/')
