import { ref, computed, watch, type Ref } from 'vue';
import type { RatesResponse, RateKey, RateOption, ConversionDirection } from '../types/rates';

/**
 * Composable providing reactive state and operations for real-time bidirectional currency conversion.
 * @param ratesRef - Reactive Ref to current exchange rates.
 */
export function useConverter(ratesRef: Ref<RatesResponse | null>) {
  const activeRateKey = ref<RateKey>('bcv_usd');
  const foreignInput = ref<string>('20');
  const vesInput = ref<string>('');
  const lastEditedField = ref<'foreign' | 'ves'>('foreign');
  const conversionDirection = ref<ConversionDirection>('FOREIGN_TO_VES');
  const hasCopied = ref<boolean>(false);

  /**
   * Available rate options (BCV USD, BCV EUR, and Binance USDT Promedio).
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
   * Current rate value applied in calculations.
   */
  const currentRateValue = computed<number>(() => {
    return activeRateOption.value ? activeRateOption.value.rate : 1;
  });

  /**
   * Recalculates the opposite input based on which input was modified last.
   */
  const recalculate = (): void => {
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
   * Event handler when user modifies the Bolivares (VES) amount.
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
    activeRateKey.value = key;
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
   * Quick preset button click handler (e.g. $5, $10, $20, $50, $100).
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
    const rateVal = activeRateOption.value.rate.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

    const textToCopy = `${foreignVal} ${curr} = ${vesVal} VES (Tasa ${rateName}: ${rateVal})`;

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
    hasCopied,
    handleForeignChange,
    handleVesChange,
    selectRate,
    toggleDirection,
    applyPreset,
    copyResultToClipboard,
  };
}
