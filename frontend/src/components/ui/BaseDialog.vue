<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { X, type LucideIcon } from 'lucide-vue-next'

defineProps<{ title: string; description?: string; icon?: LucideIcon }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface-container-low shadow-2xl focus:outline-none"
      >
        <div class="p-space-lg flex items-center justify-between bg-surface-container">
          <div class="flex items-center gap-2">
            <div v-if="icon" class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <component :is="icon" :size="18" />
            </div>
            <div>
              <DialogTitle class="font-headline-sm text-headline-sm text-on-surface font-semibold">{{ title }}</DialogTitle>
              <DialogDescription v-if="description" class="font-body-sm text-body-sm text-on-surface-variant">
                {{ description }}
              </DialogDescription>
            </div>
          </div>
          <DialogClose class="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors">
            <X :size="18" />
          </DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
