<script setup lang="ts">
import WaChip from '@/components/ui/WaChip.vue'
import { dueLabel, rupiah } from '@/lib/utils'
import type { Bill } from '@/types'

const props = defineProps<{ bill: Bill }>()
const due = () => dueLabel(props.bill.day)
</script>

<template>
  <div class="p-space-md border-2 border-ink bg-surface-container flex flex-col gap-space-xs hover:bg-accent/40 hover:-translate-y-0.5 hover:shadow-hard-sm transition-all">
    <div class="flex items-start justify-between">
      <div>
        <div class="font-body-md text-body-md font-semibold text-on-surface">{{ bill.name }}</div>
        <div class="font-label-sm text-label-sm text-on-surface-variant">Jatuh tempo tiap tgl {{ String(bill.day).padStart(2, '0') }}</div>
      </div>
      <div class="font-label-md text-body-md text-on-surface font-semibold">{{ rupiah(bill.amount) }}</div>
    </div>
    <div class="flex items-center justify-between pt-1">
      <WaChip :h3="bill.remindH3" :h1="bill.remindH1" />
      <span :class="['font-label-sm text-label-sm', due().soon ? 'text-tertiary font-bold' : 'text-on-surface-variant']">{{ due().text }}</span>
    </div>
  </div>
</template>