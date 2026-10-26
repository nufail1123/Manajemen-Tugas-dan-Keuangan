<script setup lang="ts">
import { chipTone, type Tone } from '@/lib/categories'
withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'neutral' })
</script>

<template>
  <span :class="['px-2 py-0.5 rounded font-label-sm text-label-sm shrink-0', chipTone[tone]]"><slot /></span>
</template>
