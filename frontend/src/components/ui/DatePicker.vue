<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent,
  CalendarRoot, CalendarHeader, CalendarHeading, CalendarPrev, CalendarNext, CalendarGrid,
  CalendarGridHead, CalendarGridBody, CalendarGridRow, CalendarHeadCell, CalendarCell, CalendarCellTrigger,
} from 'reka-ui'
import { parseDate, type DateValue } from '@internationalized/date'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import dayjs from 'dayjs'

defineProps<{ placeholder?: string }>()
// Nilai disimpan sebagai string 'YYYY-MM-DD' supaya mudah dikirim ke backend Go
const model = defineModel<string>({ default: '' })
const open = ref(false)

const value = computed<DateValue | undefined>({
  get: () => (model.value ? parseDate(model.value.slice(0, 10)) : undefined),
  set: (v) => { model.value = v ? v.toString() : ''; open.value = false },
})
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      class="inline-flex w-full items-center gap-2 border-2 border-ink bg-white px-3 py-2.5 font-body-md text-body-md hover:bg-accent/40 hover:shadow-hard-sm transition-all focus:outline-none focus:shadow-hard-sm"
    >
      <CalendarDays :size="16" class="text-primary shrink-0" />
      <span :class="model ? 'text-on-surface' : 'text-outline'">
        {{ model ? dayjs(model).format('DD MMMM YYYY') : placeholder ?? 'Pilih tanggal' }}
      </span>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent :side-offset="6" align="start" class="z-[70] border-2 border-ink bg-white p-3 shadow-hard focus:outline-none data-[state=open]:animate-pop">
        <CalendarRoot v-slot="{ weekDays, grid }" v-model="value" locale="id-ID" weekday-format="short" fixed-weeks>
          <CalendarHeader class="flex items-center justify-between pb-2">
            <CalendarPrev class="p-1 border-2 border-transparent hover:border-ink hover:bg-accent text-on-surface"><ChevronLeft :size="16" /></CalendarPrev>
            <CalendarHeading class="font-body-md text-body-md font-bold uppercase tracking-wider text-on-surface" />
            <CalendarNext class="p-1 border-2 border-transparent hover:border-ink hover:bg-accent text-on-surface"><ChevronRight :size="16" /></CalendarNext>
          </CalendarHeader>
          <CalendarGrid v-for="month in grid" :key="month.value.toString()">
            <CalendarGridHead>
              <CalendarGridRow class="grid grid-cols-7">
                <CalendarHeadCell v-for="d in weekDays" :key="d" class="w-9 text-center font-label-sm text-label-sm text-outline">{{ d }}</CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
              <CalendarGridRow v-for="(week, i) in month.rows" :key="i" class="grid grid-cols-7">
                <CalendarCell v-for="day in week" :key="day.toString()" :date="day" class="p-0.5">
                  <CalendarCellTrigger
                    :day="day" :month="month.value"
                    class="flex h-8 w-8 items-center justify-center border-2 border-transparent font-body-sm text-body-sm text-on-surface hover:bg-accent hover:border-ink data-[outside-view]:text-outline/50 data-[today]:text-primary data-[today]:font-bold data-[selected]:bg-primary data-[selected]:text-on-primary data-[selected]:border-ink data-[disabled]:opacity-40"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
