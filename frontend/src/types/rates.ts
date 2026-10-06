/**
 * TypeScript interface representing a single currency exchange rate monitor item.
 */
export interface RateItem {
  name: string;
  currency: string;
  symbol: string;
  rate: number;
  buy?: number | null;
  sell?: number | null;
  source: string;
  lastUpdated: string;
}

/**
 * Interface representing the complete rates payload received from FastAPI backend.
 */
export interface RatesResponse {
  bcvUsd: RateItem;
  bcvEur: RateItem;
  binanceUsdt: RateItem;
  cucutaCop: RateItem;
  cachedAt: string;
  cacheTtlSeconds: number;
}

/**
 * Key identifiers for exchange rate calculation sources (BCV USD, BCV EUR, Binance USDT, Cucuta COP).
 */
export type RateKey = 'bcv_usd' | 'bcv_eur' | 'binance_usdt' | 'cucuta_cop';

/**
 * Selectable rate option structure for converter selector chips.
 */
export interface RateOption {
  key: RateKey;
  label: string;
  shortLabel: string;
  currencyCode: 'USD' | 'EUR' | 'USDT' | 'COP';
  symbol: string;
  rate: number;
  category: 'BCV' | 'Binance P2P' | 'Cúcuta';
  buy?: number | null;
  sell?: number | null;
}

/**
 * Direction enum representing the active conversion flow.
 */
export type ConversionDirection = 'FOREIGN_TO_VES' | 'VES_TO_FOREIGN';
