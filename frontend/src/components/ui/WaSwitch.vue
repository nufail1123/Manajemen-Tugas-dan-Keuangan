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
    <label v-for="i in items" :key="i.key" class="flex items-center justify-between gap-3 border-2 border-ink bg-white p-space-sm hover:bg-accent/30 transition-colors cursor-pointer">
      <span class="font-body-sm text-body-sm text-on-surface">{{ i.label }}</span>
      <SwitchRoot
        :model-value="i.key === 'h3' ? h3 : h1"
        @update:model-value="(v: boolean) => (i.key === 'h3' ? (h3 = v) : (h1 = v))"
        class="relative h-6 w-11 shrink-0 rounded-full border-2 border-ink bg-white transition-colors data-[state=checked]:bg-accent"
      >
        <SwitchThumb class="block h-4 w-4 translate-x-[2px] rounded-full bg-ink transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
      </SwitchRoot>
    </label>
  </div>
</template>
