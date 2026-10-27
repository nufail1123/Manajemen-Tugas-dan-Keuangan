<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ h3: boolean; h1: boolean }>()
const label = computed(() =>
  props.h3 && props.h1 ? 'WA: H-3 & H-1 Aktif' : props.h3 ? 'WA: H-3 Aktif' : props.h1 ? 'WA: H-1 Aktif' : 'WA Nonaktif')
const on = computed(() => props.h3 || props.h1)
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border-2 font-label-sm text-label-sm font-bold shrink-0',
    on ? 'bg-accent text-ink border-ink' : 'bg-surface-container text-outline border-outline-variant']">
    <span :class="['w-1.5 h-1.5 rounded-full', on ? 'bg-ink animate-pulse' : 'bg-outline']" />{{ label }}
  </span>
</template>
