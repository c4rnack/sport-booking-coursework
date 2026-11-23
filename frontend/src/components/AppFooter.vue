<script setup lang="ts">
import { Flame } from 'lucide-vue-next';
</script>

<template>
  <footer class="border-t border-zinc-800/80 bg-zinc-900/50 mt-14">
    <div class="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
      <div class="flex items-center gap-2.5">
        <span class="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-orange-500 text-white">
          <Flame class="w-4 h-4" />
        </span>
        <span class="font-bold tracking-wider text-zinc-200">PULSAR</span>
        <span class="text-zinc-600">•</span>
        <span>Мережа сучасних спортивних центрів</span>
      </div>

      <div class="flex items-center gap-6 text-xs">
        <router-link to="/" class="hover:text-orange-400 transition">Головна</router-link>
        <router-link to="/catalog" class="hover:text-orange-400 transition">Каталог послуг</router-link>
        <router-link to="/profile" class="hover:text-purple-400 transition">Особистий кабінет</router-link>
      </div>

      <p class="text-xs text-zinc-500">© 2026 PULSAR Sport Network</p>
    </div>
  </footer>
</template>