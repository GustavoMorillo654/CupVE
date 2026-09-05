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

      <!-- Rate Selection Comic Chips (3 rates) -->
      <div class="mb-3 sm:mb-4">
        <label class="block text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-black mb-1.5">
          Tasa aplicada:
        </label>
        <div class="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            v-for="opt in rateOptions"
            :key="opt.key"
            @click="selectRate(opt.key)"
            type="button"
            class="comic-button py-1.5 px-1 sm:py-2 sm:px-2 text-xs flex flex-col items-center justify-center gap-0.5 transition-all text-center"
            :class="
              activeRateKey === opt.key
                ? 'bg-emerald-400 text-slate-950 !border-slate-900 !shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:!shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            "
          >
            <div class="font-black text-[11px] sm:text-xs flex items-center gap-1">
              <span>{{ opt.symbol }}</span>
              <span class="truncate">{{ opt.shortLabel }}</span>
            </div>
            <span class="text-[9px] sm:text-[10px] font-mono font-bold opacity-85">
              Bs. {{ formatNumber(opt.rate) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Dual Conversion Inputs Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2.5 items-center mb-4">
        <!-- Input 1: Foreign Currency (or Bolivares if swapped) -->
        <div v-if="conversionDirection === 'FOREIGN_TO_VES'" class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{{ activeRateOption?.currencyCode || 'Divisa' }}</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {{ activeRateOption?.shortLabel }}
            </span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black">
              {{ activeRateOption?.symbol || '$' }}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              :value="foreignInput"
              @input="e => handleForeignChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pl-7 pr-12 py-2.5 text-lg font-bold"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              {{ activeRateOption?.currencyCode }}
            </div>
          </div>
        </div>

        <!-- Input 1 alternate: VES (when swapped) -->
        <div v-else class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Bolívares (VES)</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Nacional</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black">
              Bs.
            </div>
            <input
              type="number"
              step="any"
              min="0"
              :value="vesInput"
              @input="e => handleVesChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pl-10 pr-12 py-2.5 text-lg font-bold"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              VES
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

        <!-- Input 2: Bolivares (or Foreign Currency if swapped) -->
        <div v-if="conversionDirection === 'FOREIGN_TO_VES'" class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Equivalente (VES)</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Nacional</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black">
              Bs.
            </div>
            <input
              type="number"
              step="any"
              min="0"
              :value="vesInput"
              @input="e => handleVesChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pl-10 pr-12 py-2.5 text-lg font-bold text-emerald-600 dark:text-emerald-400"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
              VES
            </div>
          </div>
        </div>

        <!-- Input 2 alternate: Foreign Currency (when swapped) -->
        <div v-else class="flex flex-col gap-1">
          <label class="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Equivalente ({{ activeRateOption?.currencyCode }})</span>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {{ activeRateOption?.shortLabel }}
            </span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black">
              {{ activeRateOption?.symbol || '$' }}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              :value="foreignInput"
              @input="e => handleForeignChange((e.target as HTMLInputElement).value)"
              placeholder="0.00"
              class="comic-input w-full pl-7 pr-12 py-2.5 text-lg font-bold text-emerald-600 dark:text-emerald-400"
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
          v-for="preset in [5, 10, 20, 50, 100]"
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
          {{ activeRateOption?.symbol }}{{ preset }}
        </button>
      </div>
    </div>

    <!-- Comic Formula Tag Box -->
    <div class="p-2.5 rounded-xl border-2 border-slate-900 bg-emerald-50 dark:bg-slate-950 dark:border-slate-300/80 flex items-center justify-between gap-2 text-[11px] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
      <div class="flex items-center gap-1.5">
        <span class="font-black text-emerald-600 dark:text-emerald-400">1 {{ activeRateOption?.currencyCode }}</span>
        <span class="text-slate-500">=</span>
        <span class="font-mono font-black text-slate-900 dark:text-white">
          Bs. {{ formatNumber(activeRateOption?.rate || 0) }}
        </span>
      </div>
      <div class="font-bold text-slate-500 dark:text-slate-400 text-[10px]">
        {{ activeRateOption?.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { ArrowLeftRight, Copy, Check, Zap } from 'lucide-vue-next';
import type { RatesResponse } from '../types/rates';
import { useConverter } from '../composables/useConverter';

interface Props {
  rates: RatesResponse | null;
}

const props = defineProps<Props>();
const ratesRef = toRef(props, 'rates');

// Initialize converter composable using reactive rates prop ref
const {
  activeRateKey,
  activeRateOption,
  rateOptions,
  foreignInput,
  vesInput,
  conversionDirection,
  hasCopied,
  handleForeignChange,
  handleVesChange,
  selectRate,
  toggleDirection,
  applyPreset,
  copyResultToClipboard,
} = useConverter(ratesRef);

/**
 * Format localized Venezuelan currency.
 */
const formatNumber = (val: number): string => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(val);
};

// Expose selectRate so parent can programmatically select rate on card click
defineExpose({
  selectRate,
  activeRateKey,
});
</script>
