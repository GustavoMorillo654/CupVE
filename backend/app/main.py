from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.rates import router as rates_router
from app.services.rate_service import rate_service

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cupve-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Pre-warms the rates cache on startup so initial client requests respond instantly.
    """
    logger.info("Initializing CupVE API service...")
    try:
        # Pre-warm cache in background during server start
        await rate_service.get_all_rates(force_refresh=True)
        logger.info("Exchange rates cache successfully pre-warmed.")
    except Exception as exc:
        logger.warning("Could not pre-warm cache on startup: %s. Will retry on first request.", exc)
    yield
    logger.info("Shutting down CupVE API service...")


app = FastAPI(
    title="CupVE Exchange API",
    description="API for Venezuelan Central Bank (BCV) official rates and Binance P2P USDT rates with real-time conversion.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(rates_router)


@app.get("/")
async def root():
    """
    Welcome endpoint providing quick links to API documentation and rate endpoint.
    """
    return {
        "name": "CupVE Exchange Rates API",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "rates": "/api/rates",
            "convert": "/api/convert",
            "health": "/api/health",
        },
    }
