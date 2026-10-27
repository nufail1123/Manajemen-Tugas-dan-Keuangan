<script setup lang="ts">
import { Star } from 'lucide-vue-next'

// Pita hijau limau yang bergulir tanpa henti (dijeda saat kursor di atasnya).
// Isi digandakan dua kali supaya putaran -50% terlihat mulus tanpa celah.
withDefaults(defineProps<{ items?: string[] }>(), {
  items: () => ['Tugas', 'Keuangan', 'WhatsApp Reminder', 'H-3', 'H-1', 'Cron 08.00 WIB', 'Kategori Kustom', 'TaskFlow'],
})
</script>

<template>
  <div class="overflow-hidden border-b-2 border-ink bg-ink text-accent select-none" aria-hidden="true">
    <div class="flex w-max animate-marquee hover:[animation-play-state:paused]">
      <div v-for="g in 2" :key="g" class="flex shrink-0 items-center">
        <template v-for="n in 2" :key="n">
          <span v-for="(w, i) in items" :key="`${n}-${i}`" class="flex items-center gap-6 pl-6 py-2.5 font-label-md text-label-md font-bold uppercase tracking-[0.18em] whitespace-nowrap">
            {{ w }} <Star :size="14" class="fill-current text-tertiary-container" />
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
