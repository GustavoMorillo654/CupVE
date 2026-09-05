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
  cachedAt: string;
  cacheTtlSeconds: number;
}

/**
 * Key identifiers for exchange rate calculation sources (simplified to the 3 main rates).
 */
export type RateKey = 'bcv_usd' | 'bcv_eur' | 'binance_usdt';

/**
 * Selectable rate option structure for converter selector chips.
 */
export interface RateOption {
  key: RateKey;
  label: string;
  shortLabel: string;
  currencyCode: 'USD' | 'EUR' | 'USDT';
  symbol: string;
  rate: number;
  category: 'BCV' | 'Binance P2P';
}

/**
 * Direction enum representing the active conversion flow.
 */
export type ConversionDirection = 'FOREIGN_TO_VES' | 'VES_TO_FOREIGN';
