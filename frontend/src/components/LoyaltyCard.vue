<script setup lang="ts">
import { computed } from 'vue';
import { Award, User } from 'lucide-vue-next';
import { resolveAvatarUrl } from '../api/api';
import type { UserProfile } from '../types';

const props = defineProps<{
  user: UserProfile | null;
}>();

const PREMIUM_GOAL = 300;
const avatarSrc = computed(() => resolveAvatarUrl(props.user?.avatarUrl));
const progressPct = computed(() => {
  const pts = props.user?.bonusPoints ?? 0;
  return Math.min(100, Math.round((pts / PREMIUM_GOAL) * 100));
});
</script>

<template>
  <div class="space-y-3">
    <div class="bg-gradient-to-br from-purple-800 via-purple-900 to-zinc-900 border border-purple-500/30 text-white p-5 rounded-2xl shadow-lg shadow-purple-950/40">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            alt="Profile photo"
            class="w-12 h-12 rounded-full object-cover border-2 border-orange-400 shrink-0"
          />
          <div
            v-else
            class="w-12 h-12 rounded-full bg-zinc-900/70 border border-purple-400/40 flex items-center justify-center shrink-0"
          >
            <User class="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <span class="text-[11px] uppercase tracking-wider text-purple-200 block">Картка лояльності</span>
            <h2 class="text-xl font-bold text-orange-300 leading-tight">{{ user?.loyaltyTier || '—' }}</h2>
          </div>
        </div>
        <Award class="w-6 h-6 text-orange-400 shrink-0" />
      </div>

      <p class="text-sm text-purple-100 mt-3">{{ user?.fullName }}</p>

      <div class="mt-4 pt-3 border-t border-white/15 flex justify-between items-end">
        <div>
          <span class="text-xs text-purple-200 block">Бонуси (1 бал = 1 грн)</span>
          <span class="text-xl font-bold text-orange-400">{{ user?.bonusPoints ?? 0 }} балів</span>
        </div>
        <span
          v-if="user?.loyaltyBenefits?.freePoolAccess"
          class="text-[11px] px-2 py-1 rounded bg-orange-500/20 text-orange-200 border border-orange-400/30"
        >
          Басейн 0 грн
        </span>
      </div>

      <div v-if="user?.loyaltyTier === 'STANDARD'" class="mt-4">
        <div class="flex justify-between text-[11px] text-purple-200 mb-1">
          <span>До статусу PREMIUM</span>
          <span>{{ user.bonusPoints }} / {{ PREMIUM_GOAL }} б.</span>
        </div>
        <div class="w-full h-2 bg-zinc-950/60 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-purple-400 to-orange-400 transition-all duration-300"
            :style="{ width: `${progressPct}%` }"
          />
        </div>
      </div>
    </div>

    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs space-y-2 text-zinc-400">
      <p class="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">Умови системи лояльності</p>
      <p><b class="text-zinc-200">STANDARD:</b> кешбек 5% балами з кожного бронювання.</p>
      <p><b class="text-purple-300">PREMIUM (від 300 балів):</b> знижка -15%, кешбек 10%, безкоштовний басейн на плаванні.</p>
      <p><b class="text-orange-300">CORPORATE (корп. абонемент):</b> знижка -20%, кешбек 7%.</p>
      <p class="pt-1.5 border-t border-zinc-800 text-zinc-300">
        <b>Бонуси</b> списуються при бронюванні: <b>1 бал = 1 грн</b> (до 50% від вартості).
      </p>
    </div>
  </div>
</template>