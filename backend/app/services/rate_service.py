import asyncio
from datetime import datetime, timezone
import logging
from typing import Optional, Dict, Any
import httpx

from app.models.rates import RateItem, RatesResponse, ConversionResponse

logger = logging.getLogger(__name__)

# Constants for endpoints and cache settings
CACHE_TTL_SECONDS = 300  # 5 minutes
DOLAR_API_BASE_URL = "https://ve.dolarapi.com/v1"
BINANCE_P2P_SEARCH_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


class RateService:
    """
    Service responsible for fetching, caching, and converting currency exchange rates
    from the Central Bank of Venezuela (BCV) and Binance P2P for USDT.
    """

    def __init__(self):
        self._cached_rates: Optional[RatesResponse] = None
        self._cache_timestamp: Optional[datetime] = None
        self._lock = asyncio.Lock()

    async def _fetch_bcv_rate(self, client: httpx.AsyncClient, currency_path: str, currency_code: str, symbol: str, name: str) -> RateItem:
        """
        Fetch official BCV exchange rate for a given currency (USD or EUR) via DolarApi.
        """
        url = f"{DOLAR_API_BASE_URL}/{currency_path}/oficial"
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        data = response.json()

        rate_value = float(data.get("promedio", 0.0))
        update_time = data.get("fechaActualizacion") or datetime.now(timezone.utc).isoformat()

        return RateItem(
            name=name,
            currency=currency_code,
            symbol=symbol,
            rate=rate_value,
            buy=None,
            sell=None,
            source="Banco Central de Venezuela (BCV)",
            last_updated=update_time,
        )

    async def _fetch_binance_p2p_rates(self, client: httpx.AsyncClient) -> RateItem:
        """
        Fetch Binance P2P market prices for USDT/VES (Buy and Sell ads),
        calculating average, buy, and sell prices from the order book.
        """
        headers = {
            "User-Agent": DEFAULT_USER_AGENT,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Helper to fetch prices for a given tradeType ('BUY' or 'SELL')
        async def fetch_prices_for_type(trade_type: str) -> list[float]:
            payload = {
                "asset": "USDT",
                "fiat": "VES",
                "merchantCheck": False,
                "page": 1,
                "rows": 5,
                "tradeType": trade_type,
            }
            res = await client.post(BINANCE_P2P_SEARCH_URL, json=payload, headers=headers, timeout=12.0)
            res.raise_for_status()
            result_json = res.json()
            items = result_json.get("data", [])
            extracted_prices = [float(item["adv"]["price"]) for item in items if "adv" in item and "price" in item["adv"]]
            return extracted_prices

        # Fetch both buy and sell orders concurrently
        buy_prices, sell_prices = await asyncio.gather(
            fetch_prices_for_type("BUY"),
            fetch_prices_for_type("SELL"),
        )

        if not buy_prices:
            raise ValueError("No Binance P2P BUY prices retrieved")
        if not sell_prices:
            raise ValueError("No Binance P2P SELL prices retrieved")

        # Compute representative top orders (first 3 average)
        top_buy = sum(buy_prices[:3]) / len(buy_prices[:3])
        top_sell = sum(sell_prices[:3]) / len(sell_prices[:3])
        average_rate = round((top_buy + top_sell) / 2.0, 2)

        return RateItem(
            name="Binance USDT",
            currency="USDT",
            symbol="₮",
            rate=average_rate,
            buy=round(top_buy, 2),
            sell=round(top_sell, 2),
            source="Binance P2P",
            last_updated=datetime.now(timezone.utc).isoformat(),
        )

    async def _fetch_cucuta_cop_rates(self, client: httpx.AsyncClient, ves_per_usd: float) -> RateItem:
        """
        Fetch Colombian Peso (COP) market price in USD/USDT from Binance P2P with fallback
        to the official Colombia TRM API, and calculate the border cross-rate with Bolívares.
        """
        cop_per_usd = 3200.0
        headers = {
            "User-Agent": DEFAULT_USER_AGENT,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Try Binance P2P COP first
        try:
            payload = {
                "asset": "USDT",
                "fiat": "COP",
                "merchantCheck": False,
                "page": 1,
                "rows": 5,
                "tradeType": "BUY",
            }
            res = await client.post(BINANCE_P2P_SEARCH_URL, json=payload, headers=headers, timeout=10.0)
            if res.status_code == 200:
                data = res.json().get("data", [])
                prices = [float(item["adv"]["price"]) for item in data if "adv" in item and "price" in item["adv"]]
                if prices:
                    cop_per_usd = sum(prices[:3]) / len(prices[:3])
        except Exception as exc:
            logger.warning("Binance P2P COP fetch failed, trying TRM fallback: %s", exc)
            try:
                trm_url = "https://www.datos.gov.co/resource/32sa-8pi3.json?%24limit=1&%24order=vigenciadesde%20DESC"
                trm_res = await client.get(trm_url, timeout=8.0)
                if trm_res.status_code == 200:
                    trm_data = trm_res.json()
                    if trm_data and "valor" in trm_data[0]:
                        cop_per_usd = float(trm_data[0]["valor"])
            except Exception as trm_exc:
                logger.error("Colombia TRM fallback failed: %s", trm_exc)

        # Round COP per USD directly to nearest multiple of 100
        # (Standard border trading practice in San Cristóbal / Táchira, e.g. 3200, 3100)
        cop_per_usd = float(round(cop_per_usd / 100.0) * 100)

        # Cross-rate calculation:
        # Rate = Bolívares por cada 1 Peso (VES / COP)
        # Buy = Pesos por cada 1 Bolívar (COP / VES, traditional Cúcuta format)
        # Sell = Pesos por cada 1 Dólar (COP / USD, rounded to 100)
        effective_ves_usd = ves_per_usd if ves_per_usd > 0 else 990.0
        ves_per_cop = round(effective_ves_usd / cop_per_usd, 4)
        cop_per_ves = round(cop_per_usd / effective_ves_usd, 2)

        return RateItem(
            name="Peso Cúcuta",
            currency="COP",
            symbol="COP",
            rate=ves_per_cop,
            buy=cop_per_ves,
            sell=cop_per_usd,
            source="Mercado Cúcuta (Frontera)",
            last_updated=datetime.now(timezone.utc).isoformat(),
        )

    async def get_all_rates(self, force_refresh: bool = False) -> RatesResponse:
        """
        Return the current rates, serving from in-memory cache if valid,
        or fetching fresh data from providers when expired or explicitly forced.
        """
        now = datetime.now(timezone.utc)

        # Check if cached response is still fresh
        if (
            not force_refresh
            and self._cached_rates is not None
            and self._cache_timestamp is not None
            and (now - self._cache_timestamp).total_seconds() < CACHE_TTL_SECONDS
        ):
            return self._cached_rates

        async with self._lock:
            # Double check cache inside lock
            if (
                not force_refresh
                and self._cached_rates is not None
                and self._cache_timestamp is not None
                and (now - self._cache_timestamp).total_seconds() < CACHE_TTL_SECONDS
            ):
                return self._cached_rates

            headers = {"User-Agent": DEFAULT_USER_AGENT}
            async with httpx.AsyncClient(headers=headers, timeout=15.0) as client:
                # Fetch base rates concurrently
                bcv_usd_task = self._fetch_bcv_rate(client, "dolares", "USD", "$", "Dólar BCV")
                bcv_eur_task = self._fetch_bcv_rate(client, "euros", "EUR", "€", "Euro BCV")
                binance_task = self._fetch_binance_p2p_rates(client)

                results = await asyncio.gather(bcv_usd_task, bcv_eur_task, binance_task, return_exceptions=True)

                # Handle individual errors with fallback to previous cache if available
                bcv_usd = results[0] if not isinstance(results[0], Exception) else (
                    self._cached_rates.bcv_usd if self._cached_rates else None
                )
                bcv_eur = results[1] if not isinstance(results[1], Exception) else (
                    self._cached_rates.bcv_eur if self._cached_rates else None
                )
                binance_usdt = results[2] if not isinstance(results[2], Exception) else (
                    self._cached_rates.binance_usdt if self._cached_rates else None
                )

                if isinstance(results[0], Exception):
                    logger.error("Failed to fetch BCV USD: %s", results[0])
                if isinstance(results[1], Exception):
                    logger.error("Failed to fetch BCV EUR: %s", results[1])
                if isinstance(results[2], Exception):
                    logger.error("Failed to fetch Binance USDT: %s", results[2])

                # Use representative USD/VES rate for Cúcuta cross-rate
                ref_usd_ves = binance_usdt.rate if binance_usdt else (bcv_usd.rate if bcv_usd else 990.0)
                try:
                    cucuta_cop = await self._fetch_cucuta_cop_rates(client, ref_usd_ves)
                except Exception as cop_exc:
                    logger.error("Failed to fetch Cucuta COP: %s", cop_exc)
                    cucuta_cop = self._cached_rates.cucuta_cop if self._cached_rates else RateItem(
                        name="Peso Cúcuta",
                        currency="COP",
                        symbol="COP",
                        rate=0.3097,
                        buy=3.23,
                        sell=3200.0,
                        source="Mercado Cúcuta (Frontera)",
                        last_updated=now.isoformat(),
                    )

                # If completely empty and failed, raise runtime error
                if bcv_usd is None or bcv_eur is None or binance_usdt is None or cucuta_cop is None:
                    raise RuntimeError("Failed to retrieve exchange rates from external providers.")

                self._cached_rates = RatesResponse(
                    bcv_usd=bcv_usd,
                    bcv_eur=bcv_eur,
                    binance_usdt=binance_usdt,
                    cucuta_cop=cucuta_cop,
                    cached_at=now.isoformat(),
                    cache_ttl_seconds=CACHE_TTL_SECONDS,
                )
                self._cache_timestamp = now
                return self._cached_rates

    async def convert(self, amount: float, from_currency: str, to_currency: str, rate_type: str) -> ConversionResponse:
        """
        Convert an amount between Bolivares (VES), foreign currencies (USD, EUR, USDT),
        and Colombian Pesos (COP).
        """
        rates_data = await self.get_all_rates()

        from_curr = from_currency.upper()
        to_curr = to_currency.upper()

        cop_ves_rate = rates_data.cucuta_cop.rate  # Bolívares por Peso (ej. 0.3097)
        cop_usd_rate = float(round((rates_data.cucuta_cop.sell or 3200.0) / 100.0) * 100)  # Pesos por Dólar redondeado a 100

        # Map rate types to values and human readable names
        rate_mapping: Dict[str, tuple[float, str]] = {
            "bcv_usd": (rates_data.bcv_usd.rate, "Dólar BCV Oficial"),
            "bcv_eur": (rates_data.bcv_eur.rate, "Euro BCV Oficial"),
            "binance_usdt": (rates_data.binance_usdt.rate, "Binance USDT (Promedio)"),
            "binance_usdt_buy": (rates_data.binance_usdt.buy or rates_data.binance_usdt.rate, "Binance USDT (Compra)"),
            "binance_usdt_sell": (rates_data.binance_usdt.sell or rates_data.binance_usdt.rate, "Binance USDT (Venta)"),
            "cucuta_cop": (cop_ves_rate, "Peso Cúcuta (COP / VES)"),
            "cucuta_cop_usd": (cop_usd_rate, "Peso Cúcuta (COP / USD)"),
        }

        selected_rate, rate_label = rate_mapping.get(rate_type, (rates_data.bcv_usd.rate, "Dólar BCV Oficial"))

        # Direct conversions involving COP
        if from_curr == "COP" and to_curr == "VES":
            converted = amount * cop_ves_rate
            applied = cop_ves_rate
            label = "Peso Cúcuta (COP / VES)"
        elif from_curr == "VES" and to_curr == "COP":
            converted = amount / cop_ves_rate if cop_ves_rate > 0 else 0.0
            applied = cop_ves_rate
            label = "Peso Cúcuta (COP / VES)"
        elif from_curr == "COP" and to_curr == "USD":
            converted = amount / cop_usd_rate if cop_usd_rate > 0 else 0.0
            applied = cop_usd_rate
            label = "Peso Cúcuta (COP / USD)"
        elif from_curr == "USD" and to_curr == "COP":
            converted = amount * cop_usd_rate
            applied = cop_usd_rate
            label = "Peso Cúcuta (COP / USD)"
        elif from_curr == to_curr:
            converted = amount
            applied = 1.0
            label = "Misma Divisa"
        elif from_curr != "VES" and to_curr == "VES":
            converted = amount * selected_rate
            applied = selected_rate
            label = rate_label
        elif from_curr == "VES" and to_curr != "VES":
            converted = amount / selected_rate if selected_rate > 0 else 0.0
            applied = selected_rate
            label = rate_label
        else:
            # Conversion between two foreign currencies via VES
            ves_value = amount * selected_rate
            target_rate = rates_data.bcv_eur.rate if to_curr == "EUR" else rates_data.bcv_usd.rate
            converted = ves_value / target_rate if target_rate > 0 else 0.0
            applied = selected_rate
            label = rate_label

        return ConversionResponse(
            original_amount=round(amount, 4),
            converted_amount=round(converted, 4),
            from_currency=from_curr,
            to_currency=to_curr,
            applied_rate=applied,
            rate_name=label,
        )


# Singleton instance to share cache across application
rate_service = RateService()
