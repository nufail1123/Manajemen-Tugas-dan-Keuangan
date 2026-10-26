<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Smartphone } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { waFormSchema } from '@/lib/schemas'
import { inputClass, btnPrimary } from '@/lib/styles'
import { useUpdateWa } from '@/queries'

const props = defineProps<{ current: string }>()
const open = defineModel<boolean>('open', { default: false })
const { mutateAsync, isPending } = useUpdateWa()

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(waFormSchema),
  initialValues: { waNumber: props.current },
})
const [waNumber] = defineField('waNumber')
watch(open, (v) => v && resetForm({ values: { waNumber: props.current } }))

const onSubmit = handleSubmit(async (v) => { await mutateAsync(v); open.value = false })
</script>

<template>
  <BaseDialog v-model:open="open" title="Ganti Nomor WhatsApp" description="Reminder akan dikirim ke nomor ini" :icon="Smartphone">
    <form class="p-space-lg flex flex-col gap-space-md" @submit.prevent="onSubmit">
      <FormField label="Nomor WhatsApp (format 628...)" :error="errors.waNumber">
        <input v-model="waNumber" inputmode="numeric" placeholder="6281290110000" :class="inputClass" />
      </FormField>
      <button type="submit" :disabled="isPending" :class="btnPrimary">Simpan Nomor</button>
    </form>
  </BaseDialog>
</template>
