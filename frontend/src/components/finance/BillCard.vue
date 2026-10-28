<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import WaChip from '@/components/ui/WaChip.vue'
import { dueLabel, rupiah } from '@/lib/utils'
import type { Bill } from '@/types'

const props = defineProps<{
  bill: Bill
  showDelete?: boolean
}>()

defineEmits<{
  (e: 'delete', id: number | string): void
}>()

const due = () => dueLabel(props.bill.day)
</script>

<template>
  <div class="group p-space-md border-2 border-ink bg-surface-container flex flex-col gap-space-xs hover:bg-accent/40 hover:-translate-y-0.5 hover:shadow-hard-sm transition-all">
    <div class="flex items-start justify-between">
      <div>
        <div class="font-body-md text-body-md font-semibold text-on-surface">{{ bill.name }}</div>
        <div class="font-label-sm text-label-sm text-on-surface-variant">Jatuh tempo tiap tgl {{ String(bill.day).padStart(2, '0') }}</div>
      </div>
      <div class="font-label-md text-body-md text-on-surface font-semibold">{{ rupiah(bill.amount) }}</div>
    </div>
    <div class="flex items-center justify-between pt-1">
      <WaChip :h3="bill.remindH3" :h1="bill.remindH1" />
      <div class="flex items-center gap-2">
        <!-- Tombol hapus hanya muncul jika showDelete bernilai true -->
        <button
          v-if="showDelete"
          type="button"
          title="Hapus Tagihan"
          class="cursor-pointer p-1 border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white hover:border-ink text-on-surface"
          @click.stop="$emit('delete', bill.id)"
        >
          <Trash2 :size="15" />
        </button>
        <span :class="['font-label-sm text-label-sm', due().soon ? 'text-tertiary font-bold' : 'text-on-surface-variant']">
          {{ due().text }}
        </span>
      </div>
    </div>
  </div>
</template>