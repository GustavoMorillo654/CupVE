from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RateItem(BaseModel):
    """
    Represents a single currency exchange rate item with source and timing details.
    """
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    name: str = Field(..., description="Display name of the currency or monitor")
    currency: str = Field(..., description="Currency code (USD, EUR, USDT, VES)")
    symbol: str = Field(..., description="Currency symbol ($, €, ₮, Bs.)")
    rate: float = Field(..., description="Main reference exchange rate in Bolivares (VES)")
    buy: Optional[float] = Field(None, description="Buy price if applicable (e.g., Binance P2P Buy)")
    sell: Optional[float] = Field(None, description="Sell price if applicable (e.g., Binance P2P Sell)")
    source: str = Field(..., description="Data provider or authority name")
    last_updated: str = Field(..., alias="lastUpdated", description="ISO 8601 formatted update timestamp")


class RatesResponse(BaseModel):
    """
    Container response containing all tracked exchange rates and cache metadata.
    """
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    bcv_usd: RateItem = Field(..., alias="bcvUsd")
    bcv_eur: RateItem = Field(..., alias="bcvEur")
    binance_usdt: RateItem = Field(..., alias="binanceUsdt")
    cached_at: str = Field(..., alias="cachedAt", description="Timestamp when cache was generated")
    cache_ttl_seconds: int = Field(..., alias="cacheTtlSeconds", description="Cache time-to-live in seconds")


class ConversionRequest(BaseModel):
    """
    Payload for calculating currency conversions.
    """
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    amount: float = Field(..., gt=0, description="Amount to convert, must be positive")
    from_currency: str = Field(..., alias="fromCurrency", description="Source currency code: USD, EUR, USDT, or VES")
    to_currency: str = Field(..., alias="toCurrency", description="Target currency code: USD, EUR, USDT, or VES")
    rate_type: str = Field("bcv_usd", alias="rateType", description="Key identifying which rate to apply")


class ConversionResponse(BaseModel):
    """
    Calculation result of a currency conversion.
    """
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    original_amount: float = Field(..., alias="originalAmount")
    converted_amount: float = Field(..., alias="convertedAmount")
    from_currency: str = Field(..., alias="fromCurrency")
    to_currency: str = Field(..., alias="toCurrency")
    applied_rate: float = Field(..., alias="appliedRate")
    rate_name: str = Field(..., alias="rateName")
