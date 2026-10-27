<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowUpRight, CalendarClock, Wallet, ListChecks } from 'lucide-vue-next'
import dayjs from 'dayjs'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import BillCard from '@/components/finance/BillCard.vue'
import { useBills, useFinanceSummary, useTasks, useToggleTask } from '@/queries'
import { rupiah } from '@/lib/utils'

const router = useRouter()
const { data: tasks } = useTasks()
const { data: summary } = useFinanceSummary(dayjs().format('YYYY-MM'))
const { data: bills } = useBills()
const toggle = useToggleTask()

const openTasks = computed(() =>
  (tasks.value ?? [])
    .filter((t) => !t.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
)

function handleTaskRowClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  // Jika yang diklik adalah tombol checkbox atau elemen di dalamnya, jangan redirect
  if (target?.closest('button') || target?.closest('input')) {
    return
  }
  router.push('/tugas')
}
</script>

<template>
  <PageHeader section="Ringkasan" title="Ringkasan" subtitle="Gambaran singkat tugas dan keuangan Anda hari ini." />

  <section class="w-full px-margin-lg py-space-lg">
    <div class="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg">
      <!-- Kartu Tugas Aktif -->
      <RouterLink to="/tugas" class="block transition-transform hover:-translate-y-1">
        <StatCard label="Tugas Aktif" :value="String(openTasks.length)" :icon="ListChecks" tone="primary">
          <span>menunggu diselesaikan</span>
        </StatCard>
      </RouterLink>

      <!-- Kartu Saldo -->
      <StatCard label="Saldo Bulan Ini" :value="rupiah(summary?.balance ?? 0)" :icon="Wallet" tone="secondary">
        <span>pemasukan - pengeluaran</span>
      </StatCard>

      <!-- Kartu Pengeluaran -->
      <StatCard label="Pengeluaran" :value="rupiah(summary?.expense ?? 0)" :icon="ArrowUpRight" tone="error">
        <span>bulan berjalan</span>
      </StatCard>

      <!-- Kartu Tagihan Terjadwal -->
      <RouterLink to="/keuangan" class="block transition-transform hover:-translate-y-1">
        <StatCard label="Tagihan Terjadwal" :value="String(bills?.length ?? 0)" :icon="CalendarClock" tone="tertiary">
          <span>dengan reminder WA</span>
        </StatCard>
      </RouterLink>
    </div>
  </section>

  <section class="w-full px-margin-lg pb-16 grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
    <!-- Kolom Tugas Terdekat -->
    <div class="lg:col-span-8 flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Tugas Terdekat</h2>
        <RouterLink to="/tugas" class="font-label-sm text-label-sm text-primary hover:underline">Lihat semua</RouterLink>
      </div>
      <div class="stagger bg-white border-2 border-ink shadow-hard overflow-hidden divide-y-2 divide-ink">
        <div
          v-for="t in openTasks.slice(0, 4)"
          :key="t.id"
          class="hover:bg-black/5 transition-colors cursor-pointer"
          @click="handleTaskRowClick"
        >
          <TaskRow
            :task="t"
            @toggle="(done) => toggle.mutate({ id: t.id, done })"
          />
        </div>
      </div>
    </div>

    <!-- Kolom Tagihan Terjadwal -->
    <div class="lg:col-span-4 flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Tagihan Terjadwal</h2>
        <RouterLink to="/keuangan" class="font-label-sm text-label-sm text-primary hover:underline">Kelola</RouterLink>
      </div>
      <RouterLink
        v-for="b in bills"
        :key="b.id"
        to="/keuangan"
        class="block cursor-pointer"
      >
        <BillCard :bill="b" />
      </RouterLink>
    </div>
  </section>
</template>