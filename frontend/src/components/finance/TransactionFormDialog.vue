<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-vue-next'
import dayjs from 'dayjs'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import FormField from '@/components/ui/FormField.vue'
import { transactionSchema } from '@/lib/schemas'
import { txCategories } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { inputClass, btnPrimary } from '@/lib/styles'
import { useCreateTransaction, useUpdateTransaction } from '@/queries'
import type { Transaction } from '@/types'

const props = defineProps<{ editing?: Transaction | null }>()
const open = defineModel<boolean>('open', { default: false })
const create = useCreateTransaction()
const update = useUpdateTransaction()
const isPending = computed(() => create.isPending.value || update.isPending.value)

const initial = () => ({
  type: 'expense' as 'income' | 'expense', amount: undefined as number | undefined,
  category: 'Makanan', date: dayjs().format('YYYY-MM-DD'), description: '', method: '',
})
const fromTx = (t: Transaction) => ({
  type: t.type, amount: t.amount as number | undefined, category: t.category,
  date: t.date.slice(0, 10), description: t.description, method: t.method,
})
const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(transactionSchema),
  initialValues: initial(),
})
const [type] = defineField('type')
const [amount] = defineField('amount')
const [category] = defineField('category')
const [date] = defineField('date')
const [description] = defineField('description')
const [method] = defineField('method')

watch(open, (v) => v && resetForm({ values: props.editing ? fromTx(props.editing) : initial() }))
// Ganti jenis transaksi (saat pengguna menekan tombol) -> kategori default ikut berubah
const setType = (t: 'income' | 'expense') => {
  if (type.value === t) return
  type.value = t
  category.value = t === 'income' ? 'Gaji' : 'Makanan'
}

const onSubmit = handleSubmit(async (v) => {
  // Pertahankan jam asli saat mengubah; transaksi baru memakai jam sekarang
  const time = props.editing ? props.editing.date.slice(11, 19) : dayjs().format('HH:mm:ss')
  const payload = { ...v, date: `${v.date}T${time || '00:00:00'}` }
  if (props.editing) await update.mutateAsync({ id: props.editing.id, ...payload })
  else await create.mutateAsync(payload)
  open.value = false
})
</script>

<template>
  <BaseDialog
    v-model:open="open" :icon="Receipt"
    :title="editing ? 'Ubah Transaksi' : 'Catat Transaksi'" description="Data arus kas pada pembukuan pribadi"
  >
    <form class="p-space-lg flex flex-col gap-space-md" @submit.prevent="onSubmit">
      <div class="flex p-1 bg-surface-container rounded-xl">
        <button
          type="button" @click="setType('expense')"
          :class="cn('flex-1 py-2 rounded-lg font-body-sm text-body-sm font-semibold flex items-center justify-center gap-1.5 transition-all text-on-surface-variant hover:text-on-surface',
            type === 'expense' && 'bg-error-container/40 text-error shadow-sm hover:text-error')"
        ><ArrowUpRight :size="16" /> Pengeluaran</button>
        <button
          type="button" @click="setType('income')"
          :class="cn('flex-1 py-2 rounded-lg font-body-sm text-body-sm font-semibold flex items-center justify-center gap-1.5 transition-all text-on-surface-variant hover:text-on-surface',
            type === 'income' && 'bg-secondary-container/30 text-secondary shadow-sm hover:text-secondary')"
        ><ArrowDownLeft :size="16" /> Pemasukan</button>
      </div>
      <FormField label="Nominal Transaksi (Rupiah)" :error="errors.amount"><CurrencyInput v-model="amount" /></FormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <FormField label="Kategori" :error="errors.category">
          <BaseSelect v-model="category" :options="txCategories.map((c) => ({ value: c.value, label: c.label }))" />
        </FormField>
        <FormField label="Tanggal Transaksi" :error="errors.date"><DatePicker v-model="date" /></FormField>
      </div>
      <FormField label="Deskripsi" :error="errors.description">
        <input v-model="description" placeholder="Contoh: Makan siang tim" :class="inputClass" />
      </FormField>
      <FormField label="Metode Pembayaran (opsional)" :error="errors.method">
        <input v-model="method" placeholder="QRIS, Transfer Bank, Tunai..." :class="inputClass" />
      </FormField>
      <button type="submit" :disabled="isPending" :class="btnPrimary">
        {{ isPending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Transaksi' }}
      </button>
    </form>
  </BaseDialog>
</template>
