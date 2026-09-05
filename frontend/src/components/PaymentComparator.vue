<template>
  <div class="comic-panel p-4 sm:p-6 h-full flex flex-col justify-between">
    <div>
      <!-- Comic Panel Header -->
      <div class="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b-2 border-slate-900/10 dark:border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-400 text-slate-950 border-2 border-slate-900 flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex-shrink-0">
            🛍️
          </div>
          <div>
            <h2 class="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              ¿Cómo Conviene Pagar?
            </h2>
            <p class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Compara precio en tienda (BCV) vs USDT
            </p>
          </div>
        </div>

        <!-- Copy Comic Button -->
        <button
          @click="copyComparison"
          class="comic-button px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs flex items-center gap-1 transition-all flex-shrink-0"
          :class="
            hasCopied
              ? 'bg-cyan-400 text-slate-950'
              : 'bg-cyan-300 text-slate-950 dark:bg-cyan-400 hover:bg-cyan-200'
          "
        >
          <Check v-if="hasCopied" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <Copy v-else class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{{ hasCopied ? '¡COPIADO!' : 'COPIAR' }}</span>
        </button>
      </div>

      <!-- Store Price Input -->
      <div class="mb-3 sm:mb-4">
        <label class="block text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-black mb-1.5">
          Precio en tienda (Dólares BCV):
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-black">
            $
          </div>
          <input
            type="number"
            step="any"
            min="1"
            v-model="storePriceInput"
            placeholder="Ej: 100"
            class="comic-input w-full pl-7 pr-14 sm:pr-16 py-2 sm:py-2.5 text-base sm:text-lg font-bold"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400">
            USD BCV
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-2">
          <span class="text-[10px] font-black text-slate-500 dark:text-slate-400">Rápidos:</span>
          <button
            v-for="amt in [20, 50, 100, 150, 200]"
            :key="amt"
            @click="storePriceInput = amt.toString()"
            type="button"
            class="comic-button px-2 py-0.5 text-xs font-bold"
            :class="
              storePriceInput === amt.toString()
                ? 'bg-cyan-400 text-slate-950 font-black'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            "
          >
            ${{ amt }}
          </button>
        </div>
      </div>

      <!-- Comic Battle Grid: Efectivo VS Bolívares con USDT -->
      <div class="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
        <!-- Option A: Dólares Efectivo -->
        <div class="p-2.5 sm:p-3 rounded-xl border-2 border-slate-900 bg-white dark:bg-slate-950 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:border-slate-300/80">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[9px] sm:text-[10px] font-black uppercase text-slate-500">
              En Efectivo
            </span>
            <span class="text-[8px] sm:text-[9px] font-bold px-1.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Físico
            </span>
          </div>
          <div class="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white truncate">
            ${{ formatNumber(numericPrice, 0) }}
          </div>
          <span class="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
            Billete directo
          </span>
        </div>

        <!-- Option B: Bolívares con USDT -->
        <div class="p-2.5 sm:p-3 rounded-xl border-2 border-slate-900 bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-400 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(16,185,129,1)] sm:shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400">
              Vía USDT (VES)
            </span>
            <span class="comic-badge !px-1 !py-0 !text-[8px] bg-emerald-400 text-slate-950">
              MEJOR
            </span>
          </div>
          <div class="text-lg sm:text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 truncate">
            {{ formatNumber(realUsdtNeeded, 2) }} ₮
          </div>
          <span class="text-[9px] sm:text-[10px] text-emerald-800 dark:text-emerald-400 font-bold mt-1 truncate">
            = Bs. {{ formatNumber(totalVesToPay, 0) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Comic Speech Bubble Verdict -->
    <div class="p-2.5 sm:p-3.5 rounded-xl border-2 border-slate-900 bg-amber-300 dark:bg-amber-400 text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] sm:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-0.5 sm:space-y-1">
      <div class="flex items-center gap-1.5 font-black text-[11px] sm:text-xs uppercase tracking-tight">
        <Sparkles class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>¡Veredicto: Paga en Bolívares!</span>
      </div>
      <p class="text-[11px] sm:text-xs font-bold leading-snug">
        Ahorras <span class="underline font-black">${{ formatNumber(savingsAmount, 2) }} USDT</span> (un <span class="font-black">{{ formatNumber(savingsPercentage, 1) }}% de descuento</span> real comparado con pagar en efectivo).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sparkles, Check, Copy } from 'lucide-vue-next';
import type { RatesResponse } from '../types/rates';

interface Props {
  rates: RatesResponse | null;
}

const props = defineProps<Props>();

const storePriceInput = ref<string>('100');
const hasCopied = ref<boolean>(false);

const numericPrice = computed<number>(() => {
  const val = parseFloat(storePriceInput.value);
  return isNaN(val) || val <= 0 ? 0 : val;
});

const bcvRate = computed<number>(() => {
  return props.rates?.bcvUsd.rate || 807.3862;
});

const usdtRate = computed<number>(() => {
  return props.rates?.binanceUsdt.rate || 965.50;
});

/**
 * Amount in Bolivares to pay at the cash register (Precio * Tasa BCV).
 */
const totalVesToPay = computed<number>(() => {
  return numericPrice.value * bcvRate.value;
});

/**
 * Real amount in USDT needed to buy that amount of Bolivares on Binance (VES / Tasa USDT).
 */
const realUsdtNeeded = computed<number>(() => {
  if (usdtRate.value <= 0) return 0;
  return totalVesToPay.value / usdtRate.value;
});

/**
 * Difference in dollars between nominal price and real USDT cost.
 */
const savingsAmount = computed<number>(() => {
  const diff = numericPrice.value - realUsdtNeeded.value;
  return diff > 0 ? diff : 0;
});

/**
 * Percentage of savings compared to paying in direct cash.
 */
const savingsPercentage = computed<number>(() => {
  if (numericPrice.value <= 0) return 0;
  return (savingsAmount.value / numericPrice.value) * 100;
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

/**
 * Copy comparison breakdown to clipboard.
 */
const copyComparison = async (): Promise<void> => {
  const text = 
`🛍️ CupVE - ¿Cómo Conviene Pagar?:
• Precio en tienda: $${formatNumber(numericPrice.value, 0)} (Tasa BCV: Bs. ${formatNumber(bcvRate.value, 2)})
• Total en Bolívares: Bs. ${formatNumber(totalVesToPay.value, 2)}
• En USDT Binance: ${formatNumber(realUsdtNeeded.value, 2)} USDT (Tasa: Bs. ${formatNumber(usdtRate.value, 2)})
💥 Veredicto: ¡Paga en Bolívares! Ahorras $${formatNumber(savingsAmount.value, 2)} USD (${formatNumber(savingsPercentage.value, 1)}% menos que pagar en efectivo).`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    hasCopied.value = true;
    setTimeout(() => {
      hasCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy comparison:', err);
  }
};
</script>
