<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Dumbbell, LogOut, ShieldCheck, User } from 'lucide-vue-next';
import { resolveAvatarUrl } from '../api/api';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const router = useRouter();

const avatarSrc = computed(() => resolveAvatarUrl(auth.user?.avatarUrl));

function handleLogout() {
  auth.logout();
  router.push('/');
}
</script>

<template>
  <header class="bg-zinc-900/90 backdrop-blur border-b border-zinc-800 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-2.5 font-bold text-lg">
        <span class="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-orange-500 text-white shadow-lg shadow-purple-900/30">
          <Dumbbell class="w-5 h-5" />
        </span>
        <span class="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
          SportHub Booking
        </span>
      </router-link>

      <nav class="flex items-center gap-4 text-sm font-medium">
        <router-link
          to="/"
          class="text-zinc-300 hover:text-orange-400 transition"
          active-class="!text-orange-400"
        >
          Каталог
        </router-link>

        <template v-if="auth.isAuthenticated">
          <router-link
            to="/profile"
            class="flex items-center gap-2 text-zinc-300 hover:text-purple-400 transition"
            active-class="!text-purple-400"
          >
            <img
              v-if="avatarSrc"
              :src="avatarSrc"
              alt="Avatar"
              class="w-7 h-7 rounded-full object-cover border border-orange-400/60"
            />
            <User v-else class="w-4 h-4" />
            <span>{{ auth.user?.fullName || 'Кабінет' }}</span>
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              {{ auth.user?.bonusPoints ?? 0 }} б.
            </span>
          </router-link>

          <router-link to="/profile?tab=notifications" class="relative p-1.5 text-zinc-400 hover:text-orange-400 transition">
            <Bell class="w-5 h-5" />
            <span
              v-if="auth.unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 bg-orange-500 text-zinc-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
            >
              {{ auth.unreadCount }}
            </span>
          </router-link>

          <router-link
            v-if="auth.isAdmin"
            to="/admin"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition"
          >
            <ShieldCheck class="w-4 h-4 text-orange-400" />
            <span>Адмін-панель</span>
          </router-link>

          <button @click="handleLogout" class="flex items-center gap-1 text-zinc-400 hover:text-orange-400 transition cursor-pointer">
            <LogOut class="w-4 h-4" />
            <span>Вийти</span>
          </button>
        </template>

        <router-link
          v-else
          to="/auth"
          class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold hover:opacity-90 transition shadow-md shadow-purple-950/50"
        >
          Увійти
        </router-link>
      </nav>
    </div>
  </header>
</template>