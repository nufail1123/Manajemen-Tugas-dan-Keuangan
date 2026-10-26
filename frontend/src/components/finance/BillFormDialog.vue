<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { CalendarClock } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import FormField from '@/components/ui/FormField.vue'
import WaSwitch from '@/components/ui/WaSwitch.vue'
import { billSchema } from '@/lib/schemas'
import { inputClass, btnPrimary } from '@/lib/styles'
import { useCreateBill, useUpdateBill } from '@/queries'
import type { Bill } from '@/types'

const props = defineProps<{ editing?: Bill | null }>()
const open = defineModel<boolean>('open', { default: false })
const create = useCreateBill()
const update = useUpdateBill()
const isPending = computed(() => create.isPending.value || update.isPending.value)

const initial = () => ({
  name: '', amount: undefined as number | undefined, day: undefined as number | undefined, remindH3: true, remindH1: true,
})
const fromBill = (b: Bill) => ({ name: b.name, amount: b.amount as number | undefined, day: b.day as number | undefined, remindH3: b.remindH3, remindH1: b.remindH1 })
const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(billSchema),
  initialValues: initial(),
})
const [name] = defineField('name')
const [amount] = defineField('amount')
const [day] = defineField('day')
const [remindH3] = defineField('remindH3')
const [remindH1] = defineField('remindH1')

watch(open, (v) => v && resetForm({ values: props.editing ? fromBill(props.editing) : initial() }))

const onSubmit = handleSubmit(async (v) => {
  if (props.editing) await update.mutateAsync({ id: props.editing.id, ...v })
  else await create.mutateAsync(v)
  open.value = false
})
</script>

<template>
  <BaseDialog
    v-model:open="open" :icon="CalendarClock"
    :title="editing ? 'Ubah Tagihan' : 'Tagihan Baru'" description="Tagihan rutin bulanan dengan pengingat WhatsApp"
  >
    <form class="p-space-lg flex flex-col gap-space-md" @submit.prevent="onSubmit">
      <FormField label="Nama Tagihan" :error="errors.name">
        <input v-model="name" placeholder="Contoh: Listrik PLN" :class="inputClass" />
      </FormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <FormField label="Nominal" :error="errors.amount"><CurrencyInput v-model="amount" /></FormField>
        <FormField label="Jatuh Tempo Tiap Tanggal" :error="errors.day">
          <input v-model.number="day" type="number" min="1" max="31" placeholder="1 - 31" :class="inputClass" />
        </FormField>
      </div>
      <WaSwitch v-model:h3="remindH3" v-model:h1="remindH1" />
      <button type="submit" :disabled="isPending" :class="btnPrimary">
        {{ isPending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Jadwalkan Tagihan' }}
      </button>
    </form>
  </BaseDialog>
</template>
