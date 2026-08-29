import { createRouter, createWebHistory } from '@ionic/vue-router'
import TabsShell from '@/views/TabsShell.vue'

const routes = [
  { path: '/', redirect: '/resumen' },
  {
    path: '/',
    component: TabsShell,
    children: [
      { path: '', redirect: '/resumen' },
      { path: 'resumen', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'movimientos', name: 'transactions', component: () => import('@/views/TransactionsView.vue') },
      { path: 'analisis', name: 'stats', component: () => import('@/views/StatsView.vue') },
      { path: 'ajustes', name: 'settings', component: () => import('@/views/SettingsView.vue') }
    ]
  },
  { path: '/categorias', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/resumen' }
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
