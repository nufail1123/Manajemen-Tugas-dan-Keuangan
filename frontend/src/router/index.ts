import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta { guest?: boolean; requiresAuth?: boolean }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'ringkasan', component: () => import('@/views/OverviewView.vue'), meta: { requiresAuth: true } },
    { path: '/tugas', name: 'tugas', component: () => import('@/views/TasksView.vue'), meta: { requiresAuth: true } },
    { path: '/keuangan', name: 'keuangan', component: () => import('@/views/FinanceView.vue'), meta: { requiresAuth: true } },
    { path: '/masuk', name: 'masuk', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
    { path: '/daftar', name: 'daftar', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Penjaga rute: halaman aplikasi butuh login; halaman masuk/daftar hanya untuk yang belum login
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.guest) return auth.isLoggedIn && (await auth.loadUser()) ? '/' : true
  if (to.meta.requiresAuth && !(auth.isLoggedIn && (await auth.loadUser()))) {
    return { path: '/masuk', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } }
  }
  return true
})

export default router
