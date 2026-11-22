<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Lock, Mail, Phone, User } from 'lucide-vue-next';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const router = useRouter();

const isRegister = ref(false);
const errorMsg = ref('');
const loading = ref(false);

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  phone: '',
});

async function submit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    if (isRegister.value) {
      await auth.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
    } else {
      await auth.login(form.email, form.password);
    }

    if (!auth.isAuthenticated) {
      errorMsg.value = 'Сесію не підтверджено сервером. Перевірте налаштування бекенду.';
      return;
    }

    await router.push(auth.isAdmin ? '/admin' : '/');
  } catch (err: any) {
    const rawMsg = err?.response?.data?.message || err?.message;
    errorMsg.value = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg || 'Невірний email або пароль';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-12">
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-purple-950/30 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-500"></div>

      <h1 class="text-2xl font-bold text-zinc-100">
        {{ isRegister ? 'Створити акаунт' : 'Вхід у систему' }}
      </h1>
      <p class="text-sm text-zinc-400 mt-1 mb-6">
        {{ isRegister ? 'Заповніть дані для бронювання залів та секцій' : 'Введіть свої облікові дані для доступу до кабінету' }}
      </p>

      <form @submit.prevent="submit" class="space-y-4">
        <div v-if="isRegister">
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">ПІБ</label>
          <div class="relative">
            <User class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.fullName"
              required
              placeholder="Іван Петренко"
              class="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Email</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              placeholder="name@example.com"
              class="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Пароль</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.password"
              type="password"
              required
              minlength="6"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div v-if="isRegister">
          <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Телефон</label>
          <div class="relative">
            <Phone class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="form.phone"
              placeholder="+380..."
              class="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <p v-if="errorMsg" class="text-sm text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-purple-900/30 cursor-pointer"
        >
          {{ loading ? 'Зачекайте...' : isRegister ? 'Зареєструватися' : 'Увійти' }}
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-zinc-800 text-center">
        <button
          @click="isRegister = !isRegister; errorMsg = ''"
          class="text-sm text-purple-400 hover:text-orange-400 transition cursor-pointer"
        >
          {{ isRegister ? 'Вже маєте акаунт? Увійти' : 'Немає акаунту? Створити' }}
        </button>
      </div>
    </div>
  </div>
</template>