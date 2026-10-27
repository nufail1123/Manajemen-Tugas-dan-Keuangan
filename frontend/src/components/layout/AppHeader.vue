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
  <header class="fixed top-0 left-0 right-0 z-40 w-full bg-surface border-b-2 border-ink">
    <div class="h-16 w-full px-margin-lg flex items-center gap-space-lg">
      <div class="group flex items-center gap-space-sm cursor-default">
        <div class="w-9 h-9 bg-primary text-white border-2 border-ink shadow-hard-sm flex items-center justify-center transition-transform group-hover:-rotate-6 group-hover:scale-105">
          <CheckCircle2 :size="20" class="group-hover:animate-wiggle" />
        </div>
        <span class="font-headline-md text-xl font-extrabold tracking-[-0.03em] text-ink">TaskFlow</span>
      </div>
      <div class="h-6 w-0.5 bg-ink hidden sm:block" />
      <TabsRoot v-model="active">
        <TabsList class="flex items-center gap-space-sm">
          <TabsTrigger
            v-for="t in tabs" :key="t.name" :value="t.name"
            class="px-3 py-1.5 border-2 border-transparent font-label-md text-label-md font-bold tracking-wide text-on-surface transition-all hover:bg-accent hover:border-ink hover:-translate-y-0.5 data-[state=active]:bg-ink data-[state=active]:text-accent data-[state=active]:border-ink data-[state=active]:shadow-hard-sm data-[state=active]:translate-y-0"
          >
            {{ t.label }}
          </TabsTrigger>
        </TabsList>
      </TabsRoot>
      <div class="ml-auto"><UserMenu /></div>
    </div>
  </header>
</template>
