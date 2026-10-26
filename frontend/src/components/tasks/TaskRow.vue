<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check, Link2, Pencil, Trash2, CalendarDays } from 'lucide-vue-next'
import dayjs from 'dayjs'
import Chip from '@/components/ui/Chip.vue'
import WaChip from '@/components/ui/WaChip.vue'
import { taskTone } from '@/lib/categories'
import { cn, fmtDate } from '@/lib/utils'
import type { Task } from '@/types'

const props = defineProps<{ task: Task; readonly?: boolean }>()
defineEmits<{ toggle: [done: boolean]; edit: []; remove: [] }>()

const isToday = () => dayjs(props.task.dueDate).isSame(dayjs(), 'day')
const host = () => { try { return new URL(props.task.url).host } catch { return props.task.url } }
</script>

<template>
  <div class="group p-space-md bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
    <div class="flex items-center gap-space-md min-w-0">
      <CheckboxRoot
        :model-value="task.done" @update:model-value="$emit('toggle', $event === true)"
        class="w-5 h-5 shrink-0 rounded-md bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest data-[state=checked]:bg-primary"
      >
        <CheckboxIndicator><Check :size="14" class="text-on-primary" /></CheckboxIndicator>
      </CheckboxRoot>
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-2">
          <span :class="cn('font-headline-sm text-body-lg font-medium text-on-surface truncate', task.done && 'line-through text-on-surface-variant')">{{ task.title }}</span>
          <Chip :tone="taskTone[task.category] ?? 'neutral'">{{ task.category }}</Chip>
        </div>
        <span class="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">{{ task.description }}</span>
      </div>
    </div>
    <div class="flex items-center gap-space-sm shrink-0 flex-wrap">
      <a v-if="task.url" :href="task.url" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm max-w-[10rem]">
        <Link2 :size="12" /><span class="truncate">{{ host() }}</span>
      </a>
      <span :class="cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-label-sm text-label-sm',
        isToday() && !task.done ? 'bg-tertiary-container/20 text-tertiary' : 'bg-surface-container-high text-on-surface')">
        <CalendarDays :size="12" />{{ isToday() && !task.done ? 'Jatuh Tempo Hari Ini' : fmtDate(task.dueDate) }}
      </span>
      <WaChip :h3="task.remindH3" :h1="task.remindH1" />
      <button v-if="!readonly" type="button" title="Ubah" class="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" @click="$emit('edit')">
        <Pencil :size="18" />
      </button>
      <button v-if="!readonly" type="button" title="Hapus" class="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-container/20 text-on-surface-variant hover:text-error" @click="$emit('remove')">
        <Trash2 :size="18" />
      </button>
    </div>
  </div>
</template>
