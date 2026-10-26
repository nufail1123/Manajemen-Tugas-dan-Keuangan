import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'

export type TaskFilter = 'all' | 'today' | 'upcoming' | 'done'

// State global: filter yang aktif tetap tersimpan saat pindah halaman
export const useUiStore = defineStore('ui', () => {
  const taskFilter = ref<TaskFilter>('all')
  const taskSort = ref('due') // 'due' | 'title'
  const taskSearch = ref('')
  const month = ref(dayjs().format('YYYY-MM'))
  const txCategory = ref('Semua')
  const txSearch = ref('')
  return { taskFilter, taskSort, taskSearch, month, txCategory, txSearch }
})
