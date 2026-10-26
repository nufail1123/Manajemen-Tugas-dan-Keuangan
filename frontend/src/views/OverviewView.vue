<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight, CalendarClock, Wallet, ListChecks } from 'lucide-vue-next'
import dayjs from 'dayjs'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import BillCard from '@/components/finance/BillCard.vue'
import { useBills, useFinanceSummary, useTasks, useToggleTask } from '@/queries'
import { rupiah } from '@/lib/utils'

const { data: tasks } = useTasks()
const { data: summary } = useFinanceSummary(dayjs().format('YYYY-MM'))
const { data: bills } = useBills()
const toggle = useToggleTask()

const openTasks = computed(() => (tasks.value ?? []).filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
</script>

<template>
  <PageHeader section="Ringkasan" title="Ringkasan" subtitle="Gambaran singkat tugas dan keuangan Anda hari ini." />
  <section class="w-full px-margin-lg py-space-lg">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg">
      <StatCard label="Tugas Aktif" :value="String(openTasks.length)" :icon="ListChecks" tone="primary"><span>menunggu diselesaikan</span></StatCard>
      <StatCard label="Saldo Bulan Ini" :value="rupiah(summary?.balance ?? 0)" :icon="Wallet" tone="secondary"><span>pemasukan - pengeluaran</span></StatCard>
      <StatCard label="Pengeluaran" :value="rupiah(summary?.expense ?? 0)" :icon="ArrowUpRight" tone="error"><span>bulan berjalan</span></StatCard>
      <StatCard label="Tagihan Terjadwal" :value="String(bills?.length ?? 0)" :icon="CalendarClock" tone="tertiary"><span>dengan reminder WA</span></StatCard>
    </div>
  </section>
  <section class="w-full px-margin-lg pb-16 grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
    <div class="lg:col-span-8 flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Tugas Terdekat</h2>
        <RouterLink to="/tugas" class="font-label-sm text-label-sm text-primary hover:underline">Lihat semua</RouterLink>
      </div>
      <div class="bg-surface-container-low rounded-xl shadow-sm overflow-hidden divide-y divide-surface-container/60">
        <TaskRow v-for="t in openTasks.slice(0, 4)" :key="t.id" :task="t" readonly @toggle="(done) => toggle.mutate({ id: t.id, done })" />
      </div>
    </div>
    <div class="lg:col-span-4 flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Tagihan Terjadwal</h2>
        <RouterLink to="/keuangan" class="font-label-sm text-label-sm text-primary hover:underline">Kelola</RouterLink>
      </div>
      <BillCard v-for="b in bills" :key="b.id" :bill="b" />
    </div>
  </section>
</template>
