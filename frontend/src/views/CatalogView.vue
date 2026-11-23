<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/api';
import BookingModal from '../components/BookingModal.vue';
import CatalogFilters from '../components/CatalogFilters.vue';
import PromoBanners from '../components/PromoBanners.vue';
import SectionCard from '../components/SectionCard.vue';
import { useAuthStore } from '../store/auth';
import type { Promotion, SportSection } from '../types';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const sections = ref<SportSection[]>([]);
const promotions = ref<Promotion[]>([]);
const loading = ref(false);
const selectedSection = ref<SportSection | null>(null);

const filters = reactive({
  sportType: typeof route.query.sportType === 'string' ? route.query.sportType : '',
  skillLevel: '',
  ageCategory: '',
});

async function loadCatalog() {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (filters.sportType) params.sportType = filters.sportType;
    if (filters.skillLevel) params.skillLevel = filters.skillLevel;
    if (filters.ageCategory) params.ageCategory = filters.ageCategory;

    const [secRes, promoRes] = await Promise.all([
      api.get<SportSection[]>('/catalog/sections', { params }),
      api.get<Promotion[]>('/catalog/promotions'),
    ]);
    sections.value = secRes.data;
    promotions.value = promoRes.data;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.sportType = '';
  filters.skillLevel = '';
  filters.ageCategory = '';
  router.replace({ path: '/catalog' });
}

function openBooking(section: SportSection) {
  if (!auth.isAuthenticated) {
    router.push('/auth');
    return;
  }
  selectedSection.value = section;
}

watch(filters, loadCatalog);
onMounted(loadCatalog);
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-zinc-100">Каталог залів та секцій</h1>
      <p class="text-sm text-zinc-400 mt-0.5">Оберіть тренування за видом спорту, рівнем підготовки та віковою категорією</p>
    </div>

    <PromoBanners :promotions="promotions" />

    <CatalogFilters
      v-model:sport-type="filters.sportType"
      v-model:skill-level="filters.skillLevel"
      v-model:age-category="filters.ageCategory"
      @reset="resetFilters"
    />

    <div v-if="loading" class="text-center py-12 text-zinc-400">Завантаження каталогу...</div>

    <div v-else-if="sections.length === 0" class="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400">
      За обраними фільтрами секцій не знайдено.
    </div>

    <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SectionCard
        v-for="sec in sections"
        :key="sec.id"
        :section="sec"
        @book="openBooking"
      />
    </div>

    <BookingModal
      v-if="selectedSection"
      :section="selectedSection"
      @close="selectedSection = null"
      @booked="loadCatalog"
    />
  </div>
</template>