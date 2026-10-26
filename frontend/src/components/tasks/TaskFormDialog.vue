<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { ListPlus } from 'lucide-vue-next'
import dayjs from 'dayjs'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import FormField from '@/components/ui/FormField.vue'
import WaSwitch from '@/components/ui/WaSwitch.vue'
import { taskSchema } from '@/lib/schemas'
import { useCategoryMeta } from '@/queries/categories'
import { inputClass, btnPrimary } from '@/lib/styles'
import { useCreateTask, useUpdateTask } from '@/queries'
import type { Task } from '@/types'

// Satu dialog untuk tambah DAN ubah: kirim `editing` untuk mode ubah
const props = defineProps<{ editing?: Task | null }>()
const open = defineModel<boolean>('open', { default: false })
const { categories } = useCategoryMeta()
const categoryOptions = computed(() => categories.value.map((c) => ({ value: c.name, label: c.name })))
const create = useCreateTask()
const update = useUpdateTask()
const isPending = computed(() => create.isPending.value || update.isPending.value)

const initial = () => ({
  title: '', description: '', category: categories.value[0]?.name ?? '', url: '',
  dueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), remindH3: true, remindH1: true,
})
const fromTask = (t: Task) => ({
  title: t.title, description: t.description, category: t.category, url: t.url,
  dueDate: t.dueDate, remindH3: t.remindH3, remindH1: t.remindH1,
})
const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(taskSchema),
  initialValues: initial(),
})
const [title] = defineField('title')
const [description] = defineField('description')
const [category] = defineField('category')
const [url] = defineField('url')
const [dueDate] = defineField('dueDate')
const [remindH3] = defineField('remindH3')
const [remindH1] = defineField('remindH1')

// Setiap dialog dibuka, isi form dari data yang diubah (atau kosongkan)
watch(open, (v) => v && resetForm({ values: props.editing ? fromTask(props.editing) : initial() }))

const onSubmit = handleSubmit(async (values) => {
  if (props.editing) await update.mutateAsync({ id: props.editing.id, ...values })
  else await create.mutateAsync(values)
  open.value = false
})
</script>

<template>
  <BaseDialog
    v-model:open="open" :icon="ListPlus"
    :title="editing ? 'Ubah Tugas' : 'Tugas Baru'" description="Atur jadwal dan pengingat WhatsApp"
  >
    <form class="p-space-lg flex flex-col gap-space-md" @submit.prevent="onSubmit">
      <FormField label="Judul Tugas" :error="errors.title">
        <input v-model="title" placeholder="Contoh: Siapkan deck presentasi" :class="inputClass" />
      </FormField>
      <FormField label="Deskripsi (opsional)" :error="errors.description">
        <input v-model="description" placeholder="Catatan singkat" :class="inputClass" />
      </FormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <FormField label="Kategori" :error="errors.category">
          <BaseSelect v-model="category" :options="categoryOptions" placeholder="Pilih kategori" />
        </FormField>
        <FormField label="Jatuh Tempo" :error="errors.dueDate"><DatePicker v-model="dueDate" /></FormField>
      </div>
      <FormField label="Tautan Referensi (opsional)" :error="errors.url">
        <input v-model="url" placeholder="https://..." :class="inputClass" />
      </FormField>
      <WaSwitch v-model:h3="remindH3" v-model:h1="remindH1" />
      <button type="submit" :disabled="isPending" :class="btnPrimary">
        {{ isPending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Tugas' }}
      </button>
    </form>
  </BaseDialog>
</template>
