import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import 'vue-sonner/style.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { queryClient } from './lib/queryClient'
import { setUnauthorizedHandler } from './lib/api'
import { useAuthStore } from './stores/auth'

const app = createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, { queryClient })

// Token kedaluwarsa/ditolak server (401) -> hapus sesi dan kembali ke halaman masuk
setUnauthorizedHandler(() => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) return // sudah ditangani
  auth.clearSession()
  toast.error('Sesi berakhir, silakan masuk kembali.')
  router.replace({ path: '/masuk', query: { redirect: router.currentRoute.value.fullPath } })
})

app.mount('#app')
