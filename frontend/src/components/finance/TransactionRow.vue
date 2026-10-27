<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import Chip from '@/components/ui/Chip.vue'
import { catMeta, iconTone } from '@/lib/categories'
import { fmtDateTime, signedRupiah } from '@/lib/utils'
import type { Transaction } from '@/types'

const props = defineProps<{ tx: Transaction }>()
defineEmits<{ edit: []; remove: [] }>()
const meta = () => catMeta(props.tx.category)
</script>

<template>
  <div class="group p-space-md bg-white hover:bg-accent/25 transition-colors flex items-center justify-between gap-space-sm">
    <div class="flex items-center gap-space-md min-w-0">
      <div :class="['w-10 h-10 flex items-center justify-center shrink-0', iconTone[meta().tone]]">
        <component :is="meta().icon" :size="20" />
      </div>
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-headline-sm text-body-lg font-medium text-on-surface truncate">{{ tx.description }}</span>
          <Chip :tone="meta().tone">{{ tx.category }}</Chip>
        </div>
        <div class="flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant mt-0.5">
          <span v-if="tx.method" class="text-primary font-medium">{{ tx.method }}</span>
          <span v-if="tx.method">•</span>
          <span>{{ fmtDateTime(tx.date) }}</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-space-md shrink-0">
      <div class="text-right">
        <div :class="['font-label-md text-body-lg font-bold', tx.type === 'income' ? 'text-secondary' : 'text-error']">
          {{ signedRupiah(tx.amount, tx.type) }}
        </div>
        <div class="font-label-sm text-label-sm text-outline">{{ tx.type === 'income' ? 'Berhasil' : 'Pengeluaran' }}</div>
      </div>
      <button type="button" title="Ubah" class="p-1 border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all hover:bg-accent hover:border-ink text-on-surface" @click="$emit('edit')">
        <Pencil :size="18" />
      </button>
      <button type="button" title="Hapus" class="p-1 border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white hover:border-ink text-on-surface" @click="$emit('remove')">
        <Trash2 :size="18" />
      </button>
    </div>
  </div>
</template>
