<script setup lang="ts">
import { computed } from 'vue'
import Marquee from '@/components/ui/Marquee.vue'

const props = defineProps<{ section: string; title: string; subtitle: string }>()
// Kata terakhir judul berwarna biru + kursor berkedip ("FRONTEND_"), kata sebelumnya hitam
const words = computed(() => props.title.split(' '))
</script>

<template>
  <div>
    <section class="w-full px-margin-lg py-space-xl border-b-2 border-ink">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div class="flex flex-col gap-space-sm min-w-0">
          <div class="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant animate-rise">
            <span>Personal Space</span><span>/</span>
            <span class="bg-primary text-white px-1.5 py-0.5 font-bold">{{ section }}</span>
          </div>
          <h1 class="font-headline-xl font-extrabold leading-[.95] tracking-[-0.045em] text-ink [font-size:clamp(2.25rem,5.2vw,4.25rem)]">
            <span
              v-for="(w, i) in words" :key="i" class="inline-block mr-[.22em] animate-rise"
              :style="{ animationDelay: `${80 + i * 90}ms` }"
            >
              <span v-if="i === words.length - 1" class="inline-block -rotate-1 bg-accent border-2 border-ink px-2.5 shadow-hard">{{ w }}<span class="text-primary animate-blink">_</span></span>
              <template v-else>{{ w }}</template>
            </span>
          </h1>
          <p class="max-w-2xl font-body-md text-body-md text-on-surface-variant animate-rise [animation-delay:260ms]">{{ subtitle }}</p>
        </div>
        <div class="flex items-center gap-space-sm self-start lg:self-auto animate-rise [animation-delay:320ms]"><slot name="actions" /></div>
      </div>
    </section>
    <Marquee />
  </div>
</template>
