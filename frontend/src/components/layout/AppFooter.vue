<script setup lang="ts">
import { Check } from 'lucide-vue-next'
</script>

<template>
  <footer class="w-full bg-primary text-white py-8 mt-auto border-t-2 border-ink">
    <div class="w-full px-margin-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-accent text-ink border-2 border-ink flex items-center justify-center"><Check :size="12" :stroke-width="3" /></div>
        <span class="font-label-sm text-label-sm text-accent tracking-widest uppercase font-bold">Tugasku UNS</span>
      </div>
      <div class="font-body-sm text-body-sm text-white/80">© 2026 TugasKu Inc. Precision workflow architecture.</div>
    </div>
  </footer>
</template>
