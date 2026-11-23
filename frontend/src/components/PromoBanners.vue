<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
import type { Promotion } from '../types';

defineProps<{
  promotions: Promotion[];
}>();
</script>

<template>
  <div v-if="promotions.length" class="flex flex-wrap items-center gap-2.5">
    <span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-1">
      <Sparkles class="w-3.5 h-3.5 text-orange-400" />
      Акції:
    </span>

    <div
      v-for="promo in promotions"
      :key="promo.id"
      :title="promo.description"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-purple-500/30 hover:border-orange-500/50 transition text-xs"
    >
      <span class="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold text-[11px]">
        -{{ promo.discountPercent }}%
      </span>
      <span class="font-medium text-zinc-200">{{ promo.title }}</span>
    </div>
  </div>
</template>