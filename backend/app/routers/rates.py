from fastapi import APIRouter, HTTPException, Query, status
import logging

from app.models.rates import RatesResponse, ConversionRequest, ConversionResponse
from app.services.rate_service import rate_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Rates & Converter"])


@router.get("/rates", response_model=RatesResponse)
async def get_rates(force_refresh: bool = Query(False, description="Force fetching fresh rates from providers")):
    """
    Retrieve all current currency exchange rates (BCV USD, BCV EUR, Binance USDT).
    Returns cached data by default (< 10ms response time) unless expired or forced.
    """
    try:
        rates = await rate_service.get_all_rates(force_refresh=force_refresh)
        return rates
    except Exception as exc:
        logger.exception("Error retrieving exchange rates: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to fetch exchange rates at this time: {str(exc)}",
        )


@router.post("/rates/refresh", response_model=RatesResponse)
async def refresh_rates():
    """
    Manually invalidate cache and fetch fresh exchange rates from providers.
    """
    try:
        return await rate_service.get_all_rates(force_refresh=True)
    except Exception as exc:
        logger.exception("Error refreshing exchange rates: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to refresh rates: {str(exc)}",
        )


@router.post("/convert", response_model=ConversionResponse)
async def convert_currency(request: ConversionRequest):
    """
    Convert an amount between Bolivares (VES) and USD, EUR, or USDT using a specified rate.
    """
    try:
        return await rate_service.convert(
            amount=request.amount,
            from_currency=request.from_currency,
            to_currency=request.to_currency,
            rate_type=request.rate_type,
        )
    except Exception as exc:
        logger.exception("Error performing currency conversion: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Currency conversion failed: {str(exc)}",
        )


@router.get("/health")
async def health_check():
    """
    Service health check endpoint.
    """
    return {"status": "ok", "service": "CupVE Exchange API"}
