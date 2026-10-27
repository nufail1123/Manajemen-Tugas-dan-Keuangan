<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check, Link2, Pencil, Trash2, CalendarDays } from 'lucide-vue-next'
import dayjs from 'dayjs'
import Chip from '@/components/ui/Chip.vue'
import WaChip from '@/components/ui/WaChip.vue'
import { useCategoryMeta } from '@/queries/categories'
import { cn, fmtDate } from '@/lib/utils'
import type { Task } from '@/types'

const { toneOf } = useCategoryMeta()
const props = defineProps<{ task: Task; readonly?: boolean }>()
defineEmits<{ toggle: [done: boolean]; edit: []; remove: [] }>()

const isToday = () => dayjs(props.task.dueDate).isSame(dayjs(), 'day')
const host = () => {
  try {
    return new URL(props.task.url).host
  } catch {
    return props.task.url
  }
}
</script>

<template>
  <div class="group p-space-md bg-white hover:bg-accent/25 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
    <div class="flex items-center gap-space-md min-w-0">
      <CheckboxRoot
        :model-value="task.done"
        @update:model-value="$emit('toggle', $event === true)"
        @click.stop
        class="w-5 h-5 shrink-0 border-2 border-ink bg-white flex items-center justify-center hover:bg-accent transition-colors data-[state=checked]:bg-primary cursor-pointer"
      >
        <CheckboxIndicator>
          <Check :size="14" class="text-on-primary" :stroke-width="3" />
        </CheckboxIndicator>
      </CheckboxRoot>
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-2">
          <span :class="cn('font-headline-sm text-body-lg font-medium text-on-surface truncate', task.done && 'line-through text-on-surface-variant')">
            {{ task.title }}
          </span>
          <Chip :tone="toneOf(task.category)">{{ task.category }}</Chip>
        </div>
        <span class="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">{{ task.description }}</span>
      </div>
    </div>
    <div class="flex items-center gap-space-sm shrink-0 flex-wrap">
      <a
        v-if="task.url"
        :href="task.url"
        target="_blank"
        rel="noopener"
        @click.stop
        class="inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-ink bg-white text-on-surface hover:bg-accent transition-colors font-label-sm text-label-sm max-w-[10rem]"
      >
        <Link2 :size="12" />
        <span class="truncate">{{ host() }}</span>
      </a>
      <span :class="cn('inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-ink font-label-sm text-label-sm',
        isToday() && !task.done ? 'bg-tertiary-container text-ink font-bold' : 'bg-surface-container text-on-surface')">
        <CalendarDays :size="12" />{{ isToday() && !task.done ? 'Jatuh Tempo Hari Ini' : fmtDate(task.dueDate) }}
      </span>
      <WaChip :h3="task.remindH3" :h1="task.remindH1" />
      <button
        v-if="!readonly"
        type="button"
        title="Ubah"
        class="p-1 border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all hover:bg-accent hover:border-ink text-on-surface cursor-pointer"
        @click.stop="$emit('edit')"
      >
        <Pencil :size="18" />
      </button>
      <button
        v-if="!readonly"
        type="button"
        title="Hapus"
        class="p-1 border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white hover:border-ink text-on-surface cursor-pointer"
        @click.stop="$emit('remove')"
      >
        <Trash2 :size="18" />
      </button>
    </div>
  </div>
</template>