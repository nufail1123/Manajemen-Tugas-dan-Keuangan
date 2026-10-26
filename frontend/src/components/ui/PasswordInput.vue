<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { inputClass } from '@/lib/styles'

defineProps<{ placeholder?: string; autocomplete?: string }>()
const model = defineModel<string>({ default: '' })
const show = ref(false)
</script>

<template>
  <div class="relative">
    <input v-model="model" :type="show ? 'text' : 'password'" :placeholder="placeholder" :autocomplete="autocomplete" :class="[inputClass, 'pr-10']" />
    <button type="button" tabindex="-1" :title="show ? 'Sembunyikan' : 'Tampilkan'"
      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" @click="show = !show">
      <component :is="show ? EyeOff : Eye" :size="18" />
    </button>
  </div>
</template>
