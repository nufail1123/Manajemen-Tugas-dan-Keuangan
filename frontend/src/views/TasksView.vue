<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { CalendarCheck, CalendarClock, ListChecks, MessageCircle, Plus } from 'lucide-vue-next'
import dayjs from 'dayjs'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import WaStatusCard from '@/components/ui/WaStatusCard.vue'
import TaskCategoryCard from '@/components/tasks/TaskCategoryCard.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import TaskFormDialog from '@/components/tasks/TaskFormDialog.vue'
import { useDeleteTask, useTasks, useToggleTask } from '@/queries'
import { useUiStore, type TaskFilter } from '@/stores/ui'
import { ALL_CATEGORIES } from '@/lib/categories'
import { useCategoryMeta } from '@/queries/categories'
import { btnPrimary } from '@/lib/styles'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

const { data: tasks, isLoading } = useTasks()
const toggle = useToggleTask()
const remove = useDeleteTask()
const ui = useUiStore()
const { taskFilter, taskSort, taskSearch, taskCategory } = storeToRefs(ui)
const { categories } = useCategoryMeta()
const showForm = ref(false)
const editing = ref<Task | null>(null)
const openForm = (t: Task | null = null) => { editing.value = t; showForm.value = true }

const today = (d: string) => dayjs(d).isSame(dayjs(), 'day')
// Filter kategori berlaku lebih dulu, sehingga angka pada tab (Semua/Hari Ini/...) ikut menyesuaikan
const byCategory = computed(() =>
  (tasks.value ?? []).filter((t) => taskCategory.value === ALL_CATEGORIES || t.category === taskCategory.value))
const filters = computed<{ key: TaskFilter; label: string; count: number }[]>(() => {
  const l = byCategory.value
  return [
    { key: 'all', label: 'Semua', count: l.filter((t) => !t.done).length },
    { key: 'today', label: 'Hari Ini', count: l.filter((t) => !t.done && today(t.dueDate)).length },
    { key: 'upcoming', label: 'Mendatang', count: l.filter((t) => !t.done && dayjs(t.dueDate).isAfter(dayjs(), 'day')).length },
    { key: 'done', label: 'Selesai', count: l.filter((t) => t.done).length },
  ]
})
const visible = computed(() => {
  const q = taskSearch.value.toLowerCase()
  return byCategory.value
    .filter((t) => {
      if (taskFilter.value === 'done') return t.done
      if (t.done) return false
      if (taskFilter.value === 'today') return today(t.dueDate)
      if (taskFilter.value === 'upcoming') return dayjs(t.dueDate).isAfter(dayjs(), 'day')
      return true
    })
    .filter((t) => !q || `${t.title} ${t.url} ${t.category}`.toLowerCase().includes(q))
    .sort((a, b) => (taskSort.value === 'title' ? a.title.localeCompare(b.title) : a.dueDate.localeCompare(b.dueDate)))
})
const stats = computed(() => {
  const l = tasks.value ?? [] // statistik kartu selalu untuk semua tugas, tidak terpengaruh filter
  const open = l.filter((t) => !t.done)
  return {
    total: l.length, open: open.length, done: l.length - open.length,
    wa: open.filter((t) => t.remindH3 || t.remindH1).length,
    pct: l.length ? Math.round(((l.length - open.length) / l.length) * 100) : 0,
  }
})
const categoryOptions = computed(() => [
  { value: ALL_CATEGORIES, label: 'Kategori: Semua' },
  ...categories.value.map((c) => ({ value: c.name, label: c.name })),
])
// Kategori yang sedang difilter hilang (mis. dihapus) -> kembali ke "Semua"
watch(categories, (list) => {
  if (taskCategory.value !== ALL_CATEGORIES && list.length && !list.some((c) => c.name === taskCategory.value)) taskCategory.value = ALL_CATEGORIES
})
const sortOptions = [{ value: 'due', label: 'Urut: Jatuh Tempo' }, { value: 'title', label: 'Urut: Judul A-Z' }]
</script>

<template>
  <PageHeader section="Tugas" title="Semua Tugas" :subtitle="`${stats.open} tugas aktif, ${stats.pct}% selesai.`">
    <template #actions>
      <button type="button" :class="btnPrimary" @click="openForm()"><Plus :size="18" /> Tugas Baru</button>
    </template>
  </PageHeader>

  <section class="w-full px-margin-lg py-space-lg">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg">
      <StatCard label="Total Tugas" :value="String(stats.total)" :icon="ListChecks" tone="primary"><span>{{ stats.pct }}% selesai</span></StatCard>
      <StatCard label="Terjadwal" :value="String(stats.open)" :icon="CalendarClock" tone="tertiary"><span>tugas aktif</span></StatCard>
      <StatCard label="Alert WhatsApp" :value="String(stats.wa)" :icon="MessageCircle" tone="secondary"><span>reminder aktif</span></StatCard>
      <StatCard label="Selesai" :value="String(stats.done)" :icon="CalendarCheck" tone="secondary"><span>tugas tuntas</span></StatCard>
    </div>
  </section>

  <section class="w-full px-margin-lg pb-16">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
      <div class="lg:col-span-8 flex flex-col gap-space-md">
        <div class="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col md:flex-row gap-space-md justify-between md:items-center">
          <SearchInput v-model="taskSearch" placeholder="Cari tugas atau URL..." class="flex-1 md:max-w-xs" />
          <div class="flex flex-col sm:flex-row gap-space-sm">
            <BaseSelect v-model="taskCategory" :options="categoryOptions" class="sm:w-48 py-1.5" />
            <BaseSelect v-model="taskSort" :options="sortOptions" class="sm:w-48 py-1.5" />
          </div>
        </div>

        <div class="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
          <button
            v-for="f in filters" :key="f.key" type="button" @click="taskFilter = f.key"
            :class="cn('px-3 py-1 rounded-lg font-label-sm text-label-sm transition-colors whitespace-nowrap bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
              taskFilter === f.key && 'bg-surface-container-high text-on-surface font-medium')"
          >{{ f.label }} <span class="text-outline">{{ f.count }}</span></button>
        </div>

        <div class="bg-surface-container-low rounded-xl shadow-sm overflow-hidden divide-y divide-surface-container/60">
          <div v-if="isLoading" class="p-space-lg text-center font-body-md text-on-surface-variant">Memuat tugas...</div>
          <div v-else-if="!visible.length" class="p-space-lg text-center font-body-md text-on-surface-variant">Tidak ada tugas pada filter ini.</div>
          <TaskRow
            v-for="t in visible" :key="t.id" :task="t"
            @toggle="(done) => toggle.mutate({ id: t.id, done })" @edit="openForm(t)" @remove="remove.mutate(t.id)"
          />
        </div>
      </div>

      <div class="lg:col-span-4 flex flex-col gap-space-lg">
        <WaStatusCard />
        <TaskCategoryCard />
      </div>
    </div>
  </section>

  <TaskFormDialog v-model:open="showForm" :editing="editing" />
</template>
