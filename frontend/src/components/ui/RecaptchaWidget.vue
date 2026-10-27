<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Check } from 'lucide-vue-next'

// reCAPTCHA v2 ("Saya bukan robot"). Site key dibaca dari VITE_RECAPTCHA_SITE_KEY (kunci publik, aman di frontend).
// Secret key TIDAK boleh ada di sini: hanya dipakai backend untuk memverifikasi token.
interface Grecaptcha {
  ready(cb: () => void): void
  render(el: HTMLElement, opts: Record<string, unknown>): number
  reset(id?: number): void
}
declare global { interface Window { grecaptcha?: Grecaptcha } }

const emit = defineEmits<{ verify: [token: string]; expire: [] }>()
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const box = ref<HTMLElement>()
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorText = ref('')
const mockChecked = ref(false)
let widgetId: number | undefined

let loader: Promise<void> | null = null
function loadScript() {
  if (window.grecaptcha?.render) return Promise.resolve()
  loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=id'
    s.async = true
    s.onload = () => window.grecaptcha!.ready(resolve)
    s.onerror = () => { loader = null; reject(new Error('gagal memuat')) }
    document.head.appendChild(s)
  })
  return loader
}

onMounted(async () => {
  if (!siteKey) {
    if (useMock) { status.value = 'ready'; return } // mode mock: kotak centang palsu
    status.value = 'error'; errorText.value = 'reCAPTCHA belum dikonfigurasi (VITE_RECAPTCHA_SITE_KEY kosong).'; return
  }
  try {
    await loadScript()
    if (!box.value) return
    widgetId = window.grecaptcha!.render(box.value, {
      sitekey: siteKey, theme: 'light',
      // layar sempit -> versi ringkas supaya tidak terpotong
      size: box.value.parentElement && box.value.parentElement.clientWidth < 330 ? 'compact' : 'normal',
      callback: (t: string) => emit('verify', t),
      'expired-callback': () => emit('expire'),
      'error-callback': () => { emit('expire'); errorText.value = 'reCAPTCHA bermasalah, muat ulang halaman.'; status.value = 'error' },
    })
    status.value = 'ready'
  } catch {
    status.value = 'error'; errorText.value = 'Tidak dapat memuat reCAPTCHA. Periksa koneksi internet Anda.'
  }
})
onBeforeUnmount(() => { widgetId = undefined })

// Token reCAPTCHA hanya berlaku sekali -> panggil reset() setelah setiap percobaan kirim yang gagal
function reset() {
  mockChecked.value = false
  if (widgetId !== undefined) window.grecaptcha?.reset(widgetId)
  emit('expire')
}
function toggleMock() {
  mockChecked.value = !mockChecked.value
  if (mockChecked.value) emit('verify', 'mock-recaptcha-token'); else emit('expire')
}
defineExpose({ reset })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="border-2 border-ink bg-white p-2 shadow-hard-sm overflow-x-auto min-h-[90px] flex items-center">
      <div v-if="status === 'loading'" class="font-body-sm text-body-sm text-on-surface-variant animate-pulse">Memuat reCAPTCHA...</div>
      <p v-else-if="status === 'error'" class="font-body-sm text-body-sm text-error font-medium">{{ errorText }}</p>
      <button
        v-else-if="!siteKey" type="button" role="checkbox" :aria-checked="mockChecked" @click="toggleMock"
        class="flex items-center gap-3 font-body-md text-body-md text-on-surface"
      >
        <span :class="['w-6 h-6 border-2 border-ink flex items-center justify-center transition-colors', mockChecked ? 'bg-primary text-white' : 'bg-white']">
          <Check v-if="mockChecked" :size="16" :stroke-width="3" />
        </span>
        Saya bukan robot <span class="font-label-sm text-label-sm text-outline">(mode mock)</span>
      </button>
      <div ref="box" :class="{ hidden: status !== 'ready' || !siteKey }" />
    </div>
  </div>
</template>
