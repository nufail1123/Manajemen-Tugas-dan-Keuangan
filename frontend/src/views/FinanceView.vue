<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, CalendarDays, CirclePlus, Plus, Search, Send, Wallet } from 'lucide-vue-next'
import dayjs from 'dayjs'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import WaStatusCard from '@/components/ui/WaStatusCard.vue'
import TransactionRow from '@/components/finance/TransactionRow.vue'
import BillCard from '@/components/finance/BillCard.vue'
import TransactionFormDialog from '@/components/finance/TransactionFormDialog.vue'
import BillFormDialog from '@/components/finance/BillFormDialog.vue'
import { useBills, useDeleteBill, useDeleteTransaction, useFinanceSummary, useTransactions } from '@/queries'
import { useUiStore } from '@/stores/ui'
import { useDebounced } from '@/lib/debounce'
import { btnPrimary, btnSecondary } from '@/lib/styles'
import { cn, rupiah } from '@/lib/utils'
import type { Bill, Transaction } from '@/types'

const ui = useUiStore()
const { month, txCategory, txSearch } = storeToRefs(ui)
const search = useDebounced(txSearch)

// Filter dikirim ke backend: GET /transactions?month=2026-10&category=Makanan&q=kost
const filter = computed(() => ({
  month: month.value,
  category: txCategory.value === 'Semua' ? undefined : txCategory.value,
  q: search.value || undefined,
}))
const { data: txs, isLoading } = useTransactions(filter)
// Angka kartu dihitung backend: GET /finance/summary?month=2026-10
const { data: summary } = useFinanceSummary(month)
const { data: bills } = useBills()
const removeTx = useDeleteTransaction()
const removeBill = useDeleteBill()

// Dialog dipakai untuk tambah (editing = null) dan ubah
const showTx = ref(false)
const showBill = ref(false)
const editingTx = ref<Transaction | null>(null)
const editingBill = ref<Bill | null>(null)
const openTx = (t: Transaction | null = null) => { editingTx.value = t; showTx.value = true }
const openBill = (b: Bill | null = null) => { editingBill.value = b; showBill.value = true }

const monthOptions = Array.from({ length: 4 }, (_, i) => {
  const d = dayjs().subtract(i, 'month')
  return { value: d.format('YYYY-MM'), label: d.format('MMMM YYYY') }
})
const categories = ['Semua', 'Gaji', 'Makanan', 'Tagihan', 'Transportasi', 'Kuliah', 'Hiburan']

const visible = computed(() => txs.value ?? [])
const income = computed(() => summary.value?.income ?? 0)
const expense = computed(() => summary.value?.expense ?? 0)
const balance = computed(() => summary.value?.balance ?? 0)
const incomeCount = computed(() => summary.value?.incomeCount ?? 0)
const expenseCount = computed(() => summary.value?.expenseCount ?? 0)
const billTotal = computed(() => summary.value?.billTotal ?? 0)
const expensePct = computed(() => (income.value ? ((expense.value / income.value) * 100).toFixed(1) : '0'))

const barColors = ['bg-tertiary', 'bg-primary', 'bg-secondary', 'bg-outline']
const breakdown = computed(() =>
  (summary.value?.byCategory ?? []).slice(0, 4).map((c, i) => ({
    name: c.category, amt: c.amount, pct: Math.round((c.amount / (expense.value || 1)) * 100), color: barColors[i],
  })))

// Sparkline dari summary.daily
const spark = computed(() => {
  const days = dayjs(`${month.value}-01`).daysInMonth()
  const arr = Array.from({ length: days }, () => 0)
  summary.value?.daily.forEach((d) => (arr[d.day - 1] = d.expense))
  const max = Math.max(...arr, 1)
  const pts = arr.map((v, i) => [(i / (days - 1)) * 300, 55 - (v / max) * 45])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return { line, area: `${line} L 300,60 L 0,60 Z` }
})
const dailyAvg = computed(() => {
  const elapsed = month.value === dayjs().format('YYYY-MM') ? dayjs().date() : dayjs(`${month.value}-01`).daysInMonth()
  return expense.value / elapsed
})
</script>

<template>
  <PageHeader section="Finance" title="Manajemen Keuangan" subtitle="Kelola arus kas, catatan transaksi harian, dan pengingat tagihan otomatis.">
    <template #actions>
      <button type="button" :class="btnSecondary" @click="openBill()"><CalendarClock :size="18" class="text-tertiary" /> Tagihan Baru</button>
      <button type="button" :class="btnPrimary" @click="openTx()"><CirclePlus :size="18" /> Catat Transaksi</button>
    </template>
  </PageHeader>

  <section class="w-full px-margin-lg py-space-lg">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg">
      <StatCard label="Sisa Saldo Bulan Ini" :value="rupiah(balance)" :icon="Wallet" tone="primary">
        <span>Pemasukan - pengeluaran</span>
      </StatCard>
      <StatCard label="Total Pemasukan" :value="rupiah(income)" :icon="ArrowDownLeft" tone="secondary">
        <span>{{ incomeCount }} transaksi masuk</span>
      </StatCard>
      <StatCard label="Total Pengeluaran" :value="rupiah(expense)" :icon="ArrowUpRight" tone="error">
        <span>{{ expenseCount }} transaksi dicatat</span><span class="font-label-sm text-label-sm text-outline">{{ expensePct }}% dari pemasukan</span>
      </StatCard>
      <StatCard label="Tagihan Aktif" :value="rupiah(billTotal)" :icon="Send" tone="tertiary">
        <span>{{ bills?.length ?? 0 }} tagihan terjadwal</span>
        <span class="font-label-sm text-label-sm text-secondary flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-secondary" /> WA Active</span>
      </StatCard>
    </div>
  </section>

  <section class="w-full px-margin-lg pb-16">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
      <div class="lg:col-span-8 flex flex-col gap-space-md">
        <div class="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col md:flex-row gap-space-md justify-between md:items-center">
          <div class="flex items-center gap-2">
            <BaseSelect v-model="month" :options="monthOptions" class="w-44 py-1.5" />
            <span class="text-on-surface-variant font-body-sm text-body-sm hidden sm:inline"><CalendarDays :size="14" class="inline -mt-0.5 text-primary" /> {{ visible.length }} transaksi ditampilkan</span>
          </div>
          <div class="relative flex-1 md:max-w-xs">
            <Search :size="18" class="absolute left-3 top-2.5 text-outline" />
            <input v-model="txSearch" placeholder="Cari transaksi..."
              class="w-full bg-surface-container rounded-lg pl-9 pr-3 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors" />
          </div>
        </div>

        <div class="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
          <button v-for="c in categories" :key="c" type="button" @click="txCategory = c"
            :class="cn('px-3 py-1 rounded-lg font-label-sm text-label-sm transition-colors whitespace-nowrap bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
              txCategory === c && 'bg-surface-container-high text-on-surface font-medium')">{{ c }}</button>
        </div>

        <div class="bg-surface-container-low rounded-xl shadow-sm overflow-hidden divide-y divide-surface-container/60">
          <div v-if="isLoading" class="p-space-lg text-center font-body-md text-on-surface-variant">Memuat transaksi...</div>
          <div v-else-if="!visible.length" class="p-space-lg text-center font-body-md text-on-surface-variant">Belum ada transaksi.</div>
          <TransactionRow v-for="t in visible" :key="t.id" :tx="t" @edit="openTx(t)" @remove="removeTx.mutate(t.id)" />
        </div>

        <div class="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div class="flex flex-col gap-1 w-full sm:w-1/2">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Distribusi Aliran Kas Harian</span>
            <div class="flex items-baseline gap-2">
              <span class="font-headline-md text-headline-md text-on-surface font-semibold">{{ rupiah(dailyAvg) }} / hr</span>
              <span class="font-label-sm text-label-sm text-secondary">{{ dailyAvg * 30 <= income * 0.4 ? 'Aman & Terkendali' : 'Perlu Diawasi' }}</span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Rata-rata pengeluaran harian dibandingkan batas toleransi 40% dari pemasukan bulan berjalan.</p>
          </div>
          <div class="w-full sm:w-1/2 h-20 flex items-end">
            <svg class="w-full h-16 overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 60">
              <defs>
                <linearGradient id="flowGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#4edea3" stop-opacity="0.35" /><stop offset="100%" stop-color="#4edea3" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path :d="spark.area" fill="url(#flowGrad)" />
              <path :d="spark.line" fill="none" stroke="#4edea3" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 flex flex-col gap-space-lg">
        <WaStatusCard />

        <div class="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div class="flex items-center justify-between">
            <h3 class="font-headline-sm text-body-lg font-semibold text-on-surface">Tagihan Terjadwal</h3>
            <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">{{ bills?.length ?? 0 }} Aktif</span>
          </div>
          <div class="flex flex-col gap-space-sm">
            <BillCard v-for="b in bills" :key="b.id" :bill="b" @edit="openBill(b)" @remove="removeBill.mutate(b.id)" />
          </div>
          <button type="button" :class="cn(btnSecondary, 'w-full py-2.5')" @click="openBill()"><Plus :size="18" /> Tambah Tagihan Terjadwal</button>
        </div>

        <div class="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div class="flex items-center justify-between">
            <span class="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Proporsi Beban Pengeluaran</span>
            <span class="font-label-sm text-label-sm text-primary">{{ dayjs(`${month}-01`).format('MMMM') }}</span>
          </div>
          <div v-if="!breakdown.length" class="font-body-sm text-body-sm text-on-surface-variant">Belum ada pengeluaran.</div>
          <div class="flex flex-col gap-3">
            <div v-for="b in breakdown" :key="b.name">
              <div class="flex justify-between font-label-sm text-label-sm mb-1">
                <span class="text-on-surface">{{ b.name }}</span>
                <span class="text-on-surface font-semibold">{{ b.pct }}% ({{ rupiah(b.amt) }})</span>
              </div>
              <div class="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div :class="['h-2 rounded-full', b.color]" :style="{ width: b.pct + '%' }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <TransactionFormDialog v-model:open="showTx" :editing="editingTx" />
  <BillFormDialog v-model:open="showBill" :editing="editingBill" />
</template>
