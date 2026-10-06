<template>
  <div
    @click="$emit('select')"
    class="comic-panel p-3.5 sm:p-5 cursor-pointer group transition-all duration-200 flex flex-col justify-between"
    :class="{
      '!border-emerald-500 !shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] sm:!shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] dark:!border-emerald-400 dark:!shadow-[4px_4px_0px_0px_rgba(52,211,153,0.8)] sm:dark:!shadow-[6px_6px_0px_0px_rgba(52,211,153,0.8)] -translate-x-0.5 -translate-y-0.5': isActive,
    }"
  >
    <!-- Top Row: Icon, Currency Info & Comic Tag -->
    <div class="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <!-- Currency Symbol Circle with Comic Outline -->
        <div
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm tracking-tight border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:border-slate-200 dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-105 flex-shrink-0"
          :class="symbolClass"
        >
          {{ cardType === 'cucuta_cop' ? 'COP' : rateItem.symbol }}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
            {{ rateItem.name }}
          </h3>
          <span class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate" :title="rateItem.source">
            {{ rateItem.source }}
          </span>
        </div>
      </div>

      <!-- Comic Tag: Active Indicator -->
      <span
        v-if="isActive"
        class="comic-badge bg-emerald-400 text-slate-950 dark:bg-emerald-400 dark:text-slate-950 flex-shrink-0 whitespace-nowrap text-[10px] sm:text-xs"
      >
        ★ ACTIVA
      </span>
    </div>

    <!-- Main Exchange Rate Price -->
    <div class="mb-3">
      <div class="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
        <div class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {{ cardSubtitle }}
        </div>
        <!-- Brecha Cambiaria Badge for Binance USDT -->
        <span
          v-if="cardType === 'binance_usdt' && spreadPercentage !== undefined"
          class="comic-badge bg-amber-400 text-slate-950 dark:bg-amber-400 dark:text-slate-950 text-[10px]"
          title="Brecha cambiaria respecto a BCV Dólar"
        >
          <TrendingUp class="w-3 h-3" />
          +{{ spreadPercentage.toFixed(1) }}% VS BCV
        </span>
        <!-- Cross-rate tag for Cucuta COP -->
        <span
          v-else-if="cardType === 'cucuta_cop'"
          class="comic-badge bg-yellow-300 text-slate-950 dark:bg-yellow-400 dark:text-slate-950 text-[9px] sm:text-[10px]"
        >
          Bs. {{ formatNumber(rateItem.rate, 4) }}/COP
        </span>
      </div>

      <!-- Main Display Price -->
      <div v-if="cardType === 'cucuta_cop'" class="flex flex-col gap-0.5">
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            {{ formatNumber(rateItem.buy || 3.23, 2) }}
          </span>
          <span class="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">COP/Bs.</span>
        </div>
        <div class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
          1 USD ≈ {{ formatNumber(Math.round((rateItem.sell || 3200) / 100) * 100, 0) }} COP
        </div>
      </div>

      <div v-else-if="cardType === 'binance_usdt'" class="flex flex-col gap-0.5">
        <div class="flex items-baseline gap-1.5">
          <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">Bs.</span>
          <span class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            {{ formattedRate }}
          </span>
        </div>
        <div class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
          Compra: {{ formatNumber(rateItem.buy || 0) }} | Venta: {{ formatNumber(rateItem.sell || 0) }}
        </div>
      </div>

      <div v-else class="flex flex-col gap-0.5">
        <div class="flex items-baseline gap-1.5">
          <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">Bs.</span>
          <span class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            {{ formattedRate }}
          </span>
        </div>
        <div class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
          Tasa oficial Banco Central
        </div>
      </div>
    </div>

    <!-- Footer: Last update timestamp -->
    <div class="flex items-center justify-between pt-2.5 border-t-2 border-slate-900/10 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-auto">
      <div class="flex items-center gap-1.5 truncate">
        <Clock class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="truncate">{{ formattedTime }}</span>
      </div>
      <span class="font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 flex-shrink-0">
        ELEGIR
        <ChevronRight class="w-3.5 h-3.5" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock, ChevronRight, TrendingUp } from 'lucide-vue-next';
import type { RateItem } from '../types/rates';

interface Props {
  rateItem: RateItem;
  isActive: boolean;
  cardType: 'bcv_usd' | 'bcv_eur' | 'binance_usdt' | 'cucuta_cop';
  spreadPercentage?: number;
}

const props = defineProps<Props>();
defineEmits<{
  (e: 'select'): void;
}>();

/**
 * Format localized Venezuelan currency.
 */
const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals === 4 ? 4 : 2,
  }).format(value);
};

const formattedRate = computed(() => formatNumber(props.rateItem.rate, 2));

const cardSubtitle = computed(() => {
  switch (props.cardType) {
    case 'bcv_usd':
    case 'bcv_eur':
      return 'Tasa Oficial BCV';
    case 'binance_usdt':
      return 'Promedio Binance P2P';
    case 'cucuta_cop':
      return 'Frontera Cúcuta';
    default:
      return 'Cotización';
  }
});

/**
 * Format timestamp into friendly date string.
 */
const formattedTime = computed(() => {
  if (!props.rateItem.lastUpdated) return 'Reciente';
  try {
    const d = new Date(props.rateItem.lastUpdated);
    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return props.rateItem.lastUpdated;
  }
});

/**
 * Distinct badge styling for USD, EUR, USDT, and COP with comic pop colors.
 */
const symbolClass = computed(() => {
  switch (props.cardType) {
    case 'bcv_usd':
      return 'bg-emerald-300 text-slate-950 dark:bg-emerald-400 dark:text-slate-950';
    case 'bcv_eur':
      return 'bg-cyan-300 text-slate-950 dark:bg-cyan-400 dark:text-slate-950';
    case 'binance_usdt':
      return 'bg-amber-300 text-slate-950 dark:bg-amber-400 dark:text-slate-950';
    case 'cucuta_cop':
      return 'bg-rose-300 text-slate-950 dark:bg-rose-400 dark:text-slate-950';
    default:
      return 'bg-slate-200 text-slate-900';
  }
});
</script>
