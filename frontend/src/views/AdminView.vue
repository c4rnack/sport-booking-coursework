<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { BellRing, Trash2 } from 'lucide-vue-next';
import { api } from '../api/api';
import type { BookingRecord, BookingStatus, Facility, LoyaltyTier, SportSection, Trainer, UserProfile } from '../types';

const tab = ref<'entities' | 'promos' | 'bookings' | 'users'>('entities');

const facilities = ref<Facility[]>([]);
const trainers = ref<Trainer[]>([]);
const sections = ref<SportSection[]>([]);
const bookings = ref<BookingRecord[]>([]);
const users = ref<UserProfile[]>([]);
const toast = ref('');
const triggeringReminders = ref(false);

const facilityForm = reactive({ name: '', address: '', sportType: 'fitness', capacity: 20, baseHourlyRate: 500 });
const trainerForm = reactive({ fullName: '', specialization: '', rating: 5 });
const sectionForm = reactive({ title: '', sportType: 'yoga', skillLevel: 'beginner', ageCategory: 'adult', basePrice: 350, facilityId: '', trainerId: '' });
const slotForm = reactive({ sectionId: '', startTime: '', endTime: '', availableSpots: 10 });
const promoForm = reactive({ title: '', description: '', discountPercent: 15, validUntil: '' });

function notifyToast(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ''), 4000);
}

async function loadAll() {
  const [fRes, tRes, sRes, bRes, uRes] = await Promise.all([
    api.get<Facility[]>('/catalog/facilities'),
    api.get<Trainer[]>('/catalog/trainers'),
    api.get<SportSection[]>('/catalog/sections'),
    api.get<BookingRecord[]>('/admin/bookings'),
    api.get<UserProfile[]>('/admin/users'),
  ]);
  facilities.value = fRes.data;
  trainers.value = tRes.data;
  sections.value = sRes.data;
  bookings.value = bRes.data;
  users.value = uRes.data;
}

async function addFacility() {
  await api.post('/admin/facilities', facilityForm);
  facilityForm.name = '';
  facilityForm.address = '';
  notifyToast('Зал додано!');
  await loadAll();
}

async function removeFacility(id: string) {
  await api.delete(`/admin/facilities/${id}`);
  await loadAll();
}

async function addTrainer() {
  await api.post('/admin/trainers', trainerForm);
  trainerForm.fullName = '';
  trainerForm.specialization = '';
  notifyToast('Тренера додано!');
  await loadAll();
}

async function removeTrainer(id: string) {
  await api.delete(`/admin/trainers/${id}`);
  await loadAll();
}

async function addSection() {
  await api.post('/admin/sections', sectionForm);
  sectionForm.title = '';
  notifyToast('Секцію створено — клієнтам надіслано сповіщення!');
  await loadAll();
}

async function removeSection(id: string) {
  await api.delete(`/admin/sections/${id}`);
  await loadAll();
}

async function addSlot() {
  await api.post('/admin/slots', {
    sectionId: slotForm.sectionId,
    startTime: new Date(slotForm.startTime).toISOString(),
    endTime: new Date(slotForm.endTime).toISOString(),
    availableSpots: slotForm.availableSpots,
  });
  notifyToast('Часовий слот додано в розклад!');
  await loadAll();
}

async function publishPromo() {
  await api.post('/admin/promotions', {
    ...promoForm,
    validUntil: new Date(promoForm.validUntil).toISOString(),
  });
  promoForm.title = '';
  promoForm.description = '';
  notifyToast('Акцію опубліковано та розіслано клієнтам!');
}

async function triggerReminders() {
  triggeringReminders.value = true;
  try {
    const { data } = await api.post<{ sentCount: number }>('/admin/reminders/trigger');
    notifyToast(`Перевірку виконано! Надіслано нагадувань про тренування: ${data.sentCount}`);
  } finally {
    triggeringReminders.value = false;
  }
}

async function changeBookingStatus(id: string, status: BookingStatus) {
  await api.patch(`/admin/bookings/${id}/status`, { status });
  notifyToast('Статус бронювання оновлено');
  await loadAll();
}

async function changeUserTier(id: string, loyaltyTier: LoyaltyTier) {
  await api.patch(`/admin/users/${id}/loyalty`, { loyaltyTier });
  notifyToast('Рівень картки клієнта оновлено');
  await loadAll();
}

onMounted(loadAll);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold text-zinc-100">Адмін-панель мережі спортцентрів</h1>
      <div class="flex flex-wrap gap-2">
        <button @click="tab = 'entities'" :class="tab === 'entities' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-purple-500/50'" class="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">
          Сутності й розклад
        </button>
        <button @click="tab = 'promos'" :class="tab === 'promos' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-purple-500/50'" class="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">
          Акції та нагадування
        </button>
        <button @click="tab = 'bookings'" :class="tab === 'bookings' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-purple-500/50'" class="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">
          Бронювання ({{ bookings.length }})
        </button>
        <button @click="tab = 'users'" :class="tab === 'users' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-purple-500/50'" class="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">
          Клієнти ({{ users.length }})
        </button>
      </div>
    </div>

    <div v-if="toast" class="p-3 rounded-xl bg-purple-500/15 border border-orange-500/40 text-orange-300 text-sm font-medium">
      {{ toast }}
    </div>

    <div v-if="tab === 'entities'" class="grid lg:grid-cols-2 gap-6">
      <form @submit.prevent="addFacility" class="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h2 class="font-bold text-purple-300">Додати спортивний зал</h2>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Назва залу</label>
          <input v-model="facilityForm.name" required placeholder="Наприклад: Олімпійський Басейн" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Адреса</label>
          <input v-model="facilityForm.address" required placeholder="вул. Спортивна, 14" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div class="grid grid-cols-3 gap-2.5">
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Вид спорту</label>
            <select v-model="facilityForm.sportType" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="football">Футбол</option>
              <option value="yoga">Йога</option>
              <option value="fitness">Фітнес</option>
              <option value="swimming">Плавання</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Місткість (осіб)</label>
            <input v-model.number="facilityForm.capacity" type="number" min="1" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Ціна (грн/год)</label>
            <input v-model.number="facilityForm.baseHourlyRate" type="number" min="0" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
        </div>

        <button class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
          Додати зал
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1">
          <div v-for="f in facilities" :key="f.id" class="flex justify-between items-center text-xs py-1 text-zinc-300">
            <span>
              <b class="text-zinc-100">{{ f.name }}</b> — {{ f.address }}
              <span class="text-zinc-500">({{ f.capacity }} місць, {{ f.baseHourlyRate }} грн/год)</span>
            </span>
            <button type="button" @click="removeFacility(f.id)" class="text-orange-400 hover:text-orange-300 cursor-pointer">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <form @submit.prevent="addTrainer" class="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h2 class="font-bold text-purple-300">Додати тренера</h2>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">ПІБ тренера</label>
          <input v-model="trainerForm.fullName" required placeholder="Дмитро Бондар" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Спеціалізація</label>
          <input v-model="trainerForm.specialization" required placeholder="Плавання / Кросфіт" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Рейтинг тренера (від 1.0 до 5.0)</label>
          <input v-model.number="trainerForm.rating" type="number" step="0.1" min="1" max="5" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <button class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
          Додати тренера
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1">
          <div v-for="t in trainers" :key="t.id" class="flex justify-between items-center text-xs py-1 text-zinc-300">
            <span>
              <b class="text-zinc-100">{{ t.fullName }}</b> — {{ t.specialization }}
              <span class="text-orange-400 font-semibold">(★ {{ t.rating }})</span>
            </span>
            <button type="button" @click="removeTrainer(t.id)" class="text-orange-400 hover:text-orange-300 cursor-pointer">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <form @submit.prevent="addSection" class="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h2 class="font-bold text-purple-300">Створити секцію</h2>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Назва секції</label>
          <input v-model="sectionForm.title" required placeholder="Ранкове плавання" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Вид спорту</label>
            <select v-model="sectionForm.sportType" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="football">Футбол</option>
              <option value="yoga">Йога</option>
              <option value="fitness">Фітнес</option>
              <option value="swimming">Плавання</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Рівень підготовки</label>
            <select v-model="sectionForm.skillLevel" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="beginner">Початківець</option>
              <option value="intermediate">Середній</option>
              <option value="pro">Професіонал</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Вікова категорія</label>
            <select v-model="sectionForm.ageCategory" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="kids">Діти</option>
              <option value="teens">Підлітки</option>
              <option value="adult">Дорослі</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Базова ціна заняття (грн)</label>
            <input v-model.number="sectionForm.basePrice" type="number" min="0" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Спортивний зал</label>
            <select v-model="sectionForm.facilityId" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="" disabled>Оберіть зал</option>
              <option v-for="f in facilities" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Тренер</label>
            <select v-model="sectionForm.trainerId" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="" disabled>Оберіть тренера</option>
              <option v-for="t in trainers" :key="t.id" :value="t.id">{{ t.fullName }}</option>
            </select>
          </div>
        </div>

        <button class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
          Створити секцію
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1">
          <div v-for="s in sections" :key="s.id" class="flex justify-between items-center text-xs py-1 text-zinc-300">
            <span><b class="text-zinc-100">{{ s.title }}</b> (<span class="text-orange-400">{{ s.basePrice }} грн</span>)</span>
            <button type="button" @click="removeSection(s.id)" class="text-orange-400 hover:text-orange-300 cursor-pointer">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <form @submit.prevent="addSlot" class="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h2 class="font-bold text-purple-300">Додати слот у розклад</h2>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Секція</label>
          <select v-model="slotForm.sectionId" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
            <option value="" disabled>Оберіть секцію</option>
            <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.title }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Початок тренування</label>
            <input v-model="slotForm.startTime" type="datetime-local" required class="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Кінець тренування</label>
            <input v-model="slotForm.endTime" type="datetime-local" required class="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
        </div>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Кількість вільних місць у слоті</label>
          <input v-model.number="slotForm.availableSpots" type="number" min="1" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <button class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
          Додати слот
        </button>
      </form>
    </div>

    <div v-if="tab === 'promos'" class="grid lg:grid-cols-2 gap-6 items-start">
      <form @submit.prevent="publishPromo" class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <h2 class="text-lg font-bold text-purple-300">Публікація акції</h2>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Заголовок акції</label>
          <input v-model="promoForm.title" required placeholder="Зимова знижка на йогу" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div>
          <label class="block text-xs text-zinc-400 mb-1">Опис пропозиції</label>
          <textarea v-model="promoForm.description" required rows="3" placeholder="Деталі акції для клієнтів..." class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Розмір знижки (%)</label>
            <input v-model.number="promoForm.discountPercent" type="number" min="1" max="90" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">Акція діє до</label>
            <input v-model="promoForm.validUntil" type="date" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
          </div>
        </div>

        <button class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl text-sm font-semibold cursor-pointer">
          Опублікувати та сповістити клієнтів
        </button>
      </form>
\
      <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div class="flex items-center gap-2 text-orange-400">
          <BellRing class="w-5 h-5" />
          <h2 class="text-lg font-bold text-purple-300">Нагадування про тренування</h2>
        </div>
        <p class="text-sm text-zinc-400">
          Планувальник автоматично перевіряє підтверджені бронювання щогодини та розсилає клієнтам нагадування за 24 години до початку тренування через патерн <b class="text-zinc-200">Observer</b>.
        </p>
        <p class="text-xs text-zinc-500">
          Для миттєвої перевірки або демонстрації запустіть розсилку вручну:
        </p>
        <button
          @click="triggerReminders"
          :disabled="triggeringReminders"
          class="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold cursor-pointer transition"
        >
          {{ triggeringReminders ? 'Перевірка...' : 'Перевірити та надіслати нагадування зараз' }}
        </button>
      </div>
    </div>

    <div v-if="tab === 'bookings'" class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-zinc-950 border-b border-zinc-800 text-xs uppercase text-zinc-400">
          <tr>
            <th class="p-3">Клієнт</th>
            <th class="p-3">Секція</th>
            <th class="p-3">Дата</th>
            <th class="p-3">Сума</th>
            <th class="p-3">Статус</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id" class="border-b border-zinc-800/70">
            <td class="p-3 text-zinc-100">{{ b.user?.fullName }}<br /><span class="text-xs text-zinc-500">{{ b.user?.email }}</span></td>
            <td class="p-3 font-medium text-zinc-200">{{ b.section.title }}</td>
            <td class="p-3 text-xs text-zinc-400">{{ new Date(b.slot.startTime).toLocaleString('uk-UA') }}</td>
            <td class="p-3 font-semibold text-orange-400">{{ b.totalPrice }} грн</td>
            <td class="p-3">
              <select :value="b.status" @change="changeBookingStatus(b.id, ($event.target as HTMLSelectElement).value as BookingStatus)" class="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100">
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="tab === 'users'" class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-zinc-950 border-b border-zinc-800 text-xs uppercase text-zinc-400">
          <tr>
            <th class="p-3">ПІБ</th>
            <th class="p-3">Email</th>
            <th class="p-3">Роль</th>
            <th class="p-3">Бонуси</th>
            <th class="p-3">Картка лояльності</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b border-zinc-800/70">
            <td class="p-3 font-medium text-zinc-100">{{ u.fullName }}</td>
            <td class="p-3 text-zinc-300">{{ u.email }}</td>
            <td class="p-3 text-xs text-purple-400 font-semibold">{{ u.role }}</td>
            <td class="p-3 font-semibold text-orange-400">{{ u.bonusPoints }}</td>
            <td class="p-3">
              <select :value="u.loyaltyTier" @change="changeUserTier(u.id, ($event.target as HTMLSelectElement).value as LoyaltyTier)" class="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-100">
                <option value="STANDARD">STANDARD</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="CORPORATE">CORPORATE</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>