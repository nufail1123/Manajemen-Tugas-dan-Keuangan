<script setup lang="ts">
defineProps<{ section: string; title: string; subtitle: string }>()
</script>

<template>
  <section class="w-full px-margin-lg py-space-lg bg-surface-container-lowest/80 backdrop-blur-md">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
          <span>PERSONAL SPACE</span><span class="text-outline">/</span>
          <span class="text-primary font-medium tracking-wide uppercase">{{ section }}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-baseline gap-space-xs sm:gap-space-md">
          <h1 class="font-headline-xl text-headline-xl text-on-surface tracking-tight">{{ title }}</h1>
          <span class="font-body-md text-body-md text-on-surface-variant">{{ subtitle }}</span>
        </div>
      </div>
      <div class="flex items-center gap-space-sm self-start lg:self-auto"><slot name="actions" /></div>
    </div>
  </section>
</template>
