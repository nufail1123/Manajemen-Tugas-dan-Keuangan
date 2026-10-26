import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { defaultTaskCategories, type Tone } from '@/lib/categories'
import type { TaskCategoryInput } from '@/lib/schemas'
import type { TaskCategory } from '@/types'
import { useCrud, useTasks } from './index'

// ---- Kategori tugas milik pengguna: GET/POST/DELETE /task-categories
export const useTaskCategories = () =>
  useQuery({
    queryKey: ['task-categories'],
    queryFn: async (): Promise<TaskCategory[]> => {
      try {
        return (await api.get<TaskCategory[]>('/task-categories')).data
      } catch (e) {
        if (!isAxiosError(e) || e.response?.status !== 404) throw e
        // 404 = endpoint belum ada di backend -> pakai kategori bawaan (hanya baca)
        return defaultTaskCategories.map((c) => ({ id: `default:${c.name}`, ...c }))
      }
    },
  })

export const useCreateTaskCategory = () =>
  useCrud(['task-categories'], (v: TaskCategoryInput) => api.post('/task-categories', v), 'Kategori ditambahkan')

// Backend menolak (409) bila kategori masih dipakai tugas; pesan errornya ditampilkan lewat toast
export const useDeleteTaskCategory = () =>
  useCrud(['task-categories'], (id: string) => api.delete(`/task-categories/${id}`), 'Kategori dihapus')

/**
 * Satu sumber kebenaran untuk kategori di seluruh aplikasi:
 * daftar dari backend + kategori yang masih dipakai tugas lama tetapi tidak ada di daftar
 * (supaya tugas lama tetap tampil rapi dan bisa difilter). Entri "tambahan" tidak punya id -> tidak bisa dihapus.
 */
export function useCategoryMeta() {
  const { data: remote, isLoading } = useTaskCategories()
  const { data: tasks } = useTasks()

  const categories = computed<(TaskCategory & { count: number; extra?: boolean })[]>(() => {
    const used: Record<string, number> = {}
    ;(tasks.value ?? []).forEach((t) => { used[t.category] = (used[t.category] ?? 0) + 1 })
    const list = (remote.value ?? []).map((c) => ({ ...c, count: used[c.name] ?? 0 }))
    const known = new Set(list.map((c) => c.name))
    const extra = Object.keys(used)
      .filter((n) => n && !known.has(n))
      .map((name) => ({ id: '', name, tone: 'neutral' as Tone, count: used[name], extra: true }))
    return [...list, ...extra]
  })
  const toneOf = (name: string): Tone => categories.value.find((c) => c.name === name)?.tone ?? 'neutral'
  return { categories, toneOf, isLoading }
}
