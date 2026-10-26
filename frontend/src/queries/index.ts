import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { toast } from 'vue-sonner'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { api } from '@/lib/api'
import type { Bill, FinanceSummary, Task, Transaction, TransactionFilter, WaSettings } from '@/types'
import { billFromApi, billToApi, taskFromApi, taskToApi, txFromApi, txToApi } from '@/lib/adapters'
import type { BillInput, TaskInput, TransactionInput } from '@/lib/schemas'

const get = <T>(url: string, params?: object) => api.get<T>(url, { params }).then((r) => r.data)

/**
 * Pabrik mutation: setelah sukses -> invalidate semua key terkait + toast.
 * Transaksi/tagihan mempengaruhi ringkasan, jadi 'summary' ikut di-refetch.
 */
function useCrud<TVars>(keys: string[], fn: (v: TVars) => Promise<unknown>, message: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); toast.success(message) },
    onError: () => toast.error('Terjadi kesalahan, coba lagi.'),
  })
}

// ---- Tasks
export const useTasks = () => useQuery({ queryKey: ['tasks'], queryFn: async () => (await get<unknown[]>('/tasks')).map((r) => taskFromApi(r as object)) })
export const useCreateTask = () =>
  useCrud(['tasks'], (v: TaskInput) => api.post('/tasks', taskToApi({ ...v, done: false })), 'Tugas berhasil disimpan')
export const useUpdateTask = () =>
  useCrud(['tasks'], (v: { id: string } & Partial<Task>) => api.patch(`/tasks/${v.id}`, taskToApi(v)), 'Tugas diperbarui')
export const useToggleTask = () =>
  useCrud(['tasks'], (v: { id: string; done: boolean }) => api.patch(`/tasks/${v.id}`, { done: v.done }), 'Status tugas diperbarui')
export const useDeleteTask = () => useCrud(['tasks'], (id: string) => api.delete(`/tasks/${id}`), 'Tugas dihapus')

/** Penyaringan di browser: dipakai sebagai pengaman bila backend mengabaikan ?month, ?category, ?q */
const applyFilter = (rows: Transaction[], f: TransactionFilter) =>
  rows
    .filter((t) => t.date.startsWith(f.month))
    .filter((t) => !f.category || t.category === f.category)
    .filter((t) => !f.q || `${t.description} ${t.category}`.toLowerCase().includes(f.q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))

/** Hitung ringkasan di browser (cadangan bila GET /finance/summary belum ada di backend) */
function buildSummary(month: string, txs: Transaction[], bills: Bill[]): FinanceSummary {
  const rows = txs.filter((t) => t.date.startsWith(month))
  const sum = (type: string) => rows.filter((t) => t.type === type).reduce((a, t) => a + Number(t.amount), 0)
  const count = (type: string) => rows.filter((t) => t.type === type).length
  const byCat: Record<string, number> = {}
  const daily: Record<number, number> = {}
  rows.filter((t) => t.type === 'expense').forEach((t) => {
    byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount)
    const d = Number(t.date.slice(8, 10))
    daily[d] = (daily[d] ?? 0) + Number(t.amount)
  })
  return {
    month, income: sum('income'), expense: sum('expense'), balance: sum('income') - sum('expense'),
    incomeCount: count('income'), expenseCount: count('expense'),
    billTotal: bills.reduce((a, b) => a + Number(b.amount), 0), billCount: bills.length,
    byCategory: Object.entries(byCat).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    daily: Object.entries(daily).map(([day, expense]) => ({ day: Number(day), expense })),
  }
}

/**
 * Ringkasan dari backend. Nama field backend (totalIncome/totalExpense) diterjemahkan, dan field yang
 * belum disediakan backend (jumlah transaksi, per kategori, harian, tagihan) dilengkapi dari
 * /transactions dan /bills. Angka income/expense/balance dari backend tetap dipakai.
 */
const SUMMARY_KEYS = ['income', 'expense', 'balance', 'incomeCount', 'expenseCount', 'billTotal', 'billCount', 'byCategory', 'daily']
async function loadSummary(m: string): Promise<FinanceSummary> {
  let remote: Record<string, any> | null = null // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    remote = await get<Record<string, any>>('/finance/summary', { month: m }) // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (e) {
    if (!isAxiosError(e) || e.response?.status !== 404) throw e // 404 = endpoint belum ada
  }
  const r: Record<string, any> | null = remote // eslint-disable-line @typescript-eslint/no-explicit-any
    ? { ...remote, income: remote.income ?? remote.totalIncome, expense: remote.expense ?? remote.totalExpense }
    : null
  if (r && SUMMARY_KEYS.every((k) => r[k] !== undefined)) return { ...r, month: m } as FinanceSummary

  const [txs, bills] = await Promise.all([get<unknown[]>('/transactions', { month: m }), get<unknown[]>('/bills')])
  const local = buildSummary(m, txs.map((x) => txFromApi(x as object)), bills.map((x) => billFromApi(x as object)))
  if (!r) return local
  const given = Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null))
  return { ...local, ...given, month: m } as FinanceSummary
}

// ---- Transactions (filter dikirim sebagai query string ke backend)
export const useTransactions = (filter: MaybeRefOrGetter<TransactionFilter>) =>
  useQuery({
    queryKey: ['transactions', filter],
    queryFn: async () => {
      const f = toValue(filter)
      const rows = (await get<unknown[]>('/transactions', f)).map((r) => txFromApi(r as object))
      return applyFilter(rows, f) // jaga-jaga bila backend belum menyaring sendiri
    },
    placeholderData: keepPreviousData, // daftar lama tetap tampil saat filter berganti
  })
export const useCreateTransaction = () =>
  useCrud(['transactions', 'summary'], (v: TransactionInput) => api.post('/transactions', txToApi(v)), 'Transaksi dicatat')
export const useUpdateTransaction = () =>
  useCrud(['transactions', 'summary'], (v: { id: string } & TransactionInput) => api.patch(`/transactions/${v.id}`, txToApi(v)), 'Transaksi diperbarui')
export const useDeleteTransaction = () =>
  useCrud(['transactions', 'summary'], (id: string) => api.delete(`/transactions/${id}`), 'Transaksi dihapus')

// ---- Ringkasan keuangan: dihitung backend, bukan di browser
export const useFinanceSummary = (month: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: ['summary', month],
    queryFn: () => loadSummary(toValue(month)),
    placeholderData: keepPreviousData,
  })

// ---- Bills
export const useBills = () => useQuery({ queryKey: ['bills'], queryFn: async () => (await get<unknown[]>('/bills')).map((r) => billFromApi(r as object)) })
export const useCreateBill = () =>
  useCrud(['bills', 'summary'], (v: BillInput) => api.post('/bills', billToApi(v)), 'Pengingat WhatsApp dijadwalkan')
export const useUpdateBill = () =>
  useCrud(['bills', 'summary'], (v: { id: string } & BillInput) => api.patch(`/bills/${v.id}`, billToApi(v)), 'Tagihan diperbarui')
export const useDeleteBill = () => useCrud(['bills', 'summary'], (id: string) => api.delete(`/bills/${id}`), 'Tagihan dihapus')

// ---- WhatsApp
export const useWaSettings = () => useQuery({ queryKey: ['wa'], queryFn: () => get<WaSettings>('/settings/wa') })
export const useUpdateWa = () =>
  useCrud(['wa'], (v: WaSettings) => api.put('/settings/wa', v), 'Nomor WhatsApp diperbarui')
