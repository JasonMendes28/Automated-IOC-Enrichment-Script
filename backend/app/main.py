"""
Automated IOC Enrichment Platform - FastAPI Backend
Main application entry point.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.ioc_routes import router
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Application factory ────────────────────────────────────────────────────────
app = FastAPI(
    title="Automated IOC Enrichment Platform",
    description="SOC automation tool for enriching Indicators of Compromise using public threat intelligence APIs.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(router)

# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    os.makedirs("app/reports", exist_ok=True)
    logger.info("🛡️  IOC Enrichment Platform started")
    logger.info("📖 API docs: http://localhost:8000/docs")


@app.get("/")
async def root():
    return {
        "name": "IOC Enrichment Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
