<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-margin py-space-xl relative overflow-hidden">
    <!-- Bentuk dekoratif yang melayang pelan -->
    <div class="absolute top-16 left-[8%] w-24 h-24 bg-accent border-2 border-ink shadow-hard animate-float pointer-events-none" />
    <div class="absolute bottom-20 right-[9%] w-20 h-20 rounded-full bg-primary border-2 border-ink shadow-hard animate-float-slow pointer-events-none" />
    <div class="absolute top-1/3 right-[16%] w-10 h-10 bg-tertiary-container border-2 border-ink rotate-12 animate-float-slow pointer-events-none hidden sm:block" />
    <div class="relative w-full max-w-md flex flex-col gap-space-lg">
      <div class="flex items-center justify-center gap-space-sm animate-rise">
        <div class="w-10 h-10 bg-primary text-white border-2 border-ink shadow-hard-sm flex items-center justify-center"><CheckCircle2 :size="22" /></div>
        <span class="font-headline-md text-2xl font-extrabold tracking-[-0.03em] text-ink">TugasKu</span>
      </div>
      <div class="bg-white border-2 border-ink shadow-hard-xl p-space-xl flex flex-col gap-space-lg animate-rise [animation-delay:100ms]">
        <div class="flex flex-col gap-1">
          <h1 class="font-headline-md text-3xl font-extrabold tracking-[-0.03em] text-ink">{{ title }}<span class="text-primary animate-blink">_</span></h1>
          <p class="font-body-md text-body-md text-on-surface-variant">{{ subtitle }}</p>
        </div>
        <slot />
      </div>
      <p class="text-center font-body-sm text-body-sm text-on-surface-variant animate-rise [animation-delay:200ms]"><slot name="footer" /></p>
    </div>
  </div>
</template>
