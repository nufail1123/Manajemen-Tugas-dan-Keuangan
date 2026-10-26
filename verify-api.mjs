#!/usr/bin/env node
/**
 * Uji kontrak API TaskFlow (backend <-> frontend).
 *
 *   node tools/verify-api.mjs                          # langsung ke backend (default :8088)
 *   node tools/verify-api.mjs http://localhost:5173/api   # lewat proxy Vite (npm run dev harus jalan)
 *
 * Skrip membuat data uji berawalan "[TEST-VERIFY]", memeriksanya, lalu MENGHAPUSNYA lagi.
 * ✓ lulus   ✗ wajib diperbaiki (frontend akan bermasalah)   ⚠ opsional (frontend punya cadangan)
 */
const BASE = (process.argv[2] ?? process.env.API ?? 'http://localhost:8088/api').replace(/\/$/, '')
const TAG = '[TEST-VERIFY]'
const C = { ok: '\x1b[32m', bad: '\x1b[31m', warn: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m', off: '\x1b[0m' }
const results = []
const created = { tasks: [], transactions: [], bills: [] }

// ---------- util
async function req(method, path, body) {
  let res
  try {
    res = await fetch(BASE + path, {
      method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new Error(`Tidak bisa terhubung ke ${BASE}${path} (${e.cause?.code ?? e.message}). Backend/Vite sudah jalan?`)
  }
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : undefined } catch { /* bukan JSON */ }
  return { status: res.status, text, json }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }
const okStatus = (r, what, allowed = [200, 201, 204]) =>
  assert(allowed.includes(r.status), `${what}: status ${r.status} (harapan ${allowed.join('/')}). Balasan: ${r.text.slice(0, 160)}`)
const num = (...v) => v.find((x) => typeof x === 'number')
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const now = new Date()
const thisMonth = ym(now)
const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 15)
const prevMonth = ym(prevDate)
const rfc = (day) => `${day}T12:00:00+07:00`
const in10 = new Date(now.getTime() + 10 * 864e5)

function section(t) { console.log(`\n${C.bold}${t}${C.off}`) }
async function check(name, level, fn) {
  try {
    const note = await fn()
    results.push({ name, level, ok: true })
    console.log(`${C.ok}✓${C.off} ${name}${note ? `${C.dim} — ${note}${C.off}` : ''}`)
  } catch (e) {
    results.push({ name, level, ok: false })
    console.log(`${level === 'must' ? C.bad + '✗' : C.warn + '⚠'}${C.off} ${name}\n    ${C.dim}${e.message}${C.off}`)
  }
}
const list = async (path) => {
  const r = await req('GET', path)
  okStatus(r, `GET ${path}`, [200])
  assert(Array.isArray(r.json), `GET ${path} harus mengembalikan array JSON langsung, bukan ${r.text.slice(0, 80)}`)
  return r.json
}
async function create(kind, body) {
  const r = await req('POST', `/${kind}`, body)
  okStatus(r, `POST /${kind}`, [200, 201])
  let id = r.json?.id
  if (!id) { // backend tidak mengembalikan objek -> cari di daftar
    const found = (await list(`/${kind}`)).find((x) => (x.title ?? x.name ?? x.description) === (body.title ?? body.name ?? body.description))
    id = found?.id
  }
  assert(id, `POST /${kind} berhasil tetapi id data baru tidak ditemukan`)
  created[kind].push(id)
  return String(id)
}
const getOne = async (kind, id) => {
  const item = (await list(`/${kind}`)).find((x) => String(x.id) === id)
  assert(item, `data ${id} tidak ditemukan di GET /${kind}`)
  return item
}
const same = (a, b, keys, what) => keys.forEach((k) => assert(JSON.stringify(a[k]) === JSON.stringify(b[k]), `${what}: field "${k}" berubah dari ${JSON.stringify(a[k])} menjadi ${JSON.stringify(b[k])}`))

// ---------- pengujian
async function main() {
  console.log(`${C.bold}TaskFlow API check${C.off}  ${C.dim}${BASE}  (bulan ini ${thisMonth})${C.off}`)
  const s = {} // state

  section('A. Koneksi & pengaturan WhatsApp')
  await check('GET /settings/wa mengembalikan nomor', 'must', async () => {
    const r = await req('GET', '/settings/wa'); okStatus(r, 'GET /settings/wa', [200])
    assert(typeof r.json?.waNumber === 'string', `field "waNumber" tidak ada: ${r.text.slice(0, 100)}`)
    s.wa = r.json.waNumber
  })
  await check('Nomor WA berformat 628… (syarat validasi form)', 'optional', async () => {
    assert(/^628\d{8,11}$/.test(s.wa ?? ''), `nomor "${s.wa}" bukan format 628xxxxxxxxxx; ganti lewat tombol "Ganti" di aplikasi`)
    return s.wa
  })

  section('B. Tugas (/tasks)')
  await check('GET /tasks: array, id string, field pengingat remindH3 + remindH1', 'must', async () => {
    const t = await list('/tasks')
    for (const x of t) {
      assert(x.id !== undefined && x.title !== undefined, 'item tugas tanpa id/title')
      assert(!('waReminder' in x && !('remindH3' in x)), `tugas "${x.title}" masih memakai waReminder; frontend butuh remindH3 dan remindH1`)
      assert(typeof x.remindH3 === 'boolean' && typeof x.remindH1 === 'boolean', `tugas "${x.title}": remindH3/remindH1 harus boolean`)
      assert(/^\d{4}-\d{2}-\d{2}/.test(String(x.dueDate)), `dueDate "${x.dueDate}" tidak diawali YYYY-MM-DD`)
    }
    return `${t.length} tugas`
  })
  const taskBody = {
    title: `${TAG} Tugas`, description: 'uji deskripsi', category: 'Frontend', url: 'https://example.com/uji',
    dueDate: ymd(in10), remindH3: true, remindH1: false, done: false,
  }
  await check('POST /tasks menyimpan H-3 dan H-1 secara terpisah', 'must', async () => {
    s.task = await create('tasks', taskBody)
    const t = await getOne('tasks', s.task)
    assert(t.remindH3 === true && t.remindH1 === false, `terkirim remindH3=true,remindH1=false, tersimpan ${t.remindH3}/${t.remindH1}`)
    assert(String(t.dueDate).startsWith(taskBody.dueDate), `dueDate terkirim ${taskBody.dueDate}, tersimpan ${t.dueDate}`)
    assert(t.title === taskBody.title && t.category === 'Frontend' && t.url === taskBody.url, 'title/category/url tidak tersimpan utuh')
  })
  await check('PATCH {done:true} hanya mengubah "done" (field lain utuh)', 'must', async () => {
    assert(s.task, 'dilewati: tugas uji belum terbuat')
    const before = await getOne('tasks', s.task)
    okStatus(await req('PATCH', `/tasks/${s.task}`, { done: true }), 'PATCH /tasks/:id')
    const after = await getOne('tasks', s.task)
    assert(after.done === true, 'done tidak berubah menjadi true')
    same(before, after, ['title', 'description', 'category', 'url', 'remindH3', 'remindH1'], 'PATCH menghapus data')
    assert(String(after.dueDate).slice(0, 10) === String(before.dueDate).slice(0, 10), 'dueDate ikut berubah')
  })
  await check('PATCH ubah penuh (judul, tanggal, H-3 dan H-1) tersimpan', 'must', async () => {
    assert(s.task, 'dilewati: tugas uji belum terbuat')
    const edit = { title: `${TAG} Tugas diubah`, description: 'deskripsi baru', category: 'DevOps', url: '', dueDate: ymd(new Date(in10.getTime() + 864e5)), remindH3: false, remindH1: true }
    okStatus(await req('PATCH', `/tasks/${s.task}`, edit), 'PATCH /tasks/:id')
    const t = await getOne('tasks', s.task)
    assert(t.title === edit.title && t.category === 'DevOps' && t.description === 'deskripsi baru', 'title/category/description tidak berubah')
    assert(t.remindH3 === false && t.remindH1 === true, `H-3/H-1 tersimpan ${t.remindH3}/${t.remindH1}, harapan false/true`)
    assert(String(t.dueDate).startsWith(edit.dueDate), `dueDate harapan ${edit.dueDate}, tersimpan ${t.dueDate}`)
    assert(t.done === true, 'field done (true) ikut tertimpa saat ubah penuh')
  })
  await check('DELETE /tasks/:id menghapus data', 'must', async () => {
    assert(s.task, 'dilewati: tugas uji belum terbuat')
    okStatus(await req('DELETE', `/tasks/${s.task}`), 'DELETE /tasks/:id')
    assert(!(await list('/tasks')).some((x) => String(x.id) === s.task), 'tugas masih ada setelah DELETE')
    created.tasks = created.tasks.filter((x) => x !== s.task)
  })
  await check('POST /tasks dengan isi kosong ditolak (400)', 'optional', async () => {
    const r = await req('POST', '/tasks', {})
    if (r.status === 200 || r.status === 201) { if (r.json?.id) created.tasks.push(String(r.json.id)); throw new Error('data kosong diterima; sebaiknya backend memvalidasi dan membalas 400') }
    assert(r.status === 400 || r.status === 422, `status ${r.status}`)
  })

  section('C. Transaksi (/transactions)')
  const day = (m) => `${m}-15`
  const sumKeys = async (m) => {
    const r = await req('GET', `/finance/summary?month=${m}`)
    if (r.status !== 200 || !r.json) return null
    return { income: num(r.json.income, r.json.totalIncome), expense: num(r.json.expense, r.json.totalExpense), balance: r.json.balance, raw: r.json }
  }
  s.before = await sumKeys(thisMonth)
  const mk = (type, amount, category, m, label) => ({ type, description: `${TAG} ${label}`, amount, category, method: 'Uji', date: rfc(day(m)) })
  await check('POST income bulan ini; amount tersimpan sebagai angka', 'must', async () => {
    s.income = await create('transactions', mk('income', 123456, 'Gaji', thisMonth, 'pemasukan'))
    const t = await getOne('transactions', s.income)
    assert(t.type === 'income' && typeof t.amount === 'number' && t.amount === 123456, `type/amount: ${t.type}/${typeof t.amount} ${t.amount}`)
    assert(String(t.date).startsWith(day(thisMonth)), `date terkirim ${day(thisMonth)}, tersimpan ${t.date}`)
    assert(t.category === 'Gaji' && t.method === 'Uji', 'category/method tidak tersimpan')
  })
  await check('POST expense bulan ini dan bulan lalu', 'must', async () => {
    s.expense = await create('transactions', mk('expense', 7000, 'Makanan', thisMonth, 'pengeluaran'))
    s.old = await create('transactions', mk('expense', 55555, 'Makanan', prevMonth, 'bulan-lalu'))
  })
  const ids = async (path) => (await list(path)).map((x) => String(x.id))
  await check('GET ?month= hanya mengembalikan transaksi bulan itu', 'optional', async () => {
    const got = await ids(`/transactions?month=${thisMonth}`)
    assert(got.includes(s.income) && got.includes(s.expense), 'transaksi bulan ini tidak muncul')
    assert(!got.includes(s.old), 'transaksi bulan lalu ikut muncul; backend belum menyaring ?month= (frontend menyaring sendiri, tapi data besar jadi boros)')
    const prev = await ids(`/transactions?month=${prevMonth}`)
    assert(prev.includes(s.old) && !prev.includes(s.income), 'filter bulan lalu tidak tepat')
  })
  await check('GET ?month=&category= menyaring kategori', 'optional', async () => {
    const got = await ids(`/transactions?month=${thisMonth}&category=Gaji`)
    assert(got.includes(s.income), 'transaksi kategori Gaji tidak muncul')
    assert(!got.includes(s.expense), 'transaksi kategori Makanan ikut muncul; backend belum menyaring ?category=')
  })
  await check('GET ?month=&q= mencari di deskripsi', 'optional', async () => {
    const got = await ids(`/transactions?month=${thisMonth}&q=pengeluaran`)
    assert(got.includes(s.expense), 'pencarian "pengeluaran" tidak menemukan datanya')
    assert(!got.includes(s.income), 'hasil pencarian tidak disaring; backend belum mendukung ?q=')
  })
  await check('PATCH {amount} hanya mengubah nominal (field lain utuh)', 'must', async () => {
    assert(s.income, 'dilewati: transaksi uji belum terbuat')
    const before = await getOne('transactions', s.income)
    okStatus(await req('PATCH', `/transactions/${s.income}`, { amount: 130000 }), 'PATCH /transactions/:id')
    const after = await getOne('transactions', s.income)
    assert(after.amount === 130000, `amount ${after.amount}, harapan 130000`)
    same(before, after, ['type', 'description', 'category', 'method'], 'PATCH menghapus data')
    assert(String(after.date).slice(0, 10) === String(before.date).slice(0, 10), 'date ikut berubah')
    okStatus(await req('PATCH', `/transactions/${s.income}`, { amount: 123456 }), 'PATCH kembali')
  })
  await check('PATCH ubah penuh (kategori, tanggal, jenis) tersimpan', 'must', async () => {
    assert(s.expense, 'dilewati: transaksi uji belum terbuat')
    const edit = { ...mk('expense', 8000, 'Transportasi', thisMonth, 'pengeluaran'), date: rfc(`${thisMonth}-10`) }
    okStatus(await req('PATCH', `/transactions/${s.expense}`, edit), 'PATCH /transactions/:id')
    const t = await getOne('transactions', s.expense)
    assert(t.amount === 8000 && t.category === 'Transportasi', `amount/category ${t.amount}/${t.category}`)
    assert(String(t.date).startsWith(`${thisMonth}-10`), `date tersimpan ${t.date}`)
    okStatus(await req('PATCH', `/transactions/${s.expense}`, { amount: 7000, category: 'Makanan' }), 'PATCH kembali')
  })

  section('D. Tagihan (/bills)')
  await check('GET /bills: array, field remindH3 + remindH1', 'must', async () => {
    const b = await list('/bills')
    for (const x of b) {
      assert(!('waReminder' in x && !('remindH3' in x)), `tagihan "${x.name}" masih memakai waReminder; frontend butuh remindH3 dan remindH1`)
      assert(typeof x.amount === 'number' && typeof x.day === 'number', `tagihan "${x.name}": amount/day harus angka`)
    }
    return `${b.length} tagihan`
  })
  const billBody = { name: `${TAG} Listrik`, amount: 350000, day: 5, remindH3: true, remindH1: false }
  await check('POST /bills menyimpan H-3 dan H-1 terpisah', 'must', async () => {
    s.bill = await create('bills', billBody)
    const b = await getOne('bills', s.bill)
    assert(b.amount === 350000 && b.day === 5, `amount/day ${b.amount}/${b.day}`)
    assert(b.remindH3 === true && b.remindH1 === false, `tersimpan ${b.remindH3}/${b.remindH1}, harapan true/false`)
  })
  await check('PATCH tagihan: ubah nominal dan pengingat, field lain utuh', 'must', async () => {
    assert(s.bill, 'dilewati: tagihan uji belum terbuat')
    const before = await getOne('bills', s.bill)
    okStatus(await req('PATCH', `/bills/${s.bill}`, { name: before.name, amount: 400000, day: 5, remindH3: false, remindH1: true }), 'PATCH /bills/:id')
    const after = await getOne('bills', s.bill)
    assert(after.amount === 400000, `amount ${after.amount}, harapan 400000`)
    assert(after.remindH3 === false && after.remindH1 === true, `H-3/H-1 tersimpan ${after.remindH3}/${after.remindH1}`)
    same(before, after, ['name', 'day'], 'PATCH menghapus data')
    okStatus(await req('PATCH', `/bills/${s.bill}`, { amount: 410000 }), 'PATCH parsial')
    same(after, await getOne('bills', s.bill), ['name', 'day', 'remindH3', 'remindH1'], 'PATCH parsial menghapus data')
  })

  section('E. Ringkasan keuangan (/finance/summary)')
  await check('Endpoint ada dan memuat income/expense/balance', 'optional', async () => {
    assert(s.before, 'endpoint tidak ada atau bukan JSON; frontend akan menghitung sendiri dari /transactions dan /bills')
    assert(typeof s.before.income === 'number' && typeof s.before.expense === 'number' && typeof s.before.balance === 'number', `income/expense/balance harus angka: ${JSON.stringify(s.before.raw).slice(0, 100)}`)
  })
  await check('Angka ikut berubah: +income 123456, +expense 7000 (nilai diukur sebelum/sesudah)', 'optional', async () => {
    assert(s.before, 'dilewati: endpoint ringkasan tidak ada')
    const after = await sumKeys(thisMonth)
    assert(after.income - s.before.income === 123456, `income naik ${after.income - s.before.income}, harapan 123456 (bulan ini)`)
    assert(after.expense - s.before.expense === 7000, `expense naik ${after.expense - s.before.expense}, harapan 7000; transaksi bulan lalu tidak boleh ikut`)
    assert(after.balance - s.before.balance === 116456, `balance naik ${after.balance - s.before.balance}, harapan 116456`)
  })
  await check('Field lengkap (incomeCount, expenseCount, billTotal, billCount, byCategory, daily)', 'optional', async () => {
    assert(s.before, 'dilewati: endpoint ringkasan tidak ada')
    const miss = ['incomeCount', 'expenseCount', 'billTotal', 'billCount', 'byCategory', 'daily'].filter((k) => s.before.raw[k] === undefined)
    assert(!miss.length, `belum ada: ${miss.join(', ')}. Frontend melengkapinya dari /transactions dan /bills, jadi tidak wajib`)
  })

  section('F. Penghapusan transaksi dan tagihan')
  await check('DELETE transaksi dan tagihan', 'must', async () => {
    for (const [kind, key] of [['transactions', 'income'], ['transactions', 'expense'], ['transactions', 'old'], ['bills', 'bill']]) {
      if (!s[key]) continue
      okStatus(await req('DELETE', `/${kind}/${s[key]}`), `DELETE /${kind}/${s[key]}`)
      assert(!(await ids(`/${kind}`)).includes(s[key]), `${kind}/${s[key]} masih ada setelah DELETE`)
      created[kind] = created[kind].filter((x) => x !== s[key])
    }
  })
  await check('Ringkasan kembali ke angka semula setelah data uji dihapus', 'optional', async () => {
    assert(s.before, 'dilewati: endpoint ringkasan tidak ada')
    const end = await sumKeys(thisMonth)
    assert(end.income === s.before.income && end.expense === s.before.expense, `income/expense ${end.income}/${end.expense}, semula ${s.before.income}/${s.before.expense}`)
  })
}

// ---------- pembersihan (selalu jalan, bahkan bila ada tes yang gagal)
async function cleanup() {
  let removed = 0
  try {
    for (const kind of ['tasks', 'transactions', 'bills']) {
      const all = await list(`/${kind}`).catch(() => [])
      const stray = all.filter((x) => String(x.title ?? x.name ?? x.description ?? '').startsWith(TAG)).map((x) => String(x.id))
      for (const id of new Set([...created[kind], ...stray])) { const r = await req('DELETE', `/${kind}/${id}`); if (r.status < 300) removed++ }
    }
  } catch { /* abaikan */ }
  console.log(`\n${C.dim}Pembersihan: ${removed} data uji dihapus.${C.off}`)
}

try { await main() } catch (e) { console.log(`${C.bad}✗ Berhenti: ${e.message}${C.off}`); results.push({ ok: false, level: 'must', name: 'koneksi' }) }
await cleanup()

const pass = results.filter((r) => r.ok).length
const bad = results.filter((r) => !r.ok && r.level === 'must').length
const warn = results.filter((r) => !r.ok && r.level === 'optional').length
console.log(`\n${C.bold}Hasil:${C.off} ${C.ok}${pass} lulus${C.off}, ${bad ? C.bad : C.dim}${bad} wajib diperbaiki${C.off}, ${warn ? C.warn : C.dim}${warn} opsional${C.off}`)
console.log(bad ? `${C.bad}Belum siap: perbaiki butir ✗ dulu.${C.off}` : `${C.ok}Siap: kontrak API yang dibutuhkan frontend terpenuhi.${C.off}`)
process.exit(bad ? 1 : 0)
