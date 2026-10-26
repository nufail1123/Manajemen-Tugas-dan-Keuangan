<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ h3: boolean; h1: boolean }>()
const label = computed(() =>
  props.h3 && props.h1 ? 'WA: H-3 & H-1 Aktif' : props.h3 ? 'WA: H-3 Aktif' : props.h1 ? 'WA: H-1 Aktif' : 'WA Nonaktif')
const on = computed(() => props.h3 || props.h1)
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm shrink-0',
    on ? 'bg-secondary-container/15 text-secondary' : 'bg-surface-container text-outline']">
    <span :class="['w-1.5 h-1.5 rounded-full', on ? 'bg-secondary' : 'bg-outline']" />{{ label }}
  </span>
</template>
