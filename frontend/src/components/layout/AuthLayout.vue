<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
defineProps<{ title: string; subtitle: string }>()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-margin py-space-xl bg-surface relative overflow-hidden">
    <div class="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    <div class="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
    <div class="relative w-full max-w-md flex flex-col gap-space-lg">
      <div class="flex items-center justify-center gap-space-sm">
        <div class="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-inner"><CheckCircle2 :size="22" /></div>
        <span class="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">TaskFlow</span>
      </div>
      <div class="bg-surface-container-low rounded-xl shadow-2xl p-space-xl flex flex-col gap-space-lg">
        <div class="flex flex-col gap-1">
          <h1 class="font-headline-md text-headline-md text-on-surface">{{ title }}</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">{{ subtitle }}</p>
        </div>
        <slot />
      </div>
      <p class="text-center font-body-sm text-body-sm text-on-surface-variant"><slot name="footer" /></p>
    </div>
  </div>
</template>
