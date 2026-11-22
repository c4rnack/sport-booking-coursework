import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, setAuthToken } from '../api/api';
import type { NotificationRecord, UserProfile } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'));
  const user = ref<UserProfile | null>(null);
  const notifications = ref<NotificationRecord[]>([]);

  const isAuthenticated = computed(() => Boolean(token.value));
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length);

  async function fetchNotifications() {
    if (!token.value) return;
    try {
      const { data } = await api.get<NotificationRecord[]>('/user/me/notifications');
      notifications.value = data;
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  async function fetchProfile() {
    if (!token.value) return;
    try {
      const { data } = await api.get<UserProfile>('/user/me');
      if (data && data.id) {
        user.value = data;
      }
    } catch (err: any) {
      console.error('GET /user/me error:', err?.response?.status, err?.response?.data || err);
      if (err?.response?.status === 401) {
        logout();
        return;
      }
    }
    await fetchNotifications();
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data?.accessToken) {
      throw new Error('Сервер не повернув токен авторизації');
    }

    token.value = data.accessToken;
    user.value = data.user;
    localStorage.setItem('accessToken', data.accessToken);
    setAuthToken(data.accessToken);

    await fetchProfile();
  }

  async function register(payload: { fullName: string; email: string; password: string; phone?: string }) {
    const { data } = await api.post('/auth/register', payload);
    if (!data?.accessToken) {
      throw new Error('Сервер не повернув токен авторизації');
    }

    token.value = data.accessToken;
    user.value = data.user;
    localStorage.setItem('accessToken', data.accessToken);
    setAuthToken(data.accessToken);

    await fetchProfile();
  }

  async function markNotificationRead(id: string) {
    await api.patch(`/user/me/notifications/${id}/read`);
    const item = notifications.value.find((n) => n.id === id);
    if (item) item.isRead = true;
  }

  function logout() {
    token.value = null;
    user.value = null;
    notifications.value = [];
    localStorage.removeItem('accessToken');
    setAuthToken(null);
  }

  return {
    token,
    user,
    notifications,
    isAuthenticated,
    isAdmin,
    unreadCount,
    fetchProfile,
    fetchNotifications,
    login,
    register,
    markNotificationRead,
    logout,
  };
});