<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  Clock,
  CreditCard,
  Dumbbell,
  HeartPulse,
  MapPin,
  Sliders,
  Sparkles,
  Trophy,
  Users,
  Waves,
  Zap,
} from 'lucide-vue-next';
import { api } from '../api/api';
import { useAuthStore } from '../store/auth';
import type { Facility, Promotion, SportSection, Trainer } from '../types';

const auth = useAuthStore();

const promotions = ref<Promotion[]>([]);
const facilities = ref<Facility[]>([]);
const sections = ref<SportSection[]>([]);
const trainers = ref<Trainer[]>([]);

const sportDirections = [
  {
    key: 'football',
    title: 'Футбол та міні-футбол',
    description: 'Криті професійні манежі для дорослих аматорських ліг, підліткових академій та дитячих груп.',
    icon: Trophy,
    badge: 'Командний спорт',
  },
  {
    key: 'swimming',
    title: 'Плавання та аквазона',
    description: '50-метровий басейн, тренування для дорослих і дитячі школи. Безкоштовний басейн для PREMIUM-клієнтів.',
    icon: Waves,
    badge: 'Аквакомплекс',
  },
  {
    key: 'yoga',
    title: 'Йога та стретчинг',
    description: 'Затишні студії для ранкової й вечірньої практики — від Хатха-йоги для початківців до Аштанга-інтенсиву.',
    icon: HeartPulse,
    badge: 'Баланс тіла',
  },
  {
    key: 'fitness',
    title: 'Фітнес та CrossFit',
    description: 'Функціональний тренінг, силові зони, підліткова ОФП та індивідуальний супровід сертифікованих тренерів.',
    icon: Activity,
    badge: 'Сила й драйв',
  },
];

const onlineAdvantages = [
  {
    title: 'Миттєве бронювання 24/7',
    description: 'Обирайте зал, секцію, зручний часовий слот та оплачуйте онлайн без дзвінків адміністратору.',
    icon: Clock,
  },
  {
    title: 'Гнучкі додаткові опції',
    description: 'Додавайте оренду інвентарю, персонального тренера чи доступ до басейну в один клік із прозорим перерахунком.',
    icon: Sliders,
  },
  {
    title: 'Прозора система лояльності',
    description: 'Кешбек балами з кожного бронювання, оплата бонусами до 50% та автоматичний апгрейд до PREMIUM (-15%).',
    icon: Award,
  },
  {
    title: 'Розумні сповіщення',
    description: 'Автоматичні нагадування за 24 години до тренування, новини про нові секції та гарячі акції.',
    icon: Bell,
  },
  {
    title: 'Гнучкі абонементи',
    description: 'Разові, місячні та корпоративні тарифи з можливістю миттєвого підвищення рівня або скасування в кабінеті.',
    icon: CreditCard,
  },
  {
    title: 'Сертифіковані тренери',
    description: 'Переглядайте спеціалізацію й реальний рейтинг кожного тренера перед записом на заняття.',
    icon: Users,
  },
];

const sectionCountBySport = computed(() => {
  const counts: Record<string, number> = {};
  for (const s of sections.value) {
    const k = s.sportType.toLowerCase();
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
});

onMounted(async () => {
  const [pRes, fRes, sRes, tRes] = await Promise.allSettled([
    api.get<Promotion[]>('/catalog/promotions'),
    api.get<Facility[]>('/catalog/facilities'),
    api.get<SportSection[]>('/catalog/sections'),
    api.get<Trainer[]>('/catalog/trainers'),
  ]);

  if (pRes.status === 'fulfilled') promotions.value = pRes.value.data;
  if (fRes.status === 'fulfilled') facilities.value = fRes.value.data;
  if (sRes.status === 'fulfilled') sections.value = sRes.value.data;
  if (tRes.status === 'fulfilled') trainers.value = tRes.value.data;
});
</script>

<template>
  <div class="space-y-16 pb-6">
    <section class="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 px-6 py-14 md:px-14 md:py-20">

      <div class="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/25 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl"></div>

      <div class="relative z-10 max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap class="w-3.5 h-3.5 text-orange-400" />
          <span>Мережа спортивних центрів нового покоління</span>
        </div>

        <h1 class="text-4xl md:text-6xl font-black tracking-tight text-zinc-100 leading-[1.1]">
          Твій ритм. Твій зал.<br />
          <span class="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
            Бронюй спорт онлайн у PULSAR
          </span>
        </h1>

        <p class="mt-5 text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl">
          Єдина онлайн-платформа мережі спортивних центрів: обирайте зали, секції та тренерів, керуйте абонементами, накопичуйте бонусні бали та отримуйте персональні пропозиції в одному кабінеті.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-4">
          <router-link
            to="/catalog"
            class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-semibold hover:opacity-95 transition shadow-lg shadow-purple-950/50"
          >
            <span>Перейти до каталогу</span>
            <ArrowRight class="w-4 h-4" />
          </router-link>

          <router-link
            :to="auth.isAuthenticated ? '/profile' : '/auth'"
            class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-950 border border-zinc-700 hover:border-purple-500 text-zinc-200 font-semibold transition"
          >
            {{ auth.isAuthenticated ? 'Мій кабінет' : 'Приєднатися до клубу' }}
          </router-link>
        </div>

        <div class="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p class="text-2xl md:text-3xl font-black text-orange-400">{{ facilities.length || 5 }}+</p>
            <p class="text-xs text-zinc-400 mt-1">Спортивних локацій</p>
          </div>
          <div>
            <p class="text-2xl md:text-3xl font-black text-purple-400">{{ sections.length || 10 }}+</p>
            <p class="text-xs text-zinc-400 mt-1">Активних секцій</p>
          </div>
          <div>
            <p class="text-2xl md:text-3xl font-black text-orange-400">{{ trainers.length || 6 }}+</p>
            <p class="text-xs text-zinc-400 mt-1">Топ-тренерів</p>
          </div>
          <div>
            <p class="text-2xl md:text-3xl font-black text-purple-400">24/7</p>
            <p class="text-xs text-zinc-400 mt-1">Онлайн-бронювання</p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="promotions.length" class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-orange-400">Спеціальні умови</span>
          <h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mt-1">Актуальні акції та пропозиції</h2>
        </div>
        <router-link to="/catalog" class="text-sm text-purple-400 hover:text-orange-400 inline-flex items-center gap-1 transition">
          <span>Забронювати зі знижкою</span>
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

      <div class="grid md:grid-cols-3 gap-5">
        <div
          v-for="promo in promotions"
          :key="promo.id"
          class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/70 via-zinc-900 to-zinc-900 border border-purple-500/35 p-6 flex flex-col justify-between hover:border-orange-500/60 transition shadow-lg shadow-purple-950/30"
        >
          <div class="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-orange-500/15 blur-2xl group-hover:bg-orange-500/25 transition"></div>

          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                <Sparkles class="w-4 h-4 text-orange-400" />
                Акція
              </span>
              <span class="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-orange-500 text-white text-sm font-black shadow">
                -{{ promo.discountPercent }}%
              </span>
            </div>

            <h3 class="text-xl font-bold text-zinc-100">{{ promo.title }}</h3>
            <p class="text-sm text-zinc-300 mt-2 leading-relaxed">{{ promo.description }}</p>
          </div>

          <div class="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span class="text-zinc-400">
              Діє до: <b class="text-zinc-200">{{ new Date(promo.validUntil).toLocaleDateString('uk-UA') }}</b>
            </span>
            <router-link to="/catalog" class="text-orange-400 font-semibold hover:underline inline-flex items-center gap-1">
              Скористатись <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-6">
      <div>
        <span class="text-xs font-semibold uppercase tracking-widest text-purple-400">Послуги мережі</span>
        <h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mt-1">Оберіть свій напрямок тренувань</h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <router-link
          v-for="dir in sportDirections"
          :key="dir.key"
          :to="{ path: '/catalog', query: { sportType: dir.key } }"
          class="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/60 hover:-translate-y-1 transition"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 rounded-xl bg-purple-500/15 text-orange-400 border border-purple-500/25 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-orange-500 group-hover:text-white transition">
                <component :is="dir.icon" class="w-6 h-6" />
              </div>
              <span class="text-[11px] px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
                {{ dir.badge }}
              </span>
            </div>

            <h3 class="text-lg font-bold text-zinc-100 group-hover:text-orange-300 transition">{{ dir.title }}</h3>
            <p class="text-sm text-zinc-400 mt-2 leading-relaxed">{{ dir.description }}</p>
          </div>

          <div class="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
            <span class="text-purple-400">
              Секцій у каталозі: {{ sectionCountBySport[dir.key] ?? 0 }}
            </span>
            <span class="text-orange-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition">
              Дивитись <ArrowRight class="w-3.5 h-3.5" />
            </span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="space-y-6">
      <div>
        <span class="text-xs font-semibold uppercase tracking-widest text-orange-400">Чому PULSAR</span>
        <h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mt-1">Переваги нашого онлайн-сервісу</h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="adv in onlineAdvantages"
          :key="adv.title"
          class="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/40 transition"
        >
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/25 to-orange-500/20 border border-purple-500/30 flex items-center justify-center text-orange-400 mb-4">
            <component :is="adv.icon" class="w-5 h-5" />
          </div>
          <h3 class="font-bold text-base text-zinc-100">{{ adv.title }}</h3>
          <p class="text-sm text-zinc-400 mt-1.5 leading-relaxed">{{ adv.description }}</p>
        </div>
      </div>
    </section>

    <section v-if="facilities.length" class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span class="text-xs font-semibold uppercase tracking-widest text-purple-400">Локації мережі</span>
          <h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mt-1">Наші спортивні центри</h2>
        </div>
        <router-link to="/catalog" class="text-sm text-orange-400 hover:underline inline-flex items-center gap-1">
          Усі зали та розклад <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="fac in facilities"
          :key="fac.id"
          class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {{ fac.sportType }}
              </span>
              <span class="text-xs text-zinc-500">Місткість: {{ fac.capacity }} осіб</span>
            </div>
            <h3 class="font-bold text-zinc-100">{{ fac.name }}</h3>
            <p class="flex items-center gap-1.5 text-sm text-zinc-400 mt-2">
              <MapPin class="w-4 h-4 text-orange-400 shrink-0" />
              <span>{{ fac.address }}</span>
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span class="text-zinc-400">Базовий тариф залу</span>
            <span class="font-bold text-orange-400 text-sm">{{ fac.baseHourlyRate }} грн/год</span>
          </div>
        </div>
      </div>
    </section>

    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-purple-700 to-orange-500 p-8 md:p-12 text-white shadow-xl shadow-purple-950/40">
      <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="max-w-xl">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-100 mb-2">
            <Dumbbell class="w-4 h-4" />
            <span>Програма лояльності PULSAR</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-black">
            Тренуйтесь частіше — платіть менше до -20%
          </h2>
          <p class="text-sm md:text-base text-purple-100 mt-2">
            Отримуйте кешбек балами з кожного заняття, досягайте статусу <b>PREMIUM</b> (300 балів) для безкоштовного басейну або оформлюйте <b>CORPORATE</b> абонемент для команди.
          </p>
        </div>

        <router-link
          to="/catalog"
          class="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-950 text-white font-semibold hover:bg-zinc-900 transition shadow-lg"
        >
          <span>Обрати тренування</span>
          <ArrowRight class="w-4 h-4 text-orange-400" />
        </router-link>
      </div>
    </section>
  </div>
</template>