import { ref, onMounted, onUnmounted } from 'vue';
import type { RatesResponse } from '../types/rates';

const rates = ref<RatesResponse | null>(null);
const isLoading = ref<boolean>(true);
const isRefreshing = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const secondsUntilRefresh = ref<number>(300);

let countdownInterval: number | undefined;

/**
 * Composable for managing exchange rates fetching, automatic background countdown,
 * and manual refresh triggers.
 */
export function useRates() {
  /**
   * Fetch rates from FastAPI backend.
   * @param force - If true, requests the backend to bypass its cache and fetch fresh rates.
   */
  const fetchRates = async (force: boolean = false): Promise<void> => {
    try {
      if (force) {
        isRefreshing.value = true;
      } else if (!rates.value) {
        isLoading.value = true;
      }
      errorMessage.value = null;

      const endpoint = force ? '/api/rates/refresh' : '/api/rates';
      const method = force ? 'POST' : 'GET';

      const response = await fetch(endpoint, { method });
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data: RatesResponse = await response.json();
      rates.value = data;
      // Reset countdown based on server TTL
      secondsUntilRefresh.value = data.cacheTtlSeconds || 300;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching exchange rates';
      errorMessage.value = msg;
      console.error('Rates fetch error:', err);
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  };

  /**
   * Manual refresh handler triggered by the user clicking the refresh button.
   */
  const refreshManually = async (): Promise<void> => {
    if (isRefreshing.value) return;
    await fetchRates(true);
  };

  /**
   * Starts the 1-second interval countdown timer to track cache freshness.
   */
  const startCountdown = (): void => {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = window.setInterval(() => {
      if (secondsUntilRefresh.value > 0) {
        secondsUntilRefresh.value -= 1;
      } else {
        // Auto-refresh when countdown reaches 0
        fetchRates(false);
      }
    }, 1000);
  };

  /**
   * Format numbers into Venezuelan or international localized currency format (e.g., "1.234,56").
   */
  const formatCurrency = (value: number, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) return '0,00';
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  /**
   * Format ISO date string into readable Venezuelan local time string.
   */
  const formatTimestamp = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return new Intl.DateTimeFormat('es-VE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return isoDate;
    }
  };

  onMounted(() => {
    if (!rates.value) {
      fetchRates();
    }
    startCountdown();
  });

  onUnmounted(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  });

  return {
    rates,
    isLoading,
    isRefreshing,
    errorMessage,
    secondsUntilRefresh,
    fetchRates,
    refreshManually,
    formatCurrency,
    formatTimestamp,
  };
}
