import { ref, watch, type Ref } from 'vue'

/** Salinan ref yang nilainya baru berubah setelah pengguna berhenti mengetik. */
export function useDebounced<T>(source: Ref<T>, ms = 300) {
  const out = ref(source.value) as Ref<T>
  let t: ReturnType<typeof setTimeout>
  watch(source, (v) => { clearTimeout(t); t = setTimeout(() => (out.value = v), ms) })
  return out
}
