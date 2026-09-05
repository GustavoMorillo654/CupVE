<template>
  <header class="w-full sticky top-0 z-30 px-4 py-2.5 backdrop-blur-xl bg-white/90 dark:bg-slate-950/85 border-b-2 border-slate-900 dark:border-slate-300/80 transition-colors duration-200">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
      <!-- Logo and App Title -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center font-black text-xl">
          <Coins class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              CUP<span class="text-emerald-500">VE</span>
            </h1>
            <span class="comic-badge bg-emerald-400 text-slate-950 !py-0 !text-[10px]">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
              EN VIVO
            </span>
          </div>
          <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
            Monitor de Tasas de Cambio & Conversor de Venezuela
          </p>
        </div>
      </div>

      <!-- Controls: Refresh Timer & Theme Switcher -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Next update countdown badge -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-900 dark:border-slate-300/80 text-xs font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
          <Clock class="w-3.5 h-3.5 text-slate-500" />
          <span class="text-slate-600 dark:text-slate-300">AUTO-REFRESCO:</span>
          <span class="font-mono text-emerald-600 dark:text-emerald-400">{{ formattedCountdown }}</span>
        </div>

        <!-- Manual Refresh Button -->
        <button
          @click="$emit('refresh')"
          :disabled="isRefreshing"
          class="comic-button px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 flex items-center gap-1.5 text-xs transition-all disabled:opacity-50"
          title="Actualizar tasas ahora"
        >
          <RefreshCw
            class="w-3.5 h-3.5 transition-transform duration-700"
            :class="{ 'animate-spin text-emerald-500': isRefreshing }"
          />
          <span class="font-black hidden sm:inline">ACTUALIZAR</span>
        </button>

        <!-- Theme Toggle (Dark / Light) -->
        <button
          @click="toggleTheme"
          class="comic-button p-2 bg-yellow-300 dark:bg-slate-800 text-slate-950 dark:text-amber-400 hover:bg-yellow-200 transition-colors"
          :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-slate-900" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Coins, RefreshCw, Clock, Sun, Moon } from 'lucide-vue-next';

interface Props {
  isRefreshing: boolean;
  secondsUntilRefresh: number;
}

const props = defineProps<Props>();
defineEmits<{
  (e: 'refresh'): void;
}>();

const isDark = ref<boolean>(true);

/**
 * Format seconds countdown into MM:SS format.
 */
const formattedCountdown = computed(() => {
  const mins = Math.floor(props.secondsUntilRefresh / 60);
  const secs = props.secondsUntilRefresh % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

/**
 * Toggle between Dark Mode and Light Mode, persisting choice to localStorage.
 */
const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  } else {
    isDark.value = true;
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
});
</script>
