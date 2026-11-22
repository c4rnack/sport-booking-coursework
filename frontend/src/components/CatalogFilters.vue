<script setup lang="ts">
defineProps<{
  sportType: string;
  skillLevel: string;
  ageCategory: string;
}>();

const emit = defineEmits<{
  'update:sportType': [value: string];
  'update:skillLevel': [value: string];
  'update:ageCategory': [value: string];
  reset: [];
}>();
</script>

<template>
  <div class="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-end gap-4">
    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Вид спорту</label>
      <select
        :value="sportType"
        @change="emit('update:sportType', ($event.target as HTMLSelectElement).value)"
        class="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:border-purple-500 focus:outline-none"
      >
        <option value="">Усі види</option>
        <option value="football">Футбол</option>
        <option value="yoga">Йога</option>
        <option value="fitness">Фітнес</option>
        <option value="swimming">Плавання</option>
      </select>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Рівень підготовки</label>
      <select
        :value="skillLevel"
        @change="emit('update:skillLevel', ($event.target as HTMLSelectElement).value)"
        class="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:border-purple-500 focus:outline-none"
      >
        <option value="">Будь-який</option>
        <option value="beginner">Початківець</option>
        <option value="intermediate">Середній</option>
        <option value="pro">Професіонал</option>
      </select>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Вікова категорія</label>
      <select
        :value="ageCategory"
        @change="emit('update:ageCategory', ($event.target as HTMLSelectElement).value)"
        class="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:border-purple-500 focus:outline-none"
      >
        <option value="">Усі категорії</option>
        <option value="kids">Діти</option>
        <option value="teens">Підлітки</option>
        <option value="adult">Дорослі</option>
      </select>
    </div>

    <button
      @click="emit('reset')"
      class="px-3 py-2 text-sm text-zinc-400 hover:text-orange-400 transition cursor-pointer"
    >
      Скинути фільтри
    </button>
  </div>
</template>