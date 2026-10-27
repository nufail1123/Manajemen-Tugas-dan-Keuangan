import { Banknote, Home, ShoppingCart, TrainFront, BookOpen, Clapperboard, CircleEllipsis, type LucideIcon } from 'lucide-vue-next'

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'neutral'

// Class ditulis utuh agar terdeteksi Tailwind (jangan dibuat dinamis dengan template string)
export const chipTone: Record<Tone, string> = {
  primary: 'bg-primary text-white border-ink',
  secondary: 'bg-ink text-accent border-ink',
  tertiary: 'bg-tertiary-container text-ink border-ink',
  neutral: 'bg-white text-ink border-ink',
}
export const iconTone: Record<Tone, string> = {
  primary: 'bg-primary text-white border-2 border-ink',
  secondary: 'bg-accent text-ink border-2 border-ink',
  tertiary: 'bg-tertiary-container text-ink border-2 border-ink',
  neutral: 'bg-surface-container-high text-ink border-2 border-ink',
}

export interface TxCategory { value: string; label: string; icon: LucideIcon; tone: Tone }
export const txCategories: TxCategory[] = [
  { value: 'Gaji', label: 'Gaji & Pemasukan', icon: Banknote, tone: 'secondary' },
  { value: 'Makanan', label: 'Makanan & Minuman', icon: ShoppingCart, tone: 'primary' },
  { value: 'Tagihan', label: 'Tagihan & Hunian', icon: Home, tone: 'tertiary' },
  { value: 'Transportasi', label: 'Transportasi', icon: TrainFront, tone: 'neutral' },
  { value: 'Kuliah', label: 'Kuliah & Edukasi', icon: BookOpen, tone: 'primary' },
  { value: 'Hiburan', label: 'Hiburan & Lifestyle', icon: Clapperboard, tone: 'neutral' },
  { value: 'Lainnya', label: 'Lain-lain', icon: CircleEllipsis, tone: 'neutral' },
]
export const catMeta = (v: string) => txCategories.find((c) => c.value === v) ?? txCategories[6]

// Kategori tugas bawaan (dipakai sebagai cadangan bila backend belum punya /task-categories).
// Kategori buatan pengguna disimpan di backend dan dibaca lewat useTaskCategories().
export const defaultTaskCategories: { name: string; tone: Tone }[] = [
  { name: 'Q4 Roadmap', tone: 'primary' }, { name: 'DevOps', tone: 'secondary' }, { name: 'Personal', tone: 'neutral' },
  { name: 'Frontend', tone: 'primary' }, { name: 'Strategy', tone: 'tertiary' },
]
export const categoryTones: Tone[] = ['primary', 'secondary', 'tertiary', 'neutral']
// Warna titik pada pemilih warna (class utuh agar terdeteksi Tailwind)
export const toneDot: Record<Tone, string> = {
  primary: 'bg-primary', secondary: 'bg-ink', tertiary: 'bg-tertiary-container', neutral: 'bg-white',
}
export const MAX_TASK_CATEGORIES = 20
export const ALL_CATEGORIES = 'Semua' // nilai filter "semua kategori" -> nama ini tidak boleh dipakai kategori
