<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui'
import { CheckCircle2 } from 'lucide-vue-next'
import UserMenu from './UserMenu.vue'

const route = useRoute()
const router = useRouter()
const tabs = [
  { name: 'ringkasan', label: 'Ringkasan', to: '/' },
  { name: 'tugas', label: 'Tugas', to: '/tugas' },
  { name: 'keuangan', label: 'Keuangan', to: '/keuangan' },
]
// Tabs dikendalikan oleh router: URL = sumber kebenaran
const active = computed({
  get: () => (route.name as string) ?? 'ringkasan',
  set: (name) => router.push(tabs.find((t) => t.name === name)!.to),
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-40 w-full bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
    <div class="h-16 w-full px-margin-lg flex items-center gap-space-lg">
      <div class="flex items-center gap-space-sm">
        <div class="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-inner">
          <CheckCircle2 :size="20" />
        </div>
        <span class="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">TaskFlow</span>
      </div>
      <div class="h-4 w-px bg-outline-variant/40 hidden sm:block" />
      <TabsRoot v-model="active">
        <TabsList class="flex items-center gap-space-xs p-1 rounded-xl bg-surface-container-lowest/60">
          <TabsTrigger
            v-for="t in tabs" :key="t.name" :value="t.name"
            class="px-3 py-1.5 rounded-lg font-body-md text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors data-[state=active]:bg-surface-container-high data-[state=active]:text-on-surface data-[state=active]:font-medium"
          >
            {{ t.label }}
          </TabsTrigger>
        </TabsList>
      </TabsRoot>
      <div class="ml-auto"><UserMenu /></div>
    </div>
  </header>
</template>
