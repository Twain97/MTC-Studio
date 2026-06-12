import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from './services/auth.js'
import HomeView from './views/HomeView.vue'
import PortfolioView from './views/PortfolioView.vue'
import EventView from './views/EventView.vue'
import AboutView from './views/AboutView.vue'
import ContactView from './views/ContactView.vue'
import AdminLoginView from './views/admin/AdminLoginView.vue'
import AdminLayout from './components/admin/AdminLayout.vue'
import DashboardView from './views/admin/DashboardView.vue'
import MessagesView from './views/admin/MessagesView.vue'
import UploadView from './views/admin/UploadView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/portfolio', name: 'portfolio', component: PortfolioView },
    { path: '/portfolio/:id', name: 'event', component: EventView, props: true },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/contact', name: 'contact', component: ContactView },
    { path: '/admin/login', name: 'admin-login', component: AdminLoginView, meta: { adminLayout: true } },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, adminLayout: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: DashboardView },
        { path: 'messages', name: 'admin-messages', component: MessagesView },
        { path: 'upload', name: 'admin-upload', component: UploadView }
      ]
    }
  ]
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'admin-login' && isAuthenticated()) return { name: 'admin-dashboard' }
})

export default router

