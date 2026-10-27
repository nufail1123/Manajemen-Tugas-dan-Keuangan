<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'

defineProps<{ label: string; value: string; icon: LucideIcon; tone: 'primary' | 'secondary' | 'error' | 'tertiary' }>()

// Ditulis utuh supaya Tailwind bisa mendeteksinya
const box = {
  primary: 'bg-primary text-white', secondary: 'bg-accent text-ink',
  error: 'bg-error text-white', tertiary: 'bg-tertiary-container text-ink',
}
const text = { primary: 'text-on-surface', secondary: 'text-secondary', error: 'text-error', tertiary: 'text-tertiary' }
</script>

<template>
  <div class="group bg-white border-2 border-ink p-space-lg shadow-hard flex flex-col justify-between transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-xl">
    <div class="flex items-center justify-between">
      <span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">{{ label }}</span>
      <div :class="['w-9 h-9 border-2 border-ink flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110', box[tone]]"><component :is="icon" :size="20" /></div>
    </div>
    <div class="mt-4">
      <!-- Angka mono tebal; ukuran mengikuti lebar layar agar nominal besar tidak terpotong -->
      <div :class="['font-label-md font-bold tracking-tight truncate leading-tight [font-size:clamp(1.4rem,2.2vw,2.1rem)]', text[tone]]">{{ value }}</div>
      <div class="flex items-center justify-between mt-2 font-body-sm text-body-sm text-on-surface-variant"><slot /></div>
    </div>
  </div>
</template>
