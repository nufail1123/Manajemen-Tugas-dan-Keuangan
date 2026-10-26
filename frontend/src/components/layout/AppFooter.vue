<script setup lang="ts">
import { Check } from 'lucide-vue-next'
</script>

<template>
  <footer class="w-full bg-surface-container-lowest py-8 mt-auto">
    <div class="w-full px-margin-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded bg-primary-container flex items-center justify-center text-on-primary-container"><Check :size="10" /></div>
        <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">TaskFlow Cloud OS</span>
      </div>
      <div class="font-body-sm text-body-sm text-on-surface-variant">© 2025 TaskFlow Inc. Precision workflow architecture.</div>
    </div>
  </footer>
</template>
