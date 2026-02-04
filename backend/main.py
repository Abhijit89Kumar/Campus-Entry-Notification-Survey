"""
Campus Entry Survey Analytics - FastAPI Backend

A comprehensive API for analyzing student survey responses about
campus entry/exit monitoring policies.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import (
    API_HOST,
    API_PORT,
    DEBUG,
    CORS_ORIGINS
)
from routers import data_router, analytics_router
from services.sheets import sheets_service

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Campus Entry Survey Analytics API...")
    
    # Pre-fetch data to warm up cache
    try:
        df = sheets_service.fetch_raw_data()
        logger.info(f"Loaded {len(df)} responses from Google Sheets")
    except Exception as e:
        logger.warning(f"Could not pre-fetch data: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API...")


# Create FastAPI app
app = FastAPI(
    title="Campus Entry Survey Analytics API",
    description="""
    API for analyzing student survey responses about campus entry/exit monitoring policies.
    
    ## Features
    
    - **Data Access**: Fetch and filter survey responses
    - **Analytics**: Executive summaries, demographic breakdowns, cross-tabulations
    - **NLP Analysis**: Concern classification, argument extraction, quality scoring
    - **Temporal Analysis**: Response patterns over time
    
    ## Authentication
    
    Currently no authentication required (internal use only).
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
# In production (Render/Vercel), allow all origins; locally, use configured origins
import os
is_production = os.getenv("RENDER") or os.getenv("VERCEL") or not DEBUG
cors_origins = ["*"] if is_production else CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(data_router)
app.include_router(analytics_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Campus Entry Survey Analytics API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "data": "/api/data",
            "analytics": "/api/analytics"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check Google Sheets connection
        count = sheets_service.get_response_count()
        sheets_status = "connected"
    except Exception as e:
        count = 0
        sheets_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "google_sheets": sheets_status,
        "response_count": count
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=DEBUG
    )
