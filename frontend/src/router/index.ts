import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'ringkasan', component: () => import('@/views/OverviewView.vue') },
    { path: '/tugas', name: 'tugas', component: () => import('@/views/TasksView.vue') },
    { path: '/keuangan', name: 'keuangan', component: () => import('@/views/FinanceView.vue') },
  ],
})
