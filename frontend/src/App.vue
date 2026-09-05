<template>
  <div class="min-h-screen flex flex-col relative text-slate-900 dark:text-slate-100 selection:bg-emerald-400 selection:text-slate-950 font-sans">
    <!-- Animated background mesh -->
    <div class="mesh-bg"></div>

    <!-- Floating Comic Top Navigation -->
    <HeaderNavbar
      :isRefreshing="isRefreshing"
      :secondsUntilRefresh="secondsUntilRefresh"
      @refresh="refreshManually"
    />

    <!-- Main Comic Page Container (Zero-Scroll Compact Layout) -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 py-2 sm:py-3 space-y-2 sm:space-y-2.5">
      <!-- Loading Skeleton (Comic Style) -->
      <div v-if="isLoading && !rates" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="comic-panel p-5 h-40 animate-pulse flex flex-col justify-between">
          <div class="flex justify-between items-center">
            <div class="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl"></div>
            <div class="w-16 h-5 bg-slate-200 dark:bg-white/10 rounded-lg"></div>
          </div>
          <div class="w-28 h-7 bg-slate-200 dark:bg-white/10 rounded-lg"></div>
          <div class="w-20 h-4 bg-slate-200 dark:bg-white/10 rounded"></div>
        </div>
      </div>

      <!-- Error Message Banner -->
      <div
        v-else-if="errorMessage && !rates"
        class="comic-panel p-6 max-w-xl mx-auto border-red-500 bg-red-100 dark:bg-red-950/40 text-center space-y-3"
      >
        <div class="text-red-700 dark:text-red-400 font-black text-base">¡ERROR DE CONEXIÓN!</div>
        <p class="text-xs text-slate-700 dark:text-slate-300 font-bold">{{ errorMessage }}</p>
        <button
          @click="refreshManually"
          class="comic-button px-4 py-2 bg-white text-slate-950 text-xs hover:bg-slate-100"
        >
          REINTENTAR AHORA
        </button>
      </div>

      <!-- Main Comic Grid Dashboard -->
      <template v-else-if="rates">
        <!-- VIÑETA 1: Panel de Tasas de Cambio -->
        <section class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="comic-badge bg-emerald-400 text-slate-950">
                VIÑETA 1
              </span>
              <h2 class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tasas de Cambio en Bolívares (VES)
              </h2>
            </div>
            <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Haz clic para activar en el conversor
            </span>
          </div>

          <!-- 3 Rate Cards Side-by-Side -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <!-- BCV USD Card -->
            <RateCard
              :rateItem="rates.bcvUsd"
              :isActive="activeRateKey === 'bcv_usd'"
              cardType="bcv_usd"
              @select="handleSelectRate('bcv_usd')"
            />

            <!-- BCV EUR Card -->
            <RateCard
              :rateItem="rates.bcvEur"
              :isActive="activeRateKey === 'bcv_eur'"
              cardType="bcv_eur"
              @select="handleSelectRate('bcv_eur')"
            />

            <!-- Binance USDT Card (Promedio único con brecha) -->
            <RateCard
              :rateItem="rates.binanceUsdt"
              :isActive="activeRateKey === 'binance_usdt'"
              cardType="binance_usdt"
              :spreadPercentage="exchangeGapPercent"
              @select="handleSelectRate('binance_usdt')"
            />
          </div>
        </section>

        <!-- COMIC DIVIDER: Brecha Cambiaria Strip entre componentes -->
        <div class="p-3 sm:p-3.5 rounded-2xl border-2 border-slate-900 bg-amber-300 dark:bg-amber-400 text-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-950 text-amber-300 flex items-center justify-center font-black text-sm flex-shrink-0">
              ⚡
            </div>
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span class="font-black text-xs uppercase tracking-tight">
                BRECHA CAMBIARIA (USDT vs BCV Dólar):
              </span>
              <span class="comic-badge bg-slate-950 text-white dark:bg-slate-950 dark:text-white !py-0 text-xs">
                +{{ exchangeGapPercent.toFixed(2) }}%
              </span>
              <span class="text-xs font-bold text-slate-800 hidden md:inline">
                • Diferencia de Bs. {{ formatNumber(exchangeGapAmount, 2) }} por cada dólar
              </span>
            </div>
          </div>
          <div class="text-[11px] font-black uppercase bg-slate-950/10 px-2.5 py-1 rounded-lg border border-slate-900/20 whitespace-nowrap">
            USDT está +{{ exchangeGapPercent.toFixed(1) }}% más alto que BCV
          </div>
        </div>

        <!-- Mobile Segmented Tool Switcher (Visible only on mobile/tablet < lg) -->
        <div class="lg:hidden flex rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-900 p-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <button
            @click="activeMobileTab = 'converter'"
            type="button"
            class="flex-1 py-1.5 px-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
            :class="activeMobileTab === 'converter' ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400'"
          >
            ⚡ Conversor
          </button>
          <button
            @click="activeMobileTab = 'comparator'"
            type="button"
            class="flex-1 py-1.5 px-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
            :class="activeMobileTab === 'comparator' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400'"
          >
            🛍️ ¿Cómo Pagar?
          </button>
        </div>

        <!-- VIÑETA 2 & 3: Conversor y Comparador de Pago (Tabbed on mobile, Side-by-Side on desktop) -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch pt-0.5 sm:pt-1">
          <!-- Columna Izquierda: Conversor de Divisas -->
          <div
            id="converter-section"
            class="flex-col"
            :class="{ 'hidden lg:flex': activeMobileTab !== 'converter', 'flex': activeMobileTab === 'converter' }"
          >
            <div class="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span class="comic-badge bg-emerald-400 text-slate-950">
                VIÑETA 2
              </span>
              <span class="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Conversor Rápido
              </span>
            </div>
            <CurrencyConverter
              ref="converterRef"
              :rates="rates"
            />
          </div>

          <!-- Columna Derecha: Asistente de Compra Inteligente -->
          <div
            id="comparator-section"
            class="flex-col"
            :class="{ 'hidden lg:flex': activeMobileTab !== 'comparator', 'flex': activeMobileTab === 'comparator' }"
          >
            <div class="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span class="comic-badge bg-cyan-400 text-slate-950">
                VIÑETA 3
              </span>
              <span class="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Calculadora de Pagos en Tienda
              </span>
            </div>
            <PaymentComparator :rates="rates" />
          </div>
        </section>
      </template>
    </main>


    <!-- Comic Ultra-Compact Single-Line Footer -->
    <footer class="w-full border-t-2 border-slate-900 dark:border-slate-300/80 py-2 px-3 sm:px-6 backdrop-blur-md bg-white/95 dark:bg-slate-950/95 mt-auto">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="comic-badge bg-slate-950 text-white dark:bg-white dark:text-slate-950 !py-0 !text-[9px]">
            CUPVE
          </span>
          <span>•</span>
          <span class="flex items-center gap-1">
            Hecho con <span class="text-red-500">❤️</span> por
            <a
              href="https://github.com/GustavoMorillo654"
              target="_blank"
              rel="noopener noreferrer"
              class="font-black text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
            >
              Gustavo Morillo
              <ExternalLink class="w-3 h-3" />
            </a>
          </span>
        </div>

        <div class="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 truncate text-center md:text-right">
          <span class="truncate">⚠️ Datos referenciales de fuentes públicas (BCV y Binance P2P). Sin intermediación financiera.</span>
          <span>•</span>
          <span class="font-bold whitespace-nowrap">© 2026 CupVE</span>
        </div>
      </div>
    </footer>


  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ExternalLink } from 'lucide-vue-next';
import HeaderNavbar from './components/HeaderNavbar.vue';
import RateCard from './components/RateCard.vue';
import CurrencyConverter from './components/CurrencyConverter.vue';
import PaymentComparator from './components/PaymentComparator.vue';
import { useRates } from './composables/useRates';
import type { RateKey } from './types/rates';

const {
  rates,
  isLoading,
  isRefreshing,
  errorMessage,
  secondsUntilRefresh,
  refreshManually,
} = useRates();

// Reference to the CurrencyConverter component instance
const converterRef = ref<InstanceType<typeof CurrencyConverter> | null>(null);

const activeRateKey = computed<RateKey>(() => {
  return converterRef.value?.activeRateKey || 'bcv_usd';
});

/**
 * Exchange rate gap percentage between Binance USDT and BCV USD:
 * ((USDT - BCV) / BCV) * 100
 */
const exchangeGapPercent = computed<number>(() => {
  if (!rates.value || rates.value.bcvUsd.rate <= 0) return 0;
  const bcv = rates.value.bcvUsd.rate;
  const usdt = rates.value.binanceUsdt.rate;
  return ((usdt - bcv) / bcv) * 100;
});

/**
 * Absolute currency difference in Bolivares between Binance USDT and BCV USD.
 */
const exchangeGapAmount = computed<number>(() => {
  if (!rates.value) return 0;
  return rates.value.binanceUsdt.rate - rates.value.bcvUsd.rate;
});

/**
 * Format localized Venezuelan number.
 */
const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const activeMobileTab = ref<'converter' | 'comparator'>('converter');

/**
 * Handles selecting a rate from a dashboard card.
 */
const handleSelectRate = (key: RateKey) => {
  activeMobileTab.value = 'converter';
  if (converterRef.value) {
    converterRef.value.selectRate(key);
  }
};
</script>
