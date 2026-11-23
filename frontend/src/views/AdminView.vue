<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { BellRing, Pencil, Trash2, X } from 'lucide-vue-next';
import { api } from '../api/api';
import type {
  BookingRecord,
  BookingStatus,
  Facility,
  LoyaltyTier,
  Promotion,
  PromotionTarget,
  ScheduleSlot,
  SportSection,
  Trainer,
  UserProfile,
} from '../types';

const tab = ref<'entities' | 'promos' | 'bookings' | 'users'>('entities');

const facilities = ref<Facility[]>([]);
const trainers = ref<Trainer[]>([]);
const sections = ref<SportSection[]>([]);
const slots = ref<ScheduleSlot[]>([]);
const promotions = ref<Promotion[]>([]);
const bookings = ref<BookingRecord[]>([]);
const users = ref<UserProfile[]>([]);

const toast = ref('');
const triggeringReminders = ref(false);

const editingFacilityId = ref<string | null>(null);
const editingTrainerId = ref<string | null>(null);
const editingSectionId = ref<string | null>(null);
const editingSlotId = ref<string | null>(null);
const editingPromoId = ref<string | null>(null);

const facilityForm = reactive({ name: '', address: '', sportType: 'fitness', capacity: 20, baseHourlyRate: 500 });
const trainerForm = reactive({ fullName: '', specialization: '', rating: 5 });
const sectionForm = reactive({ title: '', sportType: 'yoga', skillLevel: 'beginner', ageCategory: 'adult', basePrice: 350, facilityId: '', trainerId: '' });
const slotForm = reactive({ sectionId: '', startTime: '', endTime: '', availableSpots: 10 });
const promoForm = reactive<{
  title: string;
  description: string;
  discountPercent: number;
  targetScope: PromotionTarget;
  targetSportType: string;
  validUntil: string;
}>({
  title: '',
  description: '',
  discountPercent: 15,
  targetScope: 'ALL_SECTIONS',
  targetSportType: 'swimming',
  validUntil: '',
});

function notifyToast(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ''), 4000);
}

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function loadAll() {
  const [fRes, tRes, sRes, slRes, pRes, bRes, uRes] = await Promise.all([
    api.get<Facility[]>('/catalog/facilities'),
    api.get<Trainer[]>('/catalog/trainers'),
    api.get<SportSection[]>('/catalog/sections'),
    api.get<ScheduleSlot[]>('/admin/slots'),
    api.get<Promotion[]>('/admin/promotions'),
    api.get<BookingRecord[]>('/admin/bookings'),
    api.get<UserProfile[]>('/admin/users'),
  ]);
  facilities.value = fRes.data;
  trainers.value = tRes.data;
  sections.value = sRes.data;
  slots.value = slRes.data;
  promotions.value = pRes.data;
  bookings.value = bRes.data;
  users.value = uRes.data;
}

function startEditFacility(f: Facility) {
  editingFacilityId.value = f.id;
  facilityForm.name = f.name;
  facilityForm.address = f.address;
  facilityForm.sportType = f.sportType;
  facilityForm.capacity = f.capacity;
  facilityForm.baseHourlyRate = f.baseHourlyRate;
}

function resetFacilityForm() {
  editingFacilityId.value = null;
  facilityForm.name = '';
  facilityForm.address = '';
  facilityForm.sportType = 'fitness';
  facilityForm.capacity = 20;
  facilityForm.baseHourlyRate = 500;
}

async function submitFacility() {
  if (editingFacilityId.value) {
    await api.patch(`/admin/facilities/${editingFacilityId.value}`, facilityForm);
    notifyToast('Дані залу оновлено!');
  } else {
    await api.post('/admin/facilities', facilityForm);
    notifyToast('Зал додано!');
  }
  resetFacilityForm();
  await loadAll();
}

async function removeFacility(id: string) {
  if (editingFacilityId.value === id) resetFacilityForm();
  await api.delete(`/admin/facilities/${id}`);
  notifyToast('Зал видалено');
  await loadAll();
}

function startEditTrainer(t: Trainer) {
  editingTrainerId.value = t.id;
  trainerForm.fullName = t.fullName;
  trainerForm.specialization = t.specialization;
  trainerForm.rating = t.rating;
}

function resetTrainerForm() {
  editingTrainerId.value = null;
  trainerForm.fullName = '';
  trainerForm.specialization = '';
  trainerForm.rating = 5;
}

async function submitTrainer() {
  if (editingTrainerId.value) {
    await api.patch(`/admin/trainers/${editingTrainerId.value}`, trainerForm);
    notifyToast('Дані тренера оновлено!');
  } else {
    await api.post('/admin/trainers', trainerForm);
    notifyToast('Тренера додано!');
  }
  resetTrainerForm();
  await loadAll();
}

async function removeTrainer(id: string) {
  if (editingTrainerId.value === id) resetTrainerForm();
  await api.delete(`/admin/trainers/${id}`);
  notifyToast('Тренера видалено');
  await loadAll();
}

function startEditSection(s: SportSection) {
  editingSectionId.value = s.id;
  sectionForm.title = s.title;
  sectionForm.sportType = s.sportType;
  sectionForm.skillLevel = s.skillLevel;
  sectionForm.ageCategory = s.ageCategory;
  sectionForm.basePrice = s.basePrice;
  sectionForm.facilityId = s.facility.id;
  sectionForm.trainerId = s.trainer.id;
}

function resetSectionForm() {
  editingSectionId.value = null;
  sectionForm.title = '';
  sectionForm.sportType = 'yoga';
  sectionForm.skillLevel = 'beginner';
  sectionForm.ageCategory = 'adult';
  sectionForm.basePrice = 350;
  sectionForm.facilityId = '';
  sectionForm.trainerId = '';
}

async function submitSection() {
  if (editingSectionId.value) {
    await api.patch(`/admin/sections/${editingSectionId.value}`, sectionForm);
    notifyToast('Секцію оновлено!');
  } else {
    await api.post('/admin/sections', sectionForm);
    notifyToast('Секцію створено — клієнтам надіслано сповіщення!');
  }
  resetSectionForm();
  await loadAll();
}

async function removeSection(id: string) {
  if (editingSectionId.value === id) resetSectionForm();
  await api.delete(`/admin/sections/${id}`);
  notifyToast('Секцію видалено');
  await loadAll();
}

function startEditSlot(sl: ScheduleSlot) {
  editingSlotId.value = sl.id;
  slotForm.sectionId = sl.sectionId;
  slotForm.startTime = toDateTimeLocal(sl.startTime);
  slotForm.endTime = toDateTimeLocal(sl.endTime);
  slotForm.availableSpots = sl.availableSpots;
}

function resetSlotForm() {
  editingSlotId.value = null;
  slotForm.sectionId = '';
  slotForm.startTime = '';
  slotForm.endTime = '';
  slotForm.availableSpots = 10;
}

async function submitSlot() {
  const payload = {
    sectionId: slotForm.sectionId,
    startTime: new Date(slotForm.startTime).toISOString(),
    endTime: new Date(slotForm.endTime).toISOString(),
    availableSpots: slotForm.availableSpots,
  };
  if (editingSlotId.value) {
    await api.patch(`/admin/slots/${editingSlotId.value}`, payload);
    notifyToast('Слот у розкладі оновлено!');
  } else {
    await api.post('/admin/slots', payload);
    notifyToast('Часовий слот додано в розклад!');
  }
  resetSlotForm();
  await loadAll();
}

async function removeSlot(id: string) {
  if (editingSlotId.value === id) resetSlotForm();
  await api.delete(`/admin/slots/${id}`);
  notifyToast('Слот видалено');
  await loadAll();
}

function startEditPromo(p: Promotion) {
  editingPromoId.value = p.id;
  promoForm.title = p.title;
  promoForm.description = p.description;
  promoForm.discountPercent = p.discountPercent;
  promoForm.targetScope = p.targetScope;
  promoForm.targetSportType = p.targetSportType || 'swimming';
  promoForm.validUntil = toDateInput(p.validUntil);
}

function resetPromoForm() {
  editingPromoId.value = null;
  promoForm.title = '';
  promoForm.description = '';
  promoForm.discountPercent = 15;
  promoForm.targetScope = 'ALL_SECTIONS';
  promoForm.targetSportType = 'swimming';
  promoForm.validUntil = '';
}

async function submitPromo() {
  const payload = {
    title: promoForm.title,
    description: promoForm.description,
    discountPercent: promoForm.discountPercent,
    targetScope: promoForm.targetScope,
    targetSportType: promoForm.targetScope === 'SPORT_TYPE' ? promoForm.targetSportType : undefined,
    validUntil: new Date(`${promoForm.validUntil}T23:59:59`).toISOString(),
  };

  if (editingPromoId.value) {
    await api.patch(`/admin/promotions/${editingPromoId.value}`, payload);
    notifyToast('Акцію оновлено!');
  } else {
    await api.post('/admin/promotions', payload);
    notifyToast('Акцію опубліковано, знижку активовано та розіслано клієнтам!');
  }
  resetPromoForm();
  await loadAll();
}

async function removePromo(id: string) {
  if (editingPromoId.value === id) resetPromoForm();
  await api.delete(`/admin/promotions/${id}`);
  notifyToast('Акцію видалено');
  await loadAll();
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
      <h1 class="text-2xl font-bold text-zinc-100">Адмін-панель мережі PULSAR</h1>
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
      <form
        @submit.prevent="submitFacility"
        class="bg-zinc-900 p-5 rounded-2xl border space-y-3 transition"
        :class="editingFacilityId ? 'border-orange-500/60' : 'border-zinc-800'"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-bold" :class="editingFacilityId ? 'text-orange-400' : 'text-purple-300'">
            {{ editingFacilityId ? 'Редагувати спортивний зал' : 'Додати спортивний зал' }}
          </h2>
          <button v-if="editingFacilityId" type="button" @click="resetFacilityForm" class="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 cursor-pointer">
            <X class="w-3.5 h-3.5" /> Скасувати
          </button>
        </div>

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

        <button class="px-4 py-2 text-white rounded-xl text-sm font-semibold cursor-pointer" :class="editingFacilityId ? 'bg-gradient-to-r from-purple-600 to-orange-500' : 'bg-purple-600 hover:bg-purple-500'">
          {{ editingFacilityId ? 'Зберегти зміни' : 'Додати зал' }}
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1 max-h-48 overflow-y-auto pr-1">
          <div
            v-for="f in facilities"
            :key="f.id"
            class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg text-zinc-300"
            :class="editingFacilityId === f.id ? 'bg-orange-500/10 border border-orange-500/30' : ''"
          >
            <span>
              <b class="text-zinc-100">{{ f.name }}</b> — {{ f.address }}
              <span class="text-zinc-500">({{ f.capacity }} місць, {{ f.baseHourlyRate }} грн/год)</span>
            </span>
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <button type="button" @click="startEditFacility(f)" title="Редагувати" class="text-purple-400 hover:text-purple-300 cursor-pointer">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="removeFacility(f.id)" title="Видалити" class="text-orange-400 hover:text-orange-300 cursor-pointer">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <form
        @submit.prevent="submitTrainer"
        class="bg-zinc-900 p-5 rounded-2xl border space-y-3 transition"
        :class="editingTrainerId ? 'border-orange-500/60' : 'border-zinc-800'"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-bold" :class="editingTrainerId ? 'text-orange-400' : 'text-purple-300'">
            {{ editingTrainerId ? 'Редагувати тренера' : 'Додати тренера' }}
          </h2>
          <button v-if="editingTrainerId" type="button" @click="resetTrainerForm" class="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 cursor-pointer">
            <X class="w-3.5 h-3.5" /> Скасувати
          </button>
        </div>

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

        <button class="px-4 py-2 text-white rounded-xl text-sm font-semibold cursor-pointer" :class="editingTrainerId ? 'bg-gradient-to-r from-purple-600 to-orange-500' : 'bg-purple-600 hover:bg-purple-500'">
          {{ editingTrainerId ? 'Зберегти зміни' : 'Додати тренера' }}
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1 max-h-48 overflow-y-auto pr-1">
          <div
            v-for="t in trainers"
            :key="t.id"
            class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg text-zinc-300"
            :class="editingTrainerId === t.id ? 'bg-orange-500/10 border border-orange-500/30' : ''"
          >
            <span>
              <b class="text-zinc-100">{{ t.fullName }}</b> — {{ t.specialization }}
              <span class="text-orange-400 font-semibold">(★ {{ t.rating }})</span>
            </span>
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <button type="button" @click="startEditTrainer(t)" title="Редагувати" class="text-purple-400 hover:text-purple-300 cursor-pointer">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="removeTrainer(t.id)" title="Видалити" class="text-orange-400 hover:text-orange-300 cursor-pointer">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <form
        @submit.prevent="submitSection"
        class="bg-zinc-900 p-5 rounded-2xl border space-y-3 transition"
        :class="editingSectionId ? 'border-orange-500/60' : 'border-zinc-800'"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-bold" :class="editingSectionId ? 'text-orange-400' : 'text-purple-300'">
            {{ editingSectionId ? 'Редагувати секцію' : 'Створити секцію' }}
          </h2>
          <button v-if="editingSectionId" type="button" @click="resetSectionForm" class="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 cursor-pointer">
            <X class="w-3.5 h-3.5" /> Скасувати
          </button>
        </div>

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

        <button class="px-4 py-2 text-white rounded-xl text-sm font-semibold cursor-pointer" :class="editingSectionId ? 'bg-gradient-to-r from-purple-600 to-orange-500' : 'bg-purple-600 hover:bg-purple-500'">
          {{ editingSectionId ? 'Зберегти зміни' : 'Створити секцію' }}
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1 max-h-56 overflow-y-auto pr-1">
          <div
            v-for="s in sections"
            :key="s.id"
            class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg text-zinc-300"
            :class="editingSectionId === s.id ? 'bg-orange-500/10 border border-orange-500/30' : ''"
          >
            <span>
              <b class="text-zinc-100">{{ s.title }}</b>
              (<span class="text-orange-400">{{ s.basePrice }} грн</span>, {{ s.sportType }})
            </span>
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <button type="button" @click="startEditSection(s)" title="Редагувати" class="text-purple-400 hover:text-purple-300 cursor-pointer">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="removeSection(s.id)" title="Видалити" class="text-orange-400 hover:text-orange-300 cursor-pointer">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <form
        @submit.prevent="submitSlot"
        class="bg-zinc-900 p-5 rounded-2xl border space-y-3 transition"
        :class="editingSlotId ? 'border-orange-500/60' : 'border-zinc-800'"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-bold" :class="editingSlotId ? 'text-orange-400' : 'text-purple-300'">
            {{ editingSlotId ? 'Редагувати часовий слот' : 'Додати слот у розклад' }}
          </h2>
          <button v-if="editingSlotId" type="button" @click="resetSlotForm" class="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 cursor-pointer">
            <X class="w-3.5 h-3.5" /> Скасувати
          </button>
        </div>

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
          <input v-model.number="slotForm.availableSpots" type="number" :min="editingSlotId ? 0 : 1" required class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100" />
        </div>

        <button class="px-4 py-2 text-white rounded-xl text-sm font-semibold cursor-pointer" :class="editingSlotId ? 'bg-gradient-to-r from-purple-600 to-orange-500' : 'bg-purple-600 hover:bg-purple-500'">
          {{ editingSlotId ? 'Зберегти зміни' : 'Додати слот' }}
        </button>

        <div class="pt-3 border-t border-zinc-800 space-y-1 max-h-56 overflow-y-auto pr-1">
          <div
            v-for="sl in slots"
            :key="sl.id"
            class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg text-zinc-300"
            :class="editingSlotId === sl.id ? 'bg-orange-500/10 border border-orange-500/30' : ''"
          >
            <span>
              <b class="text-zinc-100">{{ sl.section?.title || 'Секція' }}</b> •
              {{ new Date(sl.startTime).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
              <span class="text-orange-400">({{ sl.availableSpots }} місць)</span>
            </span>
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <button type="button" @click="startEditSlot(sl)" title="Редагувати" class="text-purple-400 hover:text-purple-300 cursor-pointer">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="removeSlot(sl.id)" title="Видалити" class="text-orange-400 hover:text-orange-300 cursor-pointer">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <div v-if="tab === 'promos'" class="grid lg:grid-cols-2 gap-6 items-start">
      <form
        @submit.prevent="submitPromo"
        class="bg-zinc-900 p-6 rounded-2xl border space-y-4 transition"
        :class="editingPromoId ? 'border-orange-500/60' : 'border-zinc-800'"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold" :class="editingPromoId ? 'text-orange-400' : 'text-purple-300'">
            {{ editingPromoId ? 'Редагувати акцію' : 'Публікація акції' }}
          </h2>
          <button v-if="editingPromoId" type="button" @click="resetPromoForm" class="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 cursor-pointer">
            <X class="w-3.5 h-3.5" /> Скасувати
          </button>
        </div>

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
            <label class="block text-xs text-zinc-400 mb-1">На що діє знижка</label>
            <select v-model="promoForm.targetScope" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="ALL_SECTIONS">На всі секції каталогу</option>
              <option value="SPORT_TYPE">На конкретний вид спорту</option>
              <option value="MEMBERSHIPS">На абонементи</option>
            </select>
          </div>

          <div v-if="promoForm.targetScope === 'SPORT_TYPE'">
            <label class="block text-xs text-zinc-400 mb-1">Вид спорту</label>
            <select v-model="promoForm.targetSportType" class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100">
              <option value="football">Футбол</option>
              <option value="yoga">Йога</option>
              <option value="fitness">Фітнес</option>
              <option value="swimming">Плавання</option>
            </select>
          </div>
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
          {{ editingPromoId ? 'Зберегти зміни акції' : 'Опублікувати та сповістити клієнтів' }}
        </button>

        <div class="pt-4 border-t border-zinc-800 space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Існуючі акції ({{ promotions.length }})</p>
          <div
            v-for="p in promotions"
            :key="p.id"
            class="flex justify-between items-center text-xs p-2.5 rounded-xl bg-zinc-950 border"
            :class="editingPromoId === p.id ? 'border-orange-500/50' : 'border-zinc-800'"
          >
            <div>
              <span class="font-bold text-zinc-100">{{ p.title }}</span>
              <span class="ml-1.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">-{{ p.discountPercent }}%</span>
              <p class="text-zinc-500 mt-0.5">
                {{ p.targetScope === 'MEMBERSHIPS' ? 'Абонементи' : p.targetScope === 'SPORT_TYPE' ? `Спорт: ${p.targetSportType}` : 'Усі секції' }}
                • до {{ new Date(p.validUntil).toLocaleDateString('uk-UA') }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <button type="button" @click="startEditPromo(p)" title="Редагувати" class="text-purple-400 hover:text-purple-300 cursor-pointer">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="removePromo(p.id)" title="Видалити" class="text-orange-400 hover:text-orange-300 cursor-pointer">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

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