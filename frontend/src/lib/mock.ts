// API palsu berbasis localStorage supaya frontend bisa jalan tanpa backend Go.
// Matikan dengan VITE_USE_MOCK=false di .env
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import dayjs from 'dayjs'

type Row = { id: string; [k: string]: unknown }
interface DB { tasks: Row[]; transactions: Row[]; bills: Row[]; settings: { waNumber: string } }
const KEY = 'taskflow-mock-db-v2'
const uid = () => Math.random().toString(36).slice(2, 10)

function seed(): DB {
  const due = (n: number) => dayjs().add(n, 'day').format('YYYY-MM-DD')
  const m = (day: number, hm: string) => dayjs().startOf('month').date(day).format(`YYYY-MM-DD[T]${hm}:00`)
  const t = (title: string, category: string, description: string, url: string, n: number): Row =>
    ({ id: uid(), title, category, description, url, dueDate: due(n), remindH3: true, remindH1: true, done: false })
  const x = (type: string, description: string, amount: number, category: string, method: string, date: string): Row =>
    ({ id: uid(), type, description, amount, category, method, date })
  return {
    tasks: [
      t('Quarterly Strategy Review Deck', 'Q4 Roadmap', 'Finalisasi slide roadmap Q4 dan review metrik produk', 'https://notion.so/roadmap', 3),
      t('Renew Cloud Infrastructure SSL & DNS', 'DevOps', 'Perbarui sertifikat domain di Cloudflare dan verifikasi endpoint staging', 'https://cloudflare.com', 5),
      t('Annual Health Checkup Booking', 'Personal', 'Konfirmasi jadwal lab dan kirim dokumen asuransi kesehatan', 'https://patientportal.med', 9),
      t('Review Design System Tokens PR', 'Frontend', 'Cek kontras warna token dan sinkronisasi konfigurasi Tailwind', 'https://github.com/org/repo/pull/12', 14),
      t('Client Onboarding Workshop Prep', 'Strategy', 'Susun template whiteboard interaktif untuk sesi kickoff', 'https://miro.com/board', 0),
    ],
    transactions: [
      x('income', 'Gaji Pokok & Freelance Project', 12500000, 'Gaji', 'Mandiri Payroll', m(2, '09:30')),
      x('expense', 'Sewa Kamar Kost Bulanan', 1500000, 'Tagihan', 'BCA Virtual Account', m(4, '14:15')),
      x('expense', 'Belanja Bulanan & Groceries', 650000, 'Makanan', 'QRIS', m(6, '19:40')),
      x('expense', 'Langganan WiFi Fiber & Cloud Storage', 450000, 'Tagihan', 'Auto-debit Kartu', m(8, '08:00')),
      x('expense', 'Bensin & Tiket Kereta Komuter', 220000, 'Transportasi', 'E-Money / TapCash', m(10, '18:20')),
      x('expense', 'Uang Registrasi Seminar & Buku', 380000, 'Kuliah', 'Transfer Bank', m(12, '11:05')),
    ],
    bills: [
      { id: uid(), name: 'Bayar Kost Bulanan', amount: 1500000, day: 28, remindH3: true, remindH1: true },
      { id: uid(), name: 'Internet & WiFi Fiber', amount: 350000, day: 5, remindH3: true, remindH1: true },
      { id: uid(), name: 'Spotify & Netflix Bundle', amount: 180000, day: 12, remindH3: true, remindH1: true },
    ],
    settings: { waNumber: '6281290110000' },
  }
}
const load = (): DB => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) } catch { /* abaikan */ }
  const db = seed(); localStorage.setItem(KEY, JSON.stringify(db)); return db
}
const save = (db: DB) => localStorage.setItem(KEY, JSON.stringify(db))

function summarize(db: DB, month: string) {
  const txs = db.transactions.filter((t) => String(t.date).startsWith(month))
  const sum = (type: string) => txs.filter((t) => t.type === type).reduce((a, t) => a + (t.amount as number), 0)
  const cnt = (type: string) => txs.filter((t) => t.type === type).length
  const byCat: Record<string, number> = {}
  const daily: Record<number, number> = {}
  txs.filter((t) => t.type === 'expense').forEach((t) => {
    byCat[t.category as string] = (byCat[t.category as string] ?? 0) + (t.amount as number)
    const d = dayjs(t.date as string).date()
    daily[d] = (daily[d] ?? 0) + (t.amount as number)
  })
  return {
    month, income: sum('income'), expense: sum('expense'), balance: sum('income') - sum('expense'),
    incomeCount: cnt('income'), expenseCount: cnt('expense'),
    billTotal: db.bills.reduce((a, b) => a + (b.amount as number), 0), billCount: db.bills.length,
    byCategory: Object.entries(byCat).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    daily: Object.entries(daily).map(([day, expense]) => ({ day: Number(day), expense })),
  }
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((r) => setTimeout(r, 200)) // simulasi latensi jaringan
  const db = load()
  const method = (config.method ?? 'get').toLowerCase()
  const path = (config.url ?? '').replace(/^\/api/, '')
  const body = config.data ? JSON.parse(config.data) : {}
  const respond = (data: unknown, status = 200) =>
    ({ data, status, statusText: 'OK', headers: {}, config: config as InternalAxiosRequestConfig, request: {} })

  if (path === '/settings/wa') {
    if (method === 'put') { db.settings = { ...db.settings, ...body }; save(db) }
    return respond(db.settings)
  }
  if (path === '/finance/summary' && method === 'get') return respond(summarize(db, String(config.params?.month ?? dayjs().format('YYYY-MM'))))
  const m = path.match(/^\/(tasks|transactions|bills)(?:\/([\w-]+))?$/)
  if (!m) throw Object.assign(new Error('Not found'), { response: { status: 404 } })
  const list = db[m[1] as 'tasks' | 'transactions' | 'bills'] as Row[]
  if (method === 'get') {
    if (m[1] !== 'transactions') return respond(list)
    // Filter di "server": ?month=YYYY-MM&category=Makanan&q=kata
    const { month, category, q } = config.params ?? {}
    const rows = list.filter((r) =>
      (!month || String(r.date).startsWith(month)) &&
      (!category || category === 'Semua' || r.category === category) &&
      (!q || `${r.description} ${r.category}`.toLowerCase().includes(String(q).toLowerCase())))
    return respond(rows.sort((a, b) => String(b.date).localeCompare(String(a.date))))
  }
  if (method === 'post') { const row = { id: uid(), ...body }; list.unshift(row); save(db); return respond(row, 201) }
  const i = list.findIndex((r) => r.id === m[2])
  if (method === 'patch' && i >= 0) { list[i] = { ...list[i], ...body }; save(db); return respond(list[i]) }
  if (method === 'delete' && i >= 0) { list.splice(i, 1); save(db); return respond({ ok: true }) }
  throw Object.assign(new Error('Not found'), { response: { status: 404 } })
}
