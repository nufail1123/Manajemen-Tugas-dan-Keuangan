import { Banknote, Home, ShoppingCart, TrainFront, BookOpen, Clapperboard, CircleEllipsis, type LucideIcon } from 'lucide-vue-next'

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'neutral'

// Class ditulis utuh agar terdeteksi Tailwind (jangan dibuat dinamis dengan template string)
export const chipTone: Record<Tone, string> = {
  primary: 'bg-primary-container/20 text-primary',
  secondary: 'bg-secondary-container/20 text-secondary',
  tertiary: 'bg-tertiary-container/20 text-tertiary',
  neutral: 'bg-surface-container text-on-surface-variant',
}
export const iconTone: Record<Tone, string> = {
  primary: 'bg-surface-container-high text-primary',
  secondary: 'bg-secondary-container/20 text-secondary',
  tertiary: 'bg-surface-container-high text-tertiary',
  neutral: 'bg-surface-container-high text-on-surface-variant',
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

export const taskCategories = ['Q4 Roadmap', 'DevOps', 'Personal', 'Frontend', 'Strategy']
export const taskTone: Record<string, Tone> = {
  'Q4 Roadmap': 'primary', DevOps: 'secondary', Personal: 'neutral', Frontend: 'primary', Strategy: 'tertiary',
}
