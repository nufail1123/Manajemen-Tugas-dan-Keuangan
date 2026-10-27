// API palsu berbasis localStorage supaya frontend bisa jalan tanpa backend Go.
// Matikan dengan VITE_USE_MOCK=false di .env
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import dayjs from 'dayjs'
import { defaultTaskCategories, MAX_TASK_CATEGORIES } from './categories'

type Row = { id: string; [k: string]: unknown }
interface DB { tasks: Row[]; transactions: Row[]; bills: Row[]; taskCategories: Row[]; settings: { waNumber: string } }
const USERS_KEY = 'taskflow-mock-users-v1'
const dbKey = (userId: string) => `taskflow-mock-db-v3:${userId}`
interface MockUser { id: string; name: string; email: string; password: string }
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
    taskCategories: defaultTaskCategories.map((c) => ({ id: uid(), ...c })),
    settings: { waNumber: '6281290110000' },
  }
}
const loadUsers = (): MockUser[] => { try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') } catch { return [] } }
const saveUsers = (u: MockUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(u))
// Setiap akun punya data sendiri (akun baru diisi data contoh agar tampilan tidak kosong)
const load = (userId: string): DB => {
  try {
    const raw = localStorage.getItem(dbKey(userId))
    if (raw) {
      const db = JSON.parse(raw) as DB
      // Data lama (sebelum ada kategori kustom): isi kategori bawaan + kategori yang sudah dipakai tugas
      if (!db.taskCategories) {
        const names = new Set<string>(defaultTaskCategories.map((c) => c.name))
        db.tasks.forEach((t) => t.category && names.add(String(t.category)))
        db.taskCategories = [...names].map((name) => ({ id: uid(), name, tone: defaultTaskCategories.find((c) => c.name === name)?.tone ?? 'neutral' }))
        localStorage.setItem(dbKey(userId), JSON.stringify(db))
      }
      return db
    }
  } catch { /* abaikan */ }
  const db = seed(); localStorage.setItem(dbKey(userId), JSON.stringify(db)); return db
}
const save = (userId: string, db: DB) => localStorage.setItem(dbKey(userId), JSON.stringify(db))
const publicUser = ({ password: _p, ...u }: MockUser) => u
const tokenFor = (u: MockUser) => `mock.${u.id}`

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
  const method = (config.method ?? 'get').toLowerCase()
  const path = (config.url ?? '').replace(/^\/api/, '')
  const body = config.data ? JSON.parse(config.data) : {}
  const cfg = config as InternalAxiosRequestConfig
  const respond = (data: unknown, status = 200) => ({ data, status, statusText: 'OK', headers: {}, config: cfg, request: {} })
  // Adapter kustom harus menolak sendiri untuk status error (seperti yang dilakukan axios pada HTTP sungguhan)
  const fail = (status: number, error: string): never => {
    throw new AxiosError(error, String(status), cfg, null, { data: { error }, status, statusText: String(status), headers: {}, config: cfg })
  }

  // ---- Autentikasi (publik)
  if (path === '/auth/register' && method === 'post') {
    const { name, email, password, recaptchaToken } = body
    if (!name || !email || !password) fail(400, 'Data tidak lengkap')
    if (!recaptchaToken) fail(400, 'Verifikasi reCAPTCHA gagal, silakan coba lagi.') // backend asli memverifikasi token ke Google
    const users = loadUsers()
    if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) fail(409, 'Email sudah terdaftar')
    const user: MockUser = { id: uid(), name, email: String(email).toLowerCase(), password }
    saveUsers([...users, user])
    return respond({ token: tokenFor(user), user: publicUser(user) }, 201)
  }
  if (path === '/auth/login' && method === 'post') {
    const user = loadUsers().find((u) => u.email === String(body.email ?? '').toLowerCase() && u.password === body.password)
    if (!user) fail(401, 'Email atau kata sandi salah')
    return respond({ token: tokenFor(user!), user: publicUser(user!) })
  }

  // ---- Semua yang lain wajib membawa token
  const bearer = String(cfg.headers?.get?.('Authorization') ?? '').replace(/^Bearer\s+/, '')
  const me = loadUsers().find((u) => bearer === `mock.${u.id}`)
  if (!me) fail(401, 'Token tidak valid atau kedaluwarsa')
  const user = me!

  if (path === '/auth/logout' && method === 'post') return respond(undefined, 204)
  if (path === '/auth/me' && method === 'get') return respond(publicUser(user))
  if (path === '/auth/me' && method === 'delete') {
    if (body.password !== user.password) fail(403, 'Kata sandi salah')
    saveUsers(loadUsers().filter((u) => u.id !== user.id))
    localStorage.removeItem(dbKey(user.id))
    return respond(undefined, 204)
  }

  // ---- Data milik pengguna
  const db = load(user.id)
  if (path === '/settings/wa') {
    if (method === 'put') { db.settings = { ...db.settings, ...body }; save(user.id, db) }
    return respond(db.settings)
  }
  if (path === '/finance/summary' && method === 'get') return respond(summarize(db, String(cfg.params?.month ?? dayjs().format('YYYY-MM'))))
  const m = path.match(/^\/(tasks|transactions|bills|task-categories)(?:\/([\w-]+))?$/)
  if (!m) fail(404, 'Not found')

  // ---- Kategori tugas: nama unik (tanpa membedakan huruf besar/kecil), maks 20, tidak bisa dihapus bila dipakai tugas
  if (m![1] === 'task-categories') {
    const cats = db.taskCategories
    if (method === 'get') return respond(cats)
    if (method === 'post') {
      const name = String(body.name ?? '').trim().replace(/\s+/g, ' ')
      const tone = ['primary', 'secondary', 'tertiary', 'neutral'].includes(body.tone) ? body.tone : 'neutral'
      if (name.length < 2 || name.length > 24) fail(400, 'Nama kategori 2-24 karakter')
      if (name.toLowerCase() === 'semua') fail(400, 'Nama "Semua" tidak boleh dipakai')
      if (cats.some((c) => String(c.name).toLowerCase() === name.toLowerCase())) fail(409, 'Kategori sudah ada')
      if (cats.length >= MAX_TASK_CATEGORIES) fail(409, `Maksimal ${MAX_TASK_CATEGORIES} kategori`)
      const row = { id: uid(), name, tone }
      cats.push(row); save(user.id, db)
      return respond(row, 201)
    }
    const ci = cats.findIndex((c) => c.id === m![2])
    if (ci < 0) fail(404, 'Not found')
    if (method === 'delete') {
      const used = db.tasks.filter((t) => t.category === cats[ci].name).length
      if (used > 0) fail(409, `Kategori masih dipakai ${used} tugas`)
      cats.splice(ci, 1); save(user.id, db)
      return respond(undefined, 204)
    }
    return fail(405, 'Method not allowed')
  }

  const list = db[m![1] as 'tasks' | 'transactions' | 'bills'] as Row[]
  // Tugas wajib memakai kategori milik pengguna (dicek hanya bila field category dikirim)
  if (m![1] === 'tasks' && (method === 'post' || method === 'patch') && body.category !== undefined &&
    !db.taskCategories.some((c) => c.name === body.category)) fail(400, 'Kategori tidak ditemukan')
  if (method === 'get') {
    if (m![1] !== 'transactions') return respond(list)
    // Filter di "server": ?month=YYYY-MM&category=Makanan&q=kata
    const { month, category, q } = cfg.params ?? {}
    const rows = list.filter((r) =>
      (!month || String(r.date).startsWith(month)) &&
      (!category || category === 'Semua' || r.category === category) &&
      (!q || `${r.description} ${r.category}`.toLowerCase().includes(String(q).toLowerCase())))
    return respond(rows.sort((a, b) => String(b.date).localeCompare(String(a.date))))
  }
  if (method === 'post') { const row = { id: uid(), ...body }; list.unshift(row); save(user.id, db); return respond(row, 201) }
  const i = list.findIndex((r) => r.id === m![2])
  if (i < 0) fail(404, 'Not found')
  if (method === 'patch') { list[i] = { ...list[i], ...body }; save(user.id, db); return respond(undefined, 204) }
  if (method === 'delete') { list.splice(i, 1); save(user.id, db); return respond(undefined, 204) }
  return fail(405, 'Method not allowed')
}
