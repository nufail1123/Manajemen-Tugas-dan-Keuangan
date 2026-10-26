<script setup lang="ts">
import { ref } from 'vue'
import { BadgeCheck, MessageCircle } from 'lucide-vue-next'
import { useWaSettings } from '@/queries'
import { maskWa } from '@/lib/utils'
import WaNumberDialog from '@/components/finance/WaNumberDialog.vue'

// Dipakai di halaman Tugas DAN Keuangan -> satu komponen, satu tampilan
const { data } = useWaSettings()
const open = ref(false)
</script>

<template>
  <div class="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center"><MessageCircle :size="18" /></div>
        <div class="flex flex-col">
          <span class="font-headline-sm text-body-md font-semibold text-on-surface">WA Bot Reminder</span>
          <span class="font-label-sm text-label-sm text-secondary font-medium">WhatsApp Cron Active</span>
        </div>
      </div>
      <span class="flex h-2.5 w-2.5 relative">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
      </span>
    </div>
    <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
      Sistem otomatis mengirim reminder via WhatsApp pada <strong class="text-on-surface font-semibold">H-3</strong> dan
      <strong class="text-on-surface font-semibold">H-1</strong> sebelum jatuh tempo pukul 08.00 WIB.
    </p>
    <div class="p-space-sm rounded-lg bg-surface-container flex items-center justify-between text-on-surface">
      <div class="flex items-center gap-2 font-label-sm text-label-sm">
        <BadgeCheck :size="16" class="text-secondary" />
        <span>Target: {{ data ? maskWa(data.waNumber) : '...' }}</span>
      </div>
      <button type="button" class="font-label-sm text-label-sm text-primary hover:underline" @click="open = true">Ganti</button>
    </div>
    <WaNumberDialog v-model:open="open" :current="data?.waNumber ?? ''" />
  </div>
</template>
