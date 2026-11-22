import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import AdminView from '../views/AdminView.vue';
import AuthView from '../views/AuthView.vue';
import CatalogView from '../views/CatalogView.vue';
import ProfileView from '../views/ProfileView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'catalog', component: CatalogView },
    { path: '/auth', name: 'auth', component: AuthView },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.token && !auth.user) {
    await auth.fetchProfile();
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'auth' };
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'catalog' };
  }
});