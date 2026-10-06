import { ref, computed, watch, type Ref } from 'vue';
import type { RatesResponse, RateKey, RateOption, ConversionDirection } from '../types/rates';

/**
 * Composable providing reactive state and operations for real-time bidirectional currency conversion,
 * including official BCV rates, Binance USDT, and Colombian Peso (COP) border rates.
 * @param ratesRef - Reactive Ref to current exchange rates.
 */
export function useConverter(ratesRef: Ref<RatesResponse | null>) {
  const activeRateKey = ref<RateKey>('bcv_usd');
  const foreignInput = ref<string>('20');
  const vesInput = ref<string>('');
  const lastEditedField = ref<'foreign' | 'ves'>('foreign');
  const conversionDirection = ref<ConversionDirection>('FOREIGN_TO_VES');
  const hasCopied = ref<boolean>(false);
  // Toggle for Colombian Peso target: 'VES' (COP ⇄ VES) or 'USD' (COP ⇄ USD)
  const copTargetCurrency = ref<'VES' | 'USD'>('VES');

  /**
   * Available rate options (BCV USD, BCV EUR, Binance USDT Promedio, and Peso Cúcuta COP).
   */
  const rateOptions = computed<RateOption[]>(() => {
    const data = ratesRef.value;
    if (!data) return [];

    const options: RateOption[] = [
      {
        key: 'bcv_usd',
        label: 'Dólar Oficial (BCV)',
        shortLabel: 'BCV USD',
        currencyCode: 'USD',
        symbol: '$',
        rate: data.bcvUsd.rate,
        category: 'BCV',
      },
      {
        key: 'bcv_eur',
        label: 'Euro Oficial (BCV)',
        shortLabel: 'BCV EUR',
        currencyCode: 'EUR',
        symbol: '€',
        rate: data.bcvEur.rate,
        category: 'BCV',
      },
      {
        key: 'binance_usdt',
        label: 'Binance USDT (Promedio)',
        shortLabel: 'USDT Prom',
        currencyCode: 'USDT',
        symbol: '₮',
        rate: data.binanceUsdt.rate,
        category: 'Binance P2P',
      },
      {
        key: 'cucuta_cop',
        label: 'Peso Cúcuta (Frontera)',
        shortLabel: 'Peso COP',
        currencyCode: 'COP',
        symbol: 'COP',
        rate: data.cucutaCop.rate,
        category: 'Cúcuta',
        buy: data.cucutaCop.buy,
        sell: data.cucutaCop.sell,
      },
    ];

    return options;
  });

  /**
   * Currently active RateOption object.
   */
  const activeRateOption = computed<RateOption | undefined>(() => {
    return rateOptions.value.find((opt) => opt.key === activeRateKey.value) || rateOptions.value[0];
  });

  /**
   * Dynamic preset buttons adapting to active currency:
   * For COP: 20k, 50k, 100k, 200k, 500k.
   * For USD/EUR/USDT: $5, $10, $20, $50, $100.
   */
  const activePresets = computed<number[]>(() => {
    if (activeRateKey.value === 'cucuta_cop') {
      return [20000, 50000, 100000, 200000, 500000];
    }
    return [5, 10, 20, 50, 100];
  });

  /**
   * Current rate value applied in calculations.
   */
  const currentRateValue = computed<number>(() => {
    if (!activeRateOption.value) return 1;
    if (activeRateKey.value === 'cucuta_cop' && copTargetCurrency.value === 'USD') {
      return activeRateOption.value.sell || 3205.0; // COP per USD
    }
    return activeRateOption.value.rate;
  });

  /**
   * Recalculates the opposite input based on which input was modified last.
   */
  const recalculate = (): void => {
    const data = ratesRef.value;
    if (!data) return;

    if (activeRateKey.value === 'cucuta_cop') {
      const copVesRate = data.cucutaCop.rate || 0.3097; // Bolívares por Peso
      const copUsdRate = data.cucutaCop.sell ? Math.round(data.cucutaCop.sell / 100) * 100 : 3200.0; // Pesos por Dólar (redondeado a 100)

      if (copTargetCurrency.value === 'USD') {
        // Mode COP ⇄ USD
        if (lastEditedField.value === 'foreign') {
          const parsedCop = parseFloat(foreignInput.value);
          if (isNaN(parsedCop) || foreignInput.value.trim() === '') {
            vesInput.value = '';
          } else {
            const usd = parsedCop / copUsdRate;
            vesInput.value = Number(usd.toFixed(2)).toString();
          }
        } else {
          const parsedUsd = parseFloat(vesInput.value);
          if (isNaN(parsedUsd) || vesInput.value.trim() === '') {
            foreignInput.value = '';
          } else {
            const cop = parsedUsd * copUsdRate;
            foreignInput.value = Number(cop.toFixed(0)).toString();
          }
        }
      } else {
        // Mode COP ⇄ VES
        if (lastEditedField.value === 'foreign') {
          const parsedCop = parseFloat(foreignInput.value);
          if (isNaN(parsedCop) || foreignInput.value.trim() === '') {
            vesInput.value = '';
          } else {
            const ves = parsedCop * copVesRate;
            vesInput.value = Number(ves.toFixed(2)).toString();
          }
        } else {
          const parsedVes = parseFloat(vesInput.value);
          if (isNaN(parsedVes) || vesInput.value.trim() === '') {
            foreignInput.value = '';
          } else {
            const cop = parsedVes / copVesRate;
            foreignInput.value = Number(cop.toFixed(0)).toString();
          }
        }
      }
      return;
    }

    // Standard currencies (USD, EUR, USDT ⇄ VES)
    const rate = currentRateValue.value;
    if (!rate || rate <= 0) return;

    if (lastEditedField.value === 'foreign') {
      const parsedForeign = parseFloat(foreignInput.value);
      if (isNaN(parsedForeign) || foreignInput.value.trim() === '') {
        vesInput.value = '';
      } else {
        const calculatedVes = parsedForeign * rate;
        vesInput.value = Number(calculatedVes.toFixed(2)).toString();
      }
    } else {
      const parsedVes = parseFloat(vesInput.value);
      if (isNaN(parsedVes) || vesInput.value.trim() === '') {
        foreignInput.value = '';
      } else {
        const calculatedForeign = parsedVes / rate;
        foreignInput.value = Number(calculatedForeign.toFixed(2)).toString();
      }
    }
  };

  /**
   * Event handler when user modifies the foreign currency amount.
   */
  const handleForeignChange = (value: string): void => {
    foreignInput.value = value;
    lastEditedField.value = 'foreign';
    recalculate();
  };

  /**
   * Event handler when user modifies the second amount (VES or USD in COP mode).
   */
  const handleVesChange = (value: string): void => {
    vesInput.value = value;
    lastEditedField.value = 'ves';
    recalculate();
  };

  /**
   * Select a different exchange rate provider.
   */
  const selectRate = (key: RateKey): void => {
    const previousKey = activeRateKey.value;
    activeRateKey.value = key;

    // Adjust default input value when switching between COP and standard currencies
    if (key === 'cucuta_cop' && previousKey !== 'cucuta_cop') {
      if (parseFloat(foreignInput.value) < 1000) {
        foreignInput.value = '100000';
      }
    } else if (key !== 'cucuta_cop' && previousKey === 'cucuta_cop') {
      if (parseFloat(foreignInput.value) >= 1000) {
        foreignInput.value = '20';
      }
    }

    lastEditedField.value = 'foreign';
    recalculate();
  };

  /**
   * Toggle COP target pair between VES and USD.
   */
  const setCopTargetCurrency = (target: 'VES' | 'USD'): void => {
    copTargetCurrency.value = target;
    recalculate();
  };

  /**
   * Swap the visual order / direction of conversion.
   */
  const toggleDirection = (): void => {
    conversionDirection.value =
      conversionDirection.value === 'FOREIGN_TO_VES' ? 'VES_TO_FOREIGN' : 'FOREIGN_TO_VES';
  };

  /**
   * Quick preset button click handler.
   */
  const applyPreset = (amount: number): void => {
    lastEditedField.value = 'foreign';
    foreignInput.value = amount.toString();
    recalculate();
  };

  /**
   * Copies formatted conversion result to clipboard with visual feedback.
   */
  const copyResultToClipboard = async (): Promise<void> => {
    if (!activeRateOption.value) return;

    const foreignVal = foreignInput.value || '0';
    const vesVal = vesInput.value || '0';
    const curr = activeRateOption.value.currencyCode;
    const rateName = activeRateOption.value.label;

    let textToCopy = '';
    if (activeRateKey.value === 'cucuta_cop') {
      const data = ratesRef.value;
      if (copTargetCurrency.value === 'USD') {
        const copUsd = data?.cucutaCop.sell?.toLocaleString('es-VE', { maximumFractionDigits: 2 }) || '3.205';
        textToCopy = `${foreignVal} COP = $${vesVal} USD (Tasa ${rateName}: 1 USD = ${copUsd} COP)`;
      } else {
        const copVes = data?.cucutaCop.rate?.toLocaleString('es-VE', { minimumFractionDigits: 4 }) || '0,3097';
        const vesCop = data?.cucutaCop.buy?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || '3,23';
        textToCopy = `${foreignVal} COP = Bs. ${vesVal} VES (Tasa ${rateName}: 1 COP = Bs. ${copVes} / 1 Bs. = ${vesCop} COP)`;
      }
    } else {
      const rateVal = activeRateOption.value.rate.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      textToCopy = `${foreignVal} ${curr} = ${vesVal} VES (Tasa ${rateName}: ${rateVal})`;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
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
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Recalculate whenever rates finish loading
  watch(
    () => ratesRef.value,
    () => {
      recalculate();
    },
    { immediate: true }
  );

  return {
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
  };
}
