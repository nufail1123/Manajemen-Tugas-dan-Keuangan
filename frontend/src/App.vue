<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container">
    <AppHeader />
    <main class="w-full pt-16 flex-1 flex flex-col"><RouterView /></main>
    <AppFooter />
    <Toaster theme="dark" position="bottom-right" rich-colors />
  </div>
</template>
