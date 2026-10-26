// Penerjemah antara bentuk data backend Go (lama) dan bentuk data frontend.
// Hapus file ini bila nanti backend sudah memakai remindH3/remindH1 dan tanggal YYYY-MM-DD.
import dayjs from 'dayjs'
import type { Bill, Task, Transaction } from '@/types'

type Raw = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

// ---- Pengingat: data lama punya satu `waReminder`; data baru sudah remindH3 + remindH1
function remindersFromApi(r: Raw) {
  const { waReminder, ...rest } = r
  return {
    ...rest,
    remindH3: r.remindH3 ?? Boolean(waReminder),
    remindH1: r.remindH1 ?? Boolean(waReminder),
  }
}
// ---- Tanggal: form memakai YYYY-MM-DD, backend memakai RFC3339 (time.Time)
const toRfc3339 = (d: string) => dayjs(d).format() // 2026-10-30 -> 2026-10-30T00:00:00+07:00
const toDateOnly = (d: string) => String(d).slice(0, 10)

// ---- Task: backend sudah memakai remindH3/remindH1 dan menerima dueDate YYYY-MM-DD,
// jadi data dikirim apa adanya. Saat membaca, data lama (RFC3339 / waReminder) tetap dimengerti.
export const taskFromApi = (r: Raw): Task => ({ ...remindersFromApi(r), dueDate: toDateOnly(r.dueDate) }) as Task
export const taskToApi = (v: Raw) => v

// ---- Bill
export const billFromApi = (r: Raw): Bill => remindersFromApi(r) as Bill
// Backend sudah memakai remindH3/remindH1 untuk tagihan -> kirim apa adanya
export const billToApi = (v: Raw) => v

// ---- Transaction (date: "2026-10-26T14:30:00" -> "2026-10-26T14:30:00+07:00")
export const txFromApi = (r: Raw): Transaction => r as Transaction
export const txToApi = (v: Raw) => (v.date ? { ...v, date: toRfc3339(v.date) } : v)
