<template>
  <div
    @click="$emit('select')"
    class="comic-panel p-3.5 sm:p-5 cursor-pointer group transition-all duration-200"
    :class="{
      '!border-emerald-500 !shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] sm:!shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] dark:!border-emerald-400 dark:!shadow-[4px_4px_0px_0px_rgba(52,211,153,0.8)] sm:dark:!shadow-[6px_6px_0px_0px_rgba(52,211,153,0.8)] -translate-x-0.5 -translate-y-0.5': isActive,
    }"
  >
    <!-- Top Row: Icon, Currency Info & Comic Tag -->
    <div class="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Currency Symbol Circle with Comic Outline -->
        <div
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:border-slate-200 dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-105 flex-shrink-0"
          :class="symbolClass"
        >
          {{ rateItem.symbol }}
        </div>
        <div>
          <h3 class="font-black text-sm sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            {{ rateItem.name }}
          </h3>
          <span class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {{ rateItem.source }}
          </span>
        </div>
      </div>

      <!-- Comic Tag: Active Indicator -->
      <span
        v-if="isActive"
        class="comic-badge bg-emerald-400 text-slate-950 dark:bg-emerald-400 dark:text-slate-950"
      >
        ★ ACTIVA
      </span>
    </div>

    <!-- Main Exchange Rate Price -->
    <div class="mb-3">
      <div class="flex items-center justify-between gap-2 mb-1">
        <div class="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {{ cardType === 'binance_usdt' ? 'Promedio Binance P2P' : 'Tasa Oficial BCV' }}
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
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">Bs.</span>
        <span class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
          {{ formattedRate }}
        </span>
      </div>
    </div>

    <!-- Footer: Last update timestamp -->
    <div class="flex items-center justify-between pt-2.5 border-t-2 border-slate-900/10 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
      <div class="flex items-center gap-1.5 truncate">
        <Clock class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="truncate">{{ formattedTime }}</span>
      </div>
      <span class="font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
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
  cardType: 'bcv_usd' | 'bcv_eur' | 'binance_usdt';
  spreadPercentage?: number;
}

const props = defineProps<Props>();
defineEmits<{
  (e: 'select'): void;
}>();

/**
 * Format localized Venezuelan currency.
 */
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

const formattedRate = computed(() => formatNumber(props.rateItem.rate));

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
 * Distinct badge styling for USD, EUR, and USDT with comic pop colors.
 */
const symbolClass = computed(() => {
  switch (props.cardType) {
    case 'bcv_usd':
      return 'bg-emerald-300 text-slate-950 dark:bg-emerald-400 dark:text-slate-950';
    case 'bcv_eur':
      return 'bg-cyan-300 text-slate-950 dark:bg-cyan-400 dark:text-slate-950';
    case 'binance_usdt':
      return 'bg-amber-300 text-slate-950 dark:bg-amber-400 dark:text-slate-950';
    default:
      return 'bg-slate-200 text-slate-900';
  }
});
</script>
