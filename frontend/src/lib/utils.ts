import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const rupiah = (n: number) => `Rp ${Math.abs(Math.round(n)).toLocaleString('id-ID')}`
export const signedRupiah = (n: number, type: 'income' | 'expense') => `${type === 'income' ? '+' : '-'}${rupiah(n)}`

export const fmtDateTime = (iso: string) => `${dayjs(iso).format('DD MMM YYYY, HH:mm')} WIB`
export const fmtDate = (d: string) => dayjs(d).format('DD MMM')

/** Tanggal jatuh tempo berikutnya untuk tagihan bulanan (tgl 1-31). */
export function nextDue(day: number) {
  const now = dayjs().startOf('day')
  let d = now.date(Math.min(day, now.daysInMonth()))
  if (d.isBefore(now)) {
    const next = now.add(1, 'month')
    d = next.date(Math.min(day, next.daysInMonth()))
  }
  return d
}
export function dueLabel(day: number) {
  const diff = nextDue(day).diff(dayjs().startOf('day'), 'day')
  if (diff === 0) return { text: 'Hari ini', soon: true }
  if (diff <= 7) return { text: `${diff} hari lagi`, soon: true }
  return { text: 'Bulan depan', soon: false }
}

/** 6281290110000 -> +62 812-9011-XXXX */
export const maskWa = (n: string) =>
  n.length < 10 ? n : `+${n.slice(0, 2)} ${n.slice(2, 5)}-${n.slice(5, n.length - 4)}-XXXX`
