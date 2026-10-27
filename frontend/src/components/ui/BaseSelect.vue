<script setup lang="ts">
import { SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator } from 'reka-ui'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps<{ options: { value: string; label: string }[]; placeholder?: string; class?: string }>()
const model = defineModel<string>()
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      :class="cn('inline-flex w-full items-center justify-between gap-2 border-2 border-ink bg-white px-3 py-2.5 font-body-md text-body-md text-on-surface hover:bg-accent/40 hover:shadow-hard-sm focus:outline-none focus:shadow-hard-sm data-[state=open]:shadow-hard-sm transition-all data-[placeholder]:text-outline', $props.class)"
    >
      <SelectValue :placeholder="placeholder ?? 'Pilih...'" />
      <ChevronDown :size="16" class="text-on-surface-variant shrink-0" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper" :side-offset="6" class="z-[70] min-w-[var(--reka-select-trigger-width)] overflow-hidden border-2 border-ink bg-white shadow-hard data-[state=open]:animate-pop">
        <SelectViewport class="p-1">
          <SelectItem
            v-for="o in options" :key="o.value" :value="o.value"
            class="relative flex cursor-pointer select-none items-center py-2 pl-8 pr-3 font-body-md text-body-md text-on-surface outline-none data-[highlighted]:bg-accent data-[state=checked]:font-bold"
          >
            <SelectItemIndicator class="absolute left-2"><Check :size="14" class="text-ink" :stroke-width="3" /></SelectItemIndicator>
            <SelectItemText>{{ o.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
