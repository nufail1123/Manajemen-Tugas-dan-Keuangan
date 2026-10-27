<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { X, type LucideIcon } from 'lucide-vue-next'

defineProps<{ title: string; description?: string; icon?: LucideIcon }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-fade" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-ink bg-white shadow-hard-xl focus:outline-none data-[state=open]:animate-pop-center"
      >
        <div class="p-space-lg flex items-center justify-between bg-accent border-b-2 border-ink">
          <div class="flex items-center gap-2">
            <div v-if="icon" class="w-8 h-8 bg-ink text-accent flex items-center justify-center">
              <component :is="icon" :size="18" />
            </div>
            <div>
              <DialogTitle class="font-headline-md text-xl tracking-[-0.02em] text-ink font-extrabold">{{ title }}</DialogTitle>
              <DialogDescription v-if="description" class="font-body-sm text-body-sm text-on-surface-variant">
                {{ description }}
              </DialogDescription>
            </div>
          </div>
          <DialogClose class="text-ink p-1 border-2 border-transparent hover:border-ink hover:bg-white hover:rotate-90 transition-all">
            <X :size="18" />
          </DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
