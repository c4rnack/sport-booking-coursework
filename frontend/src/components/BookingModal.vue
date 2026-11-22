<script setup lang="ts">
import { computed, ref } from 'vue';
import { CheckCircle2, X } from 'lucide-vue-next';
import { api } from '../api/api';
import { useAuthStore } from '../store/auth';
import type { AddonType, ScheduleSlot, SportSection } from '../types';

const props = defineProps<{
  section: SportSection;
}>();

const emit = defineEmits<{
  close: [];
  booked: [];
}>();

const auth = useAuthStore();

const selectedSlotId = ref<string>(props.section.slots[0]?.id || '');
const selectedAddons = ref<AddonType[]>([]);
const useBonusPoints = ref(false);
const bookingResult = ref<any>(null);
const bookingError = ref('');
const bookingLoading = ref(false);

const isSwimming = computed(() => props.section.sportType.toLowerCase() === 'swimming');

function toggleAddon(addon: AddonType) {
  const idx = selectedAddons.value.indexOf(addon);
  if (idx >= 0) selectedAddons.value.splice(idx, 1);
  else selectedAddons.value.push(addon);
}

const estimatedPrice = computed(() => {
  const tier = auth.user?.loyaltyTier || 'STANDARD';
  const freePool = tier === 'PREMIUM';

  let raw = props.section.basePrice;
  if (selectedAddons.value.includes('equipment')) raw += 120;
  if (isSwimming.value && selectedAddons.value.includes('pool') && !freePool) raw += 180;
  if (selectedAddons.value.includes('trainer')) raw += 350;

  const discountPct = tier === 'CORPORATE' ? 20 : tier === 'PREMIUM' ? 15 : 0;
  const afterTier = Number((raw * (1 - discountPct / 100)).toFixed(2));

  const availablePoints = auth.user?.bonusPoints ?? 0;
  const maxRedeemable = Math.floor(afterTier * 0.5);
  const bonusDiscount = useBonusPoints.value ? Math.min(availablePoints, maxRedeemable) : 0;
  const final = Number((afterTier - bonusDiscount).toFixed(2));

  return { raw, discountPct, afterTier, bonusDiscount, maxRedeemable, final, freePool };
});

async function confirmBooking() {
  if (!selectedSlotId.value) return;
  bookingLoading.value = true;
  bookingError.value = '';
  try {
    const addonsToSend = isSwimming.value
      ? selectedAddons.value
      : selectedAddons.value.filter((a) => a !== 'pool');

    const { data } = await api.post('/bookings', {
      slotId: selectedSlotId.value,
      addons: addonsToSend,
      useBonusPoints: useBonusPoints.value,
    });
    bookingResult.value = data;
    await auth.fetchProfile();
    emit('booked');
  } catch (err: any) {
    bookingError.value = err.response?.data?.message || 'Не вдалося оформити бронювання';
  } finally {
    bookingLoading.value = false;
  }
}

function formatSlot(slot: ScheduleSlot) {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  return `${start.toLocaleDateString('uk-UA')} • ${start.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
}
</script>

<template>
  <div class="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
      <button @click="emit('close')" class="absolute top-4 right-4 text-zinc-500 hover:text-orange-400 cursor-pointer">
        <X class="w-5 h-5" />
      </button>

      <template v-if="!bookingResult">
        <h2 class="text-xl font-bold text-zinc-100">{{ section.title }}</h2>
        <p class="text-sm text-zinc-400 mb-4">{{ section.facility.name }}</p>

        <div class="mb-4">
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Оберіть дату та час</label>
          <select v-model="selectedSlotId" class="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:border-purple-500 focus:outline-none">
            <option v-for="slot in section.slots" :key="slot.id" :value="slot.id">
              {{ formatSlot(slot) }} (вільно місць: {{ slot.availableSpots }})
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Додаткові послуги</label>
          <div class="space-y-2">
            <label class="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-purple-500/50 transition">
              <span class="flex items-center gap-2.5 text-sm text-zinc-200">
                <input type="checkbox" class="accent-orange-500" :checked="selectedAddons.includes('equipment')" @change="toggleAddon('equipment')" />
                Оренда спортивного інвентарю
              </span>
              <span class="text-sm font-semibold text-orange-400">+120 грн</span>
            </label>

            <label
              v-if="isSwimming"
              class="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-purple-500/50 transition"
            >
              <span class="flex items-center gap-2.5 text-sm text-zinc-200">
                <input type="checkbox" class="accent-orange-500" :checked="selectedAddons.includes('pool')" @change="toggleAddon('pool')" />
                Доступ до басейну
              </span>
              <span class="text-sm font-semibold" :class="estimatedPrice.freePool ? 'text-purple-400' : 'text-orange-400'">
                {{ estimatedPrice.freePool ? '0 грн (Premium)' : '+180 грн' }}
              </span>
            </label>

            <label class="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-purple-500/50 transition">
              <span class="flex items-center gap-2.5 text-sm text-zinc-200">
                <input type="checkbox" class="accent-orange-500" :checked="selectedAddons.includes('trainer')" @change="toggleAddon('trainer')" />
                Персональний супровід тренера
              </span>
              <span class="text-sm font-semibold text-orange-400">+350 грн</span>
            </label>
          </div>
        </div>

        <label
          v-if="(auth.user?.bonusPoints ?? 0) > 0"
          class="flex items-center justify-between p-3 mb-4 bg-purple-950/30 border border-purple-500/30 rounded-xl cursor-pointer hover:border-orange-500/50 transition"
        >
          <span class="flex items-center gap-2.5 text-sm text-purple-200">
            <input type="checkbox" v-model="useBonusPoints" class="accent-orange-500" />
            Списати бонуси (баланс: {{ auth.user?.bonusPoints }} б., до 50%)
          </span>
          <span class="text-sm font-semibold text-orange-400">
            -{{ Math.min(auth.user?.bonusPoints ?? 0, estimatedPrice.maxRedeemable) }} грн
          </span>
        </label>

        <div class="bg-zinc-950 border border-zinc-800 p-4 rounded-xl mb-4 space-y-1.5 text-sm">
          <div class="flex justify-between text-zinc-400">
            <span>Сума без знижки:</span>
            <span>{{ estimatedPrice.raw }} грн</span>
          </div>
          <div class="flex justify-between text-purple-400">
            <span>Картка лояльності ({{ auth.user?.loyaltyTier }}):</span>
            <span>-{{ estimatedPrice.discountPct }}%</span>
          </div>
          <div v-if="estimatedPrice.bonusDiscount > 0" class="flex justify-between text-orange-400">
            <span>Списано бонусів:</span>
            <span>-{{ estimatedPrice.bonusDiscount }} грн</span>
          </div>
          <div class="flex justify-between font-bold text-base pt-2 border-t border-zinc-800">
            <span class="text-zinc-200">До сплати:</span>
            <span class="text-orange-400">{{ estimatedPrice.final }} грн</span>
          </div>
        </div>

        <p v-if="bookingError" class="text-sm text-orange-400 mb-3">{{ bookingError }}</p>

        <button
          @click="confirmBooking"
          :disabled="bookingLoading"
          class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
        >
          {{ bookingLoading ? 'Обробка оплати...' : 'Оплатити та підтвердити бронювання' }}
        </button>
      </template>

      <div v-else class="text-center py-4 space-y-3">
        <CheckCircle2 class="w-12 h-12 text-orange-400 mx-auto" />
        <h3 class="text-xl font-bold text-zinc-100">Бронювання підтверджено!</h3>
        <p class="text-sm text-zinc-400">{{ bookingResult.breakdown.description }}</p>
        <div class="bg-purple-500/15 border border-purple-500/30 text-purple-200 p-3 rounded-xl text-sm space-y-1">
          <p>
            Оплачено: <b class="text-orange-300">{{ bookingResult.breakdown.finalPrice }} грн</b>
            <span v-if="bookingResult.breakdown.bonusPointsUsed > 0">
              (списано {{ bookingResult.breakdown.bonusPointsUsed }} б.)
            </span>
          </p>
          <p>
            Нараховано кешбеку: <b class="text-orange-300">+{{ bookingResult.breakdown.earnedPoints }} бонусних балів</b>
          </p>
        </div>
        <button
          @click="emit('close')"
          class="mt-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Готово
        </button>
      </div>
    </div>
  </div>
</template>