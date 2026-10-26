export interface Task {
  id: string
  title: string
  description: string
  category: string
  url: string
  dueDate: string // YYYY-MM-DD
  remindH3: boolean
  remindH1: boolean
  done: boolean
}
export interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  method: string
  date: string // ISO datetime
}
export interface Bill {
  id: string
  name: string
  amount: number
  day: number
  remindH3: boolean
  remindH1: boolean
}
export interface WaSettings { waNumber: string }

export interface FinanceSummary {
  month: string // YYYY-MM
  income: number
  expense: number
  balance: number
  incomeCount: number
  expenseCount: number
  billTotal: number
  billCount: number
  byCategory: { category: string; amount: number }[] // pengeluaran per kategori, urut terbesar
  daily: { day: number; expense: number }[] // pengeluaran per tanggal
}
export interface TransactionFilter { month: string; category?: string; q?: string }
