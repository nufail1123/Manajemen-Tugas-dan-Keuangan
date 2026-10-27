<script setup lang="ts">
import { watch } from 'vue'
import { useCurrencyInput, CurrencyDisplay } from 'vue-currency-input'

const props = defineProps<{ modelValue?: number | null; placeholder?: string }>()
// useCurrencyInput otomatis meng-emit "update:modelValue" berisi angka murni (mis. 1500000)
const { inputRef, setValue } = useCurrencyInput({
  currency: 'IDR',
  locale: 'id-ID',
  currencyDisplay: CurrencyDisplay.hidden, // "Rp" kita tampilkan sendiri sebagai prefix
  precision: 0,
  hideGroupingSeparatorOnFocus: false,
})
watch(() => props.modelValue, (v) => setValue(v ?? null))
</script>

<template>
  <div class="relative">
    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant font-bold">Rp</span>
    <input
      ref="inputRef" inputmode="numeric" :placeholder="placeholder ?? '0'"
      class="w-full bg-white border-2 border-ink pl-11 pr-3 py-2.5 font-label-md text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:shadow-hard-sm focus:-translate-x-px focus:-translate-y-px transition-all"
    />
  </div>
</template>
