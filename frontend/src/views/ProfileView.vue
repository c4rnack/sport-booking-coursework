<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Bell, Check, CreditCard, History, Sparkles, Upload, User } from 'lucide-vue-next';
import { api, resolveAvatarUrl } from '../api/api';
import LoyaltyCard from '../components/LoyaltyCard.vue';
import { useAuthStore } from '../store/auth';
import type { BookingRecord, MembershipRecord, MembershipType, Promotion } from '../types';

const auth = useAuthStore();
const route = useRoute();

const activeTab = ref<'bookings' | 'memberships' | 'profile' | 'notifications'>('bookings');
const bookings = ref<BookingRecord[]>([]);
const memberships = ref<MembershipRecord[]>([]);
const membershipPromo = ref<Promotion | null>(null);
const saveMessage = ref('');
const actionError = ref('');
const companyName = ref('');
const uploadingPhoto = ref(false);

const profileForm = reactive({
  fullName: '',
  phone: '',
  avatarUrl: '',
  preferencesText: '',
});

const membershipPlans = [
  {
    type: 'SINGLE' as MembershipType,
    name: 'Разовий пропуск',
    subtitle: '1 візит • діє 7 днів',
    basePrice: 400,
    highlight: false,
    perks: [
      'Безкоштовний вхід на 1 будь-яку секцію чи зал',
      'Оренда спортивного інвентарю включена (0 грн)',
      'Ідеально для пробного відвідування',
    ],
  },
  {
    type: 'MONTHLY' as MembershipType,
    name: 'Місячний безліміт',
    subtitle: 'Безліміт • діє 30 днів',
    basePrice: 2200,
    highlight: true,
    perks: [
      'Необмежений вхід до всіх залів та секцій мережі',
      'Безкоштовна оренда інвентарю на кожне заняття',
      'Безкоштовний доступ до басейну на плаванні',
    ],
  },
  {
    type: 'CORPORATE' as MembershipType,
    name: 'Корпоративний',
    subtitle: 'До 10 осіб • діє 90 днів',
    basePrice: 12000,
    highlight: false,
    perks: [
      'Усі привілеї безліміту (зали, секції, інвентар, басейн)',
      'Командний доступ для до 10 співробітників',
      'Автоматична картка CORPORATE (-20% на тренера)',
    ],
  },
];

function getPlanPrice(basePrice: number) {
  if (!membershipPromo.value) return basePrice;
  return Number((basePrice * (1 - membershipPromo.value.discountPercent / 100)).toFixed(2));
}

async function loadCabinet() {
  actionError.value = '';
  await auth.fetchProfile();

  if (auth.user) {
    profileForm.fullName = auth.user.fullName;
    profileForm.phone = auth.user.phone || '';
    profileForm.avatarUrl = auth.user.avatarUrl || '';
    profileForm.preferencesText = (auth.user.preferences || []).join(', ');
  }

  const [bRes, mRes, pRes] = await Promise.allSettled([
    api.get<BookingRecord[]>('/user/me/bookings'),
    api.get<MembershipRecord[]>('/user/me/memberships'),
    api.get<Promotion[]>('/catalog/promotions'),
  ]);

  if (bRes.status === 'fulfilled') bookings.value = bRes.value.data;
  if (mRes.status === 'fulfilled') memberships.value = mRes.value.data;
  if (pRes.status === 'fulfilled') {
    const memPromos = pRes.value.data
      .filter((p) => p.targetScope === 'MEMBERSHIPS')
      .sort((a, b) => b.discountPercent - a.discountPercent);
    membershipPromo.value = memPromos[0] ?? null;
  }
}

async function cancelBooking(id: string) {
  actionError.value = '';
  try {
    await api.patch(`/booking/${id}/cancel`);
    await loadCabinet();
  } catch (err: any) {
    actionError.value = err?.response?.data?.message || 'Помилка скасування бронювання';
  }
}

async function buyMembership(type: MembershipType) {
  actionError.value = '';
  try {
    await api.post('/booking/memberships', {
      type,
      companyName: type === 'CORPORATE' ? companyName.value || 'My Company' : undefined,
    });
    await loadCabinet();
  } catch (err: any) {
    actionError.value = err?.response?.data?.message || 'Помилка оформлення абонемента';
  }
}

async function cancelMembership(id: string) {
  actionError.value = '';
  try {
    await api.patch(`/booking/memberships/${id}/cancel`);
    await loadCabinet();
  } catch (err: any) {
    actionError.value = err?.response?.data?.message || 'Помилка скасування абонемента';
  }
}

async function upgradeMembership(id: string, targetType: MembershipType) {
  actionError.value = '';
  try {
    await api.patch(`/booking/memberships/${id}/upgrade`, {
      type: targetType,
      companyName: targetType === 'CORPORATE' ? companyName.value || 'My Company' : undefined,
    });
    await loadCabinet();
  } catch (err: any) {
    actionError.value = err?.response?.data?.message || 'Помилка підвищення тарифу';
  }
}

async function uploadPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  actionError.value = '';
  saveMessage.value = '';
  uploadingPhoto.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/user/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await loadCabinet();
    saveMessage.value = 'Фото профілю успішно завантажено!';
  } catch (err: any) {
    actionError.value = err?.response?.data?.message || 'Не вдалося завантажити фото';
  } finally {
    uploadingPhoto.value = false;
    input.value = '';
  }
}

async function saveProfile() {
  saveMessage.value = '';
  actionError.value = '';
  try {
    const preferences = profileForm.preferencesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await api.patch('/user/me', {
      fullName: profileForm.fullName,
      phone: profileForm.phone,
      avatarUrl: profileForm.avatarUrl,
      preferences,
    });
    await auth.fetchProfile();
    saveMessage.value = 'Профіль успішно оновлено!';
  } catch (err: any) {
    actionError.value = err?.response?.data?.message || 'Помилка збереження профілю';
  }
}

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'notifications' || tab === 'memberships' || tab === 'profile' || tab === 'bookings') {
      activeTab.value = tab;
    }
  },
  { immediate: true },
);

onMounted(loadCabinet);
</script>

<template>
  <div class="grid lg:grid-cols-4 gap-6">
    <div class="lg:col-span-1 space-y-4">
      <LoyaltyCard :user="auth.user" />

      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-2 space-y-1">
        <button @click="activeTab = 'bookings'" :class="activeTab === 'bookings' ? 'bg-purple-600/25 text-orange-300 font-semibold border border-purple-500/30' : 'text-zinc-300 hover:bg-zinc-800'" class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition cursor-pointer">
          <History class="w-4 h-4" /> Історія бронювань
        </button>
        <button @click="activeTab = 'memberships'" :class="activeTab === 'memberships' ? 'bg-purple-600/25 text-orange-300 font-semibold border border-purple-500/30' : 'text-zinc-300 hover:bg-zinc-800'" class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition cursor-pointer">
          <CreditCard class="w-4 h-4" /> Абонементи
        </button>
        <button @click="activeTab = 'notifications'" :class="activeTab === 'notifications' ? 'bg-purple-600/25 text-orange-300 font-semibold border border-purple-500/30' : 'text-zinc-300 hover:bg-zinc-800'" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition cursor-pointer">
          <span class="flex items-center gap-2"><Bell class="w-4 h-4" /> Сповіщення</span>
          <span v-if="auth.unreadCount" class="px-2 py-0.5 text-xs rounded-full bg-orange-500 text-zinc-950 font-bold">{{ auth.unreadCount }}</span>
        </button>
        <button @click="activeTab = 'profile'" :class="activeTab === 'profile' ? 'bg-purple-600/25 text-orange-300 font-semibold border border-purple-500/30' : 'text-zinc-300 hover:bg-zinc-800'" class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition cursor-pointer">
          <User class="w-4 h-4" /> Редагувати профіль
        </button>
      </div>
    </div>

    <div class="lg:col-span-3 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <div v-if="actionError" class="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-300 text-sm">
        {{ actionError }}
      </div>

      <div v-if="activeTab === 'bookings'" class="space-y-4">
        <h2 class="text-xl font-bold text-zinc-100">Історія бронювань</h2>
        <p v-if="!bookings.length" class="text-sm text-zinc-500">Ви ще не бронювали тренувань.</p>
        <div v-for="b in bookings" :key="b.id" class="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-zinc-100">{{ b.section.title }}</h3>
              <span
                v-if="b.usedMembershipType"
                class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                Абонемент {{ b.usedMembershipType }}
              </span>
              <span
                v-if="b.promoDiscountPercent && b.promoDiscountPercent > 0"
                class="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30"
              >
                Акція -{{ b.promoDiscountPercent }}%
              </span>
            </div>
            <p class="text-xs text-zinc-400 mt-0.5">
              {{ b.section.facility.name }} • {{ new Date(b.slot.startTime).toLocaleString('uk-UA') }}
            </p>
            <p v-if="b.appliedAddons.length" class="text-xs text-purple-400 mt-1">
              Опції: {{ b.appliedAddons.join(', ') }}
            </p>
            <p v-if="b.bonusPointsUsed && b.bonusPointsUsed > 0" class="text-xs text-orange-400 mt-0.5">
              Списано бонусів: {{ b.bonusPointsUsed }} б.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-bold text-orange-400">{{ b.totalPrice }} грн</span>
            <span
              class="px-2.5 py-1 text-xs rounded-full font-semibold border"
              :class="b.status === 'CONFIRMED' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : b.status === 'CANCELLED' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : 'bg-zinc-800 text-zinc-300 border-zinc-700'"
            >
              {{ b.status }}
            </span>
            <button
              v-if="b.status === 'CONFIRMED'"
              @click="cancelBooking(b.id)"
              class="text-xs text-orange-400 hover:underline cursor-pointer"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'memberships'" class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-zinc-100">Управління абонементами</h2>
          <p class="text-xs text-zinc-400 mt-1">
            Активний абонемент автоматично застосовується при бронюванні в каталозі та обнуляє вартість входу й включених послуг.
          </p>
        </div>

        <div
          v-if="membershipPromo"
          class="p-3.5 rounded-xl bg-gradient-to-r from-purple-700/40 to-orange-500/20 border border-orange-500/40 text-sm flex flex-wrap items-center justify-between gap-2"
        >
          <span class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <b class="text-orange-300">Акція «{{ membershipPromo.title }}»:</b>
              <span class="text-zinc-200 ml-1">{{ membershipPromo.description }}</span>
            </span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-orange-500 text-zinc-950 font-bold text-xs shrink-0">
            -{{ membershipPromo.discountPercent }}%
          </span>
        </div>

        <div class="grid md:grid-cols-3 gap-4">
          <div
            v-for="plan in membershipPlans"
            :key="plan.type"
            class="p-5 bg-zinc-950 rounded-2xl flex flex-col justify-between"
            :class="plan.highlight ? 'border-2 border-orange-500/70 shadow-lg shadow-purple-950/30' : 'border border-zinc-800'"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-bold text-zinc-100">{{ plan.name }}</h3>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  {{ plan.type }}
                </span>
              </div>
              <p class="text-xs text-zinc-400 mt-1">{{ plan.subtitle }}</p>

              <ul class="mt-4 space-y-2 text-xs text-zinc-300">
                <li v-for="perk in plan.perks" :key="perk" class="flex items-start gap-2">
                  <Check class="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>{{ perk }}</span>
                </li>
              </ul>

              <input
                v-if="plan.type === 'CORPORATE'"
                v-model="companyName"
                placeholder="Назва вашої компанії"
                class="mt-3 w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
              />
            </div>

            <div class="mt-5 pt-4 border-t border-zinc-800">
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-2xl font-bold text-orange-400">{{ getPlanPrice(plan.basePrice) }} грн</span>
                <span v-if="membershipPromo" class="text-xs text-zinc-500 line-through">{{ plan.basePrice }} грн</span>
              </div>
              <button
                @click="buyMembership(plan.type)"
                class="w-full py-2 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
                :class="plan.highlight ? 'bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90' : 'bg-purple-600 hover:bg-purple-500'"
              >
                Оформити {{ plan.type }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-semibold text-zinc-200 mb-3">Ваші абонементи</h3>
          <p v-if="!memberships.length" class="text-sm text-zinc-500">У вас ще немає оформлених абонементів.</p>

          <div
            v-for="m in memberships"
            :key="m.id"
            class="p-4 bg-zinc-950 border border-zinc-800 rounded-xl mb-2.5 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-purple-300 font-bold">{{ m.type }}</span>
                <span v-if="m.companyName" class="text-zinc-400 text-xs">({{ m.companyName }})</span>
                <span
                  class="px-2 py-0.5 text-[11px] rounded-full font-semibold border"
                  :class="m.status === 'ACTIVE' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : m.status === 'USED' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'"
                >
                  {{ m.status }}
                </span>
              </div>
              <p class="text-xs text-zinc-400 mt-1">
                Сплачено: <b class="text-orange-400">{{ m.price }} грн</b> •
                Діє до: {{ m.expiresAt ? new Date(m.expiresAt).toLocaleDateString('uk-UA') : '—' }}
                <span v-if="m.type === 'SINGLE' && m.visitsLeft !== null && m.visitsLeft !== undefined">
                  • Залишилось візитів: <b class="text-zinc-200">{{ m.visitsLeft }}</b>
                </span>
              </p>
            </div>

            <div v-if="m.status === 'ACTIVE'" class="flex flex-wrap items-center gap-2">
              <button
                v-if="m.type === 'SINGLE'"
                @click="upgradeMembership(m.id, 'MONTHLY')"
                class="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
              >
                Підвищити до MONTHLY
              </button>
              <button
                v-if="m.type !== 'CORPORATE'"
                @click="upgradeMembership(m.id, 'CORPORATE')"
                class="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold cursor-pointer"
              >
                Підвищити до CORPORATE
              </button>
              <button
                @click="cancelMembership(m.id)"
                class="px-3 py-1.5 text-xs rounded-lg border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 cursor-pointer"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'notifications'" class="space-y-3">
        <h2 class="text-xl font-bold text-zinc-100">Центр сповіщень</h2>
        <p v-if="!auth.notifications.length" class="text-sm text-zinc-500">Сповіщень поки немає.</p>
        <div
          v-for="n in auth.notifications"
          :key="n.id"
          class="p-4 border rounded-xl flex items-start justify-between gap-4"
          :class="n.isRead ? 'bg-zinc-950 border-zinc-800' : 'bg-purple-950/30 border-purple-500/40'"
        >
          <div>
            <span class="text-[11px] font-semibold uppercase text-orange-400">{{ n.eventType }}</span>
            <h3 class="font-bold text-sm text-zinc-100">{{ n.title }}</h3>
            <p class="text-sm text-zinc-300 mt-0.5">{{ n.message }}</p>
            <span class="text-xs text-zinc-500">{{ new Date(n.createdAt).toLocaleString('uk-UA') }}</span>
          </div>
          <button
            v-if="!n.isRead"
            @click="auth.markNotificationRead(n.id)"
            class="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-orange-500 shrink-0 cursor-pointer"
          >
            Прочитано
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'profile'" class="max-w-md space-y-4">
        <h2 class="text-xl font-bold text-zinc-100">Налаштування профілю</h2>

        <div class="flex items-center gap-4 pb-2">
          <img
            v-if="resolveAvatarUrl(auth.user?.avatarUrl)"
            :src="resolveAvatarUrl(auth.user?.avatarUrl)!"
            alt="Avatar preview"
            class="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shrink-0"
          />
          <div v-else class="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <User class="w-7 h-7 text-zinc-500" />
          </div>
          <div>
            <label class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-700 hover:border-orange-500 text-sm text-zinc-200 cursor-pointer transition">
              <Upload class="w-4 h-4 text-orange-400" />
              <span>{{ uploadingPhoto ? 'Завантаження...' : 'Завантажити фото з ПК' }}</span>
              <input type="file" accept="image/*" class="hidden" :disabled="uploadingPhoto" @change="uploadPhoto" />
            </label>
            <p class="text-[11px] text-zinc-500 mt-1">JPG, PNG або WEBP до 3 МБ</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">ПІБ</label>
          <input v-model="profileForm.fullName" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:border-purple-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Телефон</label>
          <input v-model="profileForm.phone" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:border-purple-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Або URL фото (аватар)</label>
          <input v-model="profileForm.avatarUrl" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:border-purple-500 focus:outline-none" placeholder="https://..." />
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Спортивні переваги (через кому)</label>
          <input v-model="profileForm.preferencesText" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:border-purple-500 focus:outline-none" placeholder="yoga, swimming, football" />
        </div>

        <p v-if="saveMessage" class="text-sm text-orange-400 font-medium">{{ saveMessage }}</p>
        <button @click="saveProfile" class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
          Зберегти зміни
        </button>
      </div>
    </div>
  </div>
</template>