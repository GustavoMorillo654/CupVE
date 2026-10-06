<template>
  <div class="comic-panel p-4 sm:p-6 h-full flex flex-col justify-between">
    <div>
      <!-- Comic Panel Header -->
      <div class="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b-2 border-slate-900/10 dark:border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-400 text-slate-950 border-2 border-slate-900 flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex-shrink-0">
            ⚡
          </div>
          <div>
            <h2 class="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Conversor de Divisas
            </h2>
            <p class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Cálculo bidireccional instantáneo a 0ms
            </p>
          </div>
        </div>

        <!-- Copy Result Comic Button -->
        <button
          @click="copyResultToClipboard"
          class="comic-button px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs flex items-center gap-1 transition-all flex-shrink-0"
          :class="
            hasCopied
              ? 'bg-emerald-400 text-slate-950'
              : 'bg-yellow-300 text-slate-950 dark:bg-yellow-400 hover:bg-yellow-200'
          "
        >
          <Check v-if="hasCopied" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <Copy v-else class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{{ hasCopied ? '¡COPIADO!' : 'COPIAR' }}</span>
        </button>
      </div>

      <!-- Rate Selection Comic Chips (4 rates: BCV USD, BCV EUR, USDT, COP) -->
      <div class="mb-3 sm:mb-4">
        <label class="block text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-black mb-1.5">
          Tasa aplicada:
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          <button
            v-for="opt in rateOptions"
            :key="opt.key"
            @click="selectRate(opt.key)"
            type="button"
            class="comic-button py-1.5 px-1 sm:py-2 sm:px-1.5 text-xs flex flex-col items-center justify-center gap-0.5 transition-all text-center"
            :class="
              activeRateKey === opt.key
                ? 'bg-emerald-400 text-slate-950 !border-slate-900 !shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:!shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            "
          >
            <div class="font-black text-[11px] sm:text-xs flex items-center gap-1">
              <span>{{ opt.key === 'cucuta_cop' ? 'COP' : opt.symbol }}</span>
              <span class="truncate">{{ opt.key === 'cucuta_cop' ? 'Cúcuta' : opt.shortLabel }}</span>
            </div>
            <span class="text-[9px] sm:text-[10px] font-mono font-bold opacity-85">
              {{ opt.key === 'cucuta_cop' ? `${opt.buy} COP/Bs.` : `Bs. ${formatNumber(opt.rate)}` }}
            </span>
          </button>
        </div>
      </div>

      <!-- Mode Switcher when Colombian Peso (COP) is active -->
      <div v-if="activeRateKey === 'cucuta_cop'" class="mb-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex gap-1.5">
        <button
          type="button"
          @click="setCopTargetCurrency('VES')"
          class="flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
          :class="copTargetCurrency === 'VES' ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0"></span>
          <span>COP ⇄ VES (Bolívares)</span>
        </button>
        <button
          type="button"
          @click="setCopTargetCurrency('USD')"
          class="flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
          :class="copTargetCurrency === 'USD' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'"
        >
          <span class="w-2 h-2 rounded-full bg-cyan-600 flex-shrink-0"></span>
          <span>COP ⇄ USD (Dólares)</span>
        </button>
      </div>

      <!-- Dual Conversion Inputs Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2.5 items-center mb-4">
        <!-- Input 1: Foreign Currency (or Target if swapped) -->
        <div v-if="conversionDirection === 'FOREIGN_TO_VES'" class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{{ activeRateOption?.currencyCode || 'Divisa' }}</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {{ activeRateOption?.shortLabel }}
            </span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black text-xs font-mono">
              {{ activeRateOption?.symbol || '$' }}
            </div>
            <input
              type="number"
              inputmode="decimal"
              step="any"
              min="0"
              :value="foreignInput"
              @input="e => handleForeignChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pr-14 py-2.5 text-lg font-bold"
              :class="foreignInputPadding"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              {{ activeRateOption?.currencyCode }}
            </div>
          </div>
        </div>

        <!-- Input 1 alternate: Target (VES or USD) when swapped -->
        <div v-else class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{{ targetCurrencyName }}</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">{{ targetCurrencyCode }}</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black text-xs font-mono">
              {{ targetCurrencySymbol }}
            </div>
            <input
              type="number"
              inputmode="decimal"
              step="any"
              min="0"
              :value="vesInput"
              @input="e => handleVesChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pr-14 py-2.5 text-lg font-bold"
              :class="targetInputPadding"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              {{ targetCurrencyCode }}
            </div>
          </div>
        </div>

        <!-- Middle Swap Button -->
        <div class="flex justify-center sm:pt-4">
          <button
            @click="toggleDirection"
            type="button"
            class="comic-button p-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 hover:rotate-180 transition-all duration-300"
            title="Invertir monedas"
          >
            <ArrowLeftRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Input 2: Target (VES or USD) -->
        <div v-if="conversionDirection === 'FOREIGN_TO_VES'" class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{{ targetCurrencyName }}</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">{{ targetCurrencyCode }}</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black text-xs font-mono">
              {{ targetCurrencySymbol }}
            </div>
            <input
              type="number"
              inputmode="decimal"
              step="any"
              min="0"
              :value="vesInput"
              @input="e => handleVesChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pr-14 py-2.5 text-lg font-bold text-emerald-600 dark:text-emerald-400"
              :class="targetInputPadding"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              {{ targetCurrencyCode }}
            </div>
          </div>
        </div>

        <!-- Input 2 alternate: Foreign Currency (when swapped) -->
        <div v-else class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{{ activeRateOption?.currencyCode }}</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {{ activeRateOption?.shortLabel }}
            </span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black text-xs font-mono">
              {{ activeRateOption?.symbol || '$' }}
            </div>
            <input
              type="number"
              inputmode="decimal"
              step="any"
              min="0"
              :value="foreignInput"
              @input="e => handleForeignChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pr-14 py-2.5 text-lg font-bold text-emerald-600 dark:text-emerald-400"
              :class="foreignInputPadding"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              {{ activeRateOption?.currencyCode }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Preset Amount Comic Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 mb-4">
        <span class="text-[11px] font-black text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
          <Zap class="w-3 h-3 text-amber-500" />
          Rápidos:
        </span>
        <button
          v-for="preset in activePresets"
          :key="preset"
          @click="applyPreset(preset)"
          type="button"
          class="comic-button px-2.5 py-0.5 text-xs font-bold"
          :class="
            foreignInput === preset.toString()
              ? 'bg-emerald-400 text-slate-950 font-black'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'
          "
        >
          {{ formatPresetLabel(preset) }}
        </button>
      </div>
    </div>

    <!-- Comic Formula Tag Box -->
    <div class="p-2.5 rounded-xl border-2 border-slate-900 bg-emerald-50 dark:bg-slate-950 dark:border-slate-300/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-[11px] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
      <div class="flex items-center gap-1.5 flex-wrap">
        <template v-if="activeRateKey === 'cucuta_cop'">
          <span v-if="copTargetCurrency === 'USD'" class="font-mono font-black text-slate-900 dark:text-white">
            1 USD = {{ formatNumber(Math.round((activeRateOption?.sell || 3200) / 100) * 100, 0) }} COP
          </span>
          <span v-else class="font-mono font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
            <span>1 COP = Bs. {{ formatNumber(activeRateOption?.rate || 0, 4) }}</span>
            <span class="comic-badge bg-white dark:bg-slate-900 text-slate-900 dark:text-white !py-0 !text-[9px]">
              1 Bs. = {{ activeRateOption?.buy }} COP
            </span>
          </span>
        </template>
        <template v-else>
          <span class="font-black text-emerald-600 dark:text-emerald-400">1 {{ activeRateOption?.currencyCode }}</span>
          <span class="text-slate-500">=</span>
          <span class="font-mono font-black text-slate-900 dark:text-white">
            Bs. {{ formatNumber(activeRateOption?.rate || 0) }}
          </span>
        </template>
      </div>
      <div class="font-bold text-slate-500 dark:text-slate-400 text-[10px] whitespace-nowrap">
        {{ activeRateOption?.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, watch } from 'vue';
import { ArrowLeftRight, Copy, Check, Zap } from 'lucide-vue-next';
import type { RatesResponse, RateKey } from '../types/rates';
import { useConverter } from '../composables/useConverter';

interface Props {
  rates: RatesResponse | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'rateChange', key: RateKey): void;
}>();
const ratesRef = toRef(props, 'rates');

// Initialize converter composable using reactive rates prop ref
const {
  activeRateKey,
  activeRateOption,
  rateOptions,
  foreignInput,
  vesInput,
  conversionDirection,
  copTargetCurrency,
  activePresets,
  hasCopied,
  handleForeignChange,
  handleVesChange,
  selectRate,
  setCopTargetCurrency,
  toggleDirection,
  applyPreset,
  copyResultToClipboard,
} = useConverter(ratesRef);

const targetCurrencyCode = computed<string>(() => {
  if (activeRateKey.value === 'cucuta_cop' && copTargetCurrency.value === 'USD') {
    return 'USD';
  }
  return 'VES';
});

const targetCurrencyName = computed<string>(() => {
  if (activeRateKey.value === 'cucuta_cop' && copTargetCurrency.value === 'USD') {
    return 'Dólares (USD)';
  }
  return 'Bolívares (VES)';
});

const targetCurrencySymbol = computed<string>(() => {
  if (activeRateKey.value === 'cucuta_cop' && copTargetCurrency.value === 'USD') {
    return '$';
  }
  return 'Bs.';
});

const foreignInputPadding = computed<string>(() => {
  return activeRateKey.value === 'cucuta_cop' ? 'pl-14 sm:pl-16' : 'pl-8 sm:pl-9';
});

const targetInputPadding = computed<string>(() => {
  return targetCurrencyCode.value === 'VES' ? 'pl-10 sm:pl-11' : 'pl-8 sm:pl-9';
});

/**
 * Format localized Venezuelan currency.
 */
const formatNumber = (val: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals === 4 ? 4 : 2,
  }).format(val);
};

const formatPresetLabel = (preset: number): string => {
  if (activeRateKey.value === 'cucuta_cop') {
    return `${preset / 1000}k`;
  }
  return `${activeRateOption.value?.symbol || '$'}${preset}`;
};

// Keep parent synchronized whenever active rate changes
watch(
  activeRateKey,
  (newKey) => {
    emit('rateChange', newKey);
  },
  { immediate: true }
);

// Expose selectRate so parent can programmatically select rate on card click
defineExpose({
  selectRate,
  activeRateKey,
});
</script>
