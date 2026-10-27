<script setup lang="ts">
import { chipTone, type Tone } from '@/lib/categories'
withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'neutral' })
</script>

<template>
  <span :class="['px-2 py-0.5 border-2 font-label-sm text-label-sm font-bold uppercase tracking-wider shrink-0 transition-transform hover:-rotate-2 hover:scale-105', chipTone[tone]]"><slot /></span>
</template>
