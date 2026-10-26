<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'

defineProps<{ label: string; value: string; icon: LucideIcon; tone: 'primary' | 'secondary' | 'error' | 'tertiary' }>()

// Ditulis utuh supaya Tailwind bisa mendeteksinya
const glow = { primary: 'bg-primary/10', secondary: 'bg-secondary/10', error: 'bg-error/10', tertiary: 'bg-tertiary/10' }
const box = {
  primary: 'bg-primary-container/20 text-primary', secondary: 'bg-secondary-container/20 text-secondary',
  error: 'bg-error-container/30 text-error', tertiary: 'bg-tertiary-container/30 text-tertiary',
}
const text = { primary: 'text-on-surface', secondary: 'text-secondary', error: 'text-error', tertiary: 'text-tertiary' }
</script>

<template>
  <div class="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden hover:bg-surface-container transition-colors">
    <div :class="['absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none', glow[tone]]" />
    <div class="flex items-center justify-between">
      <span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{{ label }}</span>
      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', box[tone]]"><component :is="icon" :size="20" /></div>
    </div>
    <div class="mt-4">
      <!-- Semua kartu memakai ukuran yang sama (headline-xl) agar angka besar tidak terpotong -->
      <div :class="['font-headline-xl text-headline-xl font-semibold truncate', text[tone]]">{{ value }}</div>
      <div class="flex items-center justify-between mt-2 font-body-sm text-body-sm text-on-surface-variant"><slot /></div>
    </div>
  </div>
</template>
