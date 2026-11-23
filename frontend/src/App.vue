<script setup lang="ts">
import { onMounted } from 'vue';
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import { useAuthStore } from './store/auth';

const auth = useAuthStore();

onMounted(() => {
  if (auth.token && !auth.user) {
    auth.fetchProfile();
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
    <AppHeader />
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>