<script setup lang="ts">
import { AlertDialogRoot, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from 'reka-ui'
import type { LucideIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Dialog "Yakin atau tidak?". Tombol konfirmasi tidak menutup dialog otomatis,
// supaya proses async (dan pesan error) bisa ditampilkan sebelum dialog ditutup.
defineProps<{
  title: string; description: string; confirmLabel: string; cancelLabel?: string
  danger?: boolean; loading?: boolean; confirmDisabled?: boolean; icon?: LucideIcon
}>()
const open = defineModel<boolean>('open', { default: false })
defineEmits<{ confirm: [] }>()
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-container-low p-space-lg shadow-2xl focus:outline-none"
      >
        <div class="flex items-start gap-space-md">
          <div v-if="icon" :class="cn('w-10 h-10 shrink-0 rounded-lg flex items-center justify-center', danger ? 'bg-error-container/40 text-error' : 'bg-primary/20 text-primary')">
            <component :is="icon" :size="20" />
          </div>
          <div class="flex flex-col gap-1">
            <AlertDialogTitle class="font-headline-sm text-headline-sm font-semibold text-on-surface">{{ title }}</AlertDialogTitle>
            <AlertDialogDescription class="font-body-md text-body-md text-on-surface-variant">{{ description }}</AlertDialogDescription>
          </div>
        </div>
        <div class="mt-space-md flex flex-col gap-space-sm"><slot /></div>
        <div class="mt-space-lg flex justify-end gap-space-sm">
          <AlertDialogCancel :disabled="loading"
            class="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container-high transition-colors disabled:opacity-60">
            {{ cancelLabel ?? 'Batal' }}
          </AlertDialogCancel>
          <button type="button" :disabled="loading || confirmDisabled" @click="$emit('confirm')"
            :class="cn('px-4 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-colors disabled:opacity-50',
              danger ? 'bg-error text-on-error hover:bg-error/90' : 'bg-primary text-on-primary hover:bg-primary-fixed')">
            {{ loading ? 'Memproses...' : confirmLabel }}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
