import { z } from 'zod'

const amount = z
  .number({ required_error: 'Nominal wajib diisi', invalid_type_error: 'Nominal wajib diisi' })
  .positive('Nominal harus lebih dari 0')

export const waNumberSchema = z
  .string({ required_error: 'Nomor WhatsApp wajib diisi' })
  .regex(/^628\d{8,11}$/, 'Gunakan format 628xxxxxxxxxx (tanpa +, spasi, atau awalan 0)')

export const taskSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter'),
  description: z.string().trim().default(''),
  category: z.string().min(1, 'Pilih kategori'),
  url: z.string().trim().url('URL tidak valid (contoh: https://notion.so/...)').or(z.literal('')).default(''),
  dueDate: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
  remindH3: z.boolean().default(true),
  remindH1: z.boolean().default(true),
})

export const taskCategorySchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(24, 'Nama maksimal 24 karakter')
    .refine((v) => v.toLowerCase() !== 'semua', 'Nama "Semua" dicadangkan untuk filter'),
  tone: z.enum(['primary', 'secondary', 'tertiary', 'neutral']),
})

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount,
  category: z.string().min(1, 'Pilih kategori'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().trim().min(3, 'Deskripsi minimal 3 karakter'),
  method: z.string().trim().default(''),
})

export const billSchema = z.object({
  name: z.string().trim().min(3, 'Nama tagihan minimal 3 karakter'),
  amount,
  day: z.number({ required_error: 'Isi tanggal 1-31', invalid_type_error: 'Isi tanggal 1-31' })
    .int().min(1, 'Minimal 1').max(31, 'Maksimal 31'),
  remindH3: z.boolean().default(true),
  remindH1: z.boolean().default(true),
})

const email = z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid')
const password = z.string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf')
  .regex(/\d/, 'Kata sandi harus mengandung angka')

export const loginSchema = z.object({ email, password: z.string().min(1, 'Kata sandi wajib diisi') })
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama terlalu panjang'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Ulangi kata sandi'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Kata sandi tidak sama' })

export const waFormSchema = z.object({ waNumber: waNumberSchema })

export type TaskInput = z.infer<typeof taskSchema>
export type TaskCategoryInput = z.infer<typeof taskCategorySchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type BillInput = z.infer<typeof billSchema>

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
