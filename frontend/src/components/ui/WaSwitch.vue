<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

// Dua saklar terpisah: pengingat H-3 dan H-1 bisa dipilih sendiri-sendiri
const h3 = defineModel<boolean>('h3', { default: true })
const h1 = defineModel<boolean>('h1', { default: true })
const items = [
  { key: 'h3', label: 'Ingatkan H-3 (3 hari sebelumnya)' },
  { key: 'h1', label: 'Ingatkan H-1 (1 hari sebelumnya)' },
] as const
</script>

<template>
  <div class="flex flex-col gap-space-xs">
    <label v-for="i in items" :key="i.key" class="flex items-center justify-between gap-3 rounded-lg bg-surface-container p-space-sm">
      <span class="font-body-sm text-body-sm text-on-surface">{{ i.label }}</span>
      <SwitchRoot
        :model-value="i.key === 'h3' ? h3 : h1"
        @update:model-value="(v: boolean) => (i.key === 'h3' ? (h3 = v) : (h1 = v))"
        class="relative h-5 w-9 shrink-0 rounded-full bg-surface-container-highest transition-colors data-[state=checked]:bg-secondary-container"
      >
        <SwitchThumb class="block h-4 w-4 translate-x-0.5 rounded-full bg-on-surface transition-transform data-[state=checked]:translate-x-[18px]" />
      </SwitchRoot>
    </label>
  </div>
</template>
