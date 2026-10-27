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
      <AlertDialogOverlay class="fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-fade" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-2 border-ink bg-white p-space-lg shadow-hard-xl focus:outline-none data-[state=open]:animate-pop-center"
      >
        <div class="flex items-start gap-space-md">
          <div v-if="icon" :class="cn('w-10 h-10 shrink-0 border-2 border-ink flex items-center justify-center', danger ? 'bg-error text-white' : 'bg-accent text-ink')">
            <component :is="icon" :size="20" />
          </div>
          <div class="flex flex-col gap-1">
            <AlertDialogTitle class="font-headline-md text-xl tracking-[-0.02em] font-extrabold text-ink">{{ title }}</AlertDialogTitle>
            <AlertDialogDescription class="font-body-md text-body-md text-on-surface-variant">{{ description }}</AlertDialogDescription>
          </div>
        </div>
        <div class="mt-space-md flex flex-col gap-space-sm"><slot /></div>
        <div class="mt-space-lg flex justify-end gap-space-sm">
          <AlertDialogCancel :disabled="loading"
            class="px-4 py-2 border-2 border-ink bg-white text-on-surface font-label-md text-label-md font-bold tracking-wide shadow-hard-sm hover:bg-accent hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-60">
            {{ cancelLabel ?? 'Batal' }}
          </AlertDialogCancel>
          <button type="button" :disabled="loading || confirmDisabled" @click="$emit('confirm')"
            :class="cn('px-4 py-2 border-2 border-ink font-label-md text-label-md font-bold tracking-wide shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50',
              danger ? 'bg-error text-on-error' : 'bg-primary text-on-primary hover:bg-primary-fixed')">
            {{ loading ? 'Memproses...' : confirmLabel }}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
