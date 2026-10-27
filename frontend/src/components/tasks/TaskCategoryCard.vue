<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Tags, X } from 'lucide-vue-next'
import Chip from '@/components/ui/Chip.vue'
import { categoryTones, MAX_TASK_CATEGORIES, toneDot, type Tone } from '@/lib/categories'
import { taskCategorySchema } from '@/lib/schemas'
import { inputClass, btnPrimary } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { useCategoryMeta, useCreateTaskCategory, useDeleteTaskCategory } from '@/queries/categories'
import { toast } from 'vue-sonner'

// Kartu "Kategori Tugas": pengguna menambah/menghapus kategori sendiri.
// Daftar yang sama dipakai oleh form tugas (pilihan kategori) dan filter di halaman Tugas.
const { categories, isLoading } = useCategoryMeta()
const create = useCreateTaskCategory()
const remove = useDeleteTaskCategory()

const name = ref('')
const tone = ref<Tone>('primary')
const error = ref('')
const owned = computed(() => categories.value.filter((c) => !c.extra))
const full = computed(() => owned.value.length >= MAX_TASK_CATEGORIES)
const toneLabel: Record<Tone, string> = { primary: 'Ungu', secondary: 'Hijau', tertiary: 'Oranye', neutral: 'Abu-abu' }

const add = async () => {
  const parsed = taskCategorySchema.safeParse({ name: name.value, tone: tone.value })
  if (!parsed.success) { error.value = parsed.error.issues[0].message; return }
  if (categories.value.some((c) => c.name.toLowerCase() === parsed.data.name.toLowerCase())) { error.value = 'Kategori sudah ada'; return }
  error.value = ''
  try {
    await create.mutateAsync(parsed.data)
    name.value = ''
    // warna berikutnya otomatis berganti supaya kategori baru tidak seragam
    tone.value = categoryTones[(categoryTones.indexOf(tone.value) + 1) % categoryTones.length]
  } catch { /* toast error sudah ditampilkan oleh useCrud */ }
}
const del = (c: { id: string; name: string; count: number }) => {
  if (c.count > 0) { toast.error(`"${c.name}" masih dipakai ${c.count} tugas. Pindahkan atau hapus tugasnya dulu.`); return }
  remove.mutate(c.id)
}
</script>

<template>
  <div class="bg-white p-space-lg border-2 border-ink shadow-hard transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg flex flex-col gap-space-md">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary text-white border-2 border-ink flex items-center justify-center"><Tags :size="18" /></div>
        <div class="flex flex-col">
          <span class="font-headline-sm text-body-md font-bold text-on-surface">Kategori Tugas</span>
          <span class="font-label-sm text-label-sm text-on-surface-variant">Dipakai di form tugas &amp; filter</span>
        </div>
      </div>
      <span class="font-label-sm text-label-sm px-2 py-0.5 border-2 border-ink bg-accent text-ink font-bold">{{ owned.length }}/{{ MAX_TASK_CATEGORIES }}</span>
    </div>

    <div v-if="isLoading" class="font-body-sm text-body-sm text-on-surface-variant">Memuat kategori...</div>
    <div v-else-if="!categories.length" class="font-body-sm text-body-sm text-on-surface-variant">Belum ada kategori. Tambahkan yang pertama di bawah.</div>
    <ul v-else class="flex flex-wrap gap-space-sm">
      <li v-for="c in categories" :key="c.id || c.name" class="group/chip inline-flex items-center gap-1">
        <Chip :tone="c.tone">{{ c.name }}<span class="ml-1.5 opacity-60">{{ c.count }}</span></Chip>
        <button
          v-if="!c.extra" type="button" :aria-label="`Hapus kategori ${c.name}`" :disabled="remove.isPending.value" @click="del(c)"
          class="p-0.5 border-2 border-transparent text-on-surface opacity-60 hover:opacity-100 hover:bg-error hover:text-white hover:border-ink focus-visible:opacity-100 transition-all"
        ><X :size="12" /></button>
      </li>
    </ul>

    <form class="flex flex-col gap-space-sm pt-space-sm border-t-2 border-ink" @submit.prevent="add">
      <div class="flex gap-space-sm">
        <input v-model="name" maxlength="24" :disabled="full" :placeholder="full ? 'Batas kategori tercapai' : 'Nama kategori baru...'"
          :class="cn(inputClass, 'py-2 font-body-sm text-body-sm', error && 'ring-1 ring-error/60')" @input="error = ''" />
        <button type="submit" :disabled="create.isPending.value || full || !name.trim()" :class="cn(btnPrimary, 'shrink-0 px-3')" aria-label="Tambah kategori"><Plus :size="16" /> Tambah</button>
      </div>
      <p v-if="error" class="font-label-sm text-label-sm text-error">{{ error }}</p>
      <div class="flex items-center gap-2" role="radiogroup" aria-label="Warna kategori">
        <span class="font-label-sm text-label-sm text-on-surface-variant mr-1">Warna</span>
        <button v-for="t in categoryTones" :key="t" type="button" role="radio" :aria-checked="tone === t" :aria-label="toneLabel[t]" :title="toneLabel[t]" @click="tone = t"
          :class="cn('w-5 h-5 rounded-full transition-all ring-offset-2 ring-offset-white', 'border-2 border-ink', toneDot[t], tone === t ? 'ring-2 ring-ink scale-110' : 'hover:scale-110')">
        </button>
      </div>
    </form>
  </div>
</template>
