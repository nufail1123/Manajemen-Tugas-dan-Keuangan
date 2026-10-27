<script setup lang="ts">
defineProps<{ label: string; error?: string }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="font-label-sm text-label-sm text-on-surface font-bold">{{ label }}</label>
    <slot />
    <p v-if="error" class="font-body-sm text-body-sm text-error">{{ error }}</p>
  </div>
</template>
