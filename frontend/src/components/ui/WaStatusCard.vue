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
  <!-- Kartu hitam seperti blok "SEKALI BAYAR": label hijau limau, bayangan biru -->
  <div class="bg-primary text-white border-2 border-ink p-space-lg shadow-hard flex flex-col gap-space-md transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-accent text-ink border-2 border-ink flex items-center justify-center"><MessageCircle :size="18" /></div>
        <div class="flex flex-col">
          <span class="font-headline-sm text-body-md font-bold text-white">WA Bot Reminder</span>
          <span class="font-label-sm text-label-sm text-accent font-bold uppercase tracking-widest">WhatsApp Cron Active</span>
        </div>
      </div>
      <span class="flex h-2.5 w-2.5 relative">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
      </span>
    </div>
    <p class="font-body-sm text-body-sm text-white/90 leading-relaxed">
      Sistem otomatis mengirim reminder via WhatsApp pada <strong class="text-white font-bold">H-3</strong> dan
      <strong class="text-white font-bold">H-1</strong> sebelum jatuh tempo pukul 08.00 WIB.
    </p>
    <div class="p-space-sm border-2 border-white/40 flex items-center justify-between text-white">
      <div class="flex items-center gap-2 font-label-sm text-label-sm">
        <BadgeCheck :size="16" class="text-accent" />
        <span>Target: {{ data ? maskWa(data.waNumber) : '...' }}</span>
      </div>
      <button type="button" class="font-label-sm text-label-sm font-bold uppercase tracking-wider text-accent hover:underline" @click="open = true">Ganti</button>
    </div>
    <WaNumberDialog v-model:open="open" :current="data?.waNumber ?? ''" />
  </div>
</template>
