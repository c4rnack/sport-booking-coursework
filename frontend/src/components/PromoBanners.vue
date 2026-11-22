<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
import type { Promotion } from '../types';

defineProps<{
  promotions: Promotion[];
}>();
</script>

<template>
  <div v-if="promotions.length" class="grid md:grid-cols-2 gap-4">
    <div
      v-for="promo in promotions"
      :key="promo.id"
      class="p-5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-orange-500 text-white flex items-start justify-between shadow-lg shadow-purple-950/40"
    >
      <div>
        <div class="flex items-center gap-1.5 text-xs uppercase tracking-wider text-orange-100 font-semibold">
          <Sparkles class="w-4 h-4" />
          <span>Акційна пропозиція</span>
        </div>
        <h3 class="font-bold text-lg mt-1">{{ promo.title }}</h3>
        <p class="text-sm text-purple-100 mt-0.5">{{ promo.description }}</p>
      </div>
      <span class="px-3 py-1 rounded-full bg-zinc-950/30 border border-white/20 font-bold text-sm shrink-0">
        -{{ promo.discountPercent }}%
      </span>
    </div>
  </div>
</template>