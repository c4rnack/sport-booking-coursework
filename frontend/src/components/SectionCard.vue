<script setup lang="ts">
import { computed } from 'vue';
import { Calendar, MapPin, Star, UserCheck } from 'lucide-vue-next';
import type { SportSection } from '../types';

const props = defineProps<{
  section: SportSection;
}>();

const emit = defineEmits<{
  book: [section: SportSection];
}>();

const totalAvailableSpots = computed(() =>
  props.section.slots.reduce((sum, s) => sum + s.availableSpots, 0),
);
</script>

<template>
  <div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 flex flex-col justify-between hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-950/30 transition">
    <div>
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase">
          {{ section.sportType }}
        </span>
        <span class="text-xs text-zinc-400">{{ section.skillLevel }} • {{ section.ageCategory }}</span>
      </div>

      <h2 class="text-lg font-bold text-zinc-100">{{ section.title }}</h2>

      <div class="mt-3 space-y-2 text-sm text-zinc-400">
        <p class="flex items-center gap-1.5">
          <MapPin class="w-4 h-4 text-purple-400 shrink-0" />
          <span>{{ section.facility.name }} ({{ section.facility.address }})</span>
        </p>
        <p class="flex items-center gap-1.5">
          <UserCheck class="w-4 h-4 text-purple-400 shrink-0" />
          <span>Тренер: {{ section.trainer.fullName }}</span>
          <span class="inline-flex items-center gap-0.5 text-orange-400 font-semibold ml-1">
            <Star class="w-3.5 h-3.5 fill-current" /> {{ section.trainer.rating }}
          </span>
        </p>
        <p class="flex items-center gap-1.5">
          <Calendar class="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            Слотів: <b class="text-zinc-200">{{ section.slots.length }}</b> •
            Вільних місць: <b class="text-orange-400">{{ totalAvailableSpots }}</b>
          </span>
        </p>
      </div>
    </div>

    <div class="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
      <div>
        <span class="text-xs text-zinc-500 block">Базова ціна</span>
        <span class="text-xl font-bold text-orange-400">{{ section.basePrice }} грн</span>
      </div>
      <button
        @click="emit('book', section)"
        :disabled="totalAvailableSpots === 0"
        class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white text-sm font-semibold hover:opacity-90 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 transition cursor-pointer"
      >
        {{ totalAvailableSpots > 0 ? 'Забронювати' : 'Місць немає' }}
      </button>
    </div>
  </div>
</template>