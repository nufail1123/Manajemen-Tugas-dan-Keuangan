<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Kolom pencarian bersama (halaman Tugas & Keuangan). Ikon dipusatkan secara vertikal
// dengan top-1/2 + -translate-y-1/2, sehingga tetap sejajar dengan teks berapa pun tinggi input-nya.
defineProps<{ placeholder?: string; class?: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div :class="cn('group relative', $props.class)">
    <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface transition-colors group-focus-within:text-primary" />
    <input
      v-model="model" type="text" :placeholder="placeholder ?? 'Cari...'" :aria-label="placeholder ?? 'Cari'"
      class="h-9 w-full border-2 border-ink bg-white pl-9 pr-8 font-body-sm text-body-sm leading-none text-on-surface placeholder:text-outline focus:outline-none focus:shadow-hard-sm focus:-translate-x-px focus:-translate-y-px transition-all"
    />
    <button
      v-if="model" type="button" aria-label="Hapus pencarian" @click="model = ''"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-on-surface-variant hover:bg-accent hover:text-on-surface transition-colors"
    ><X :size="14" /></button>
  </div>
</template>
