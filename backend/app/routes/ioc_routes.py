"""
IOC Enrichment API Routes.
Handles file upload, enrichment, and report download endpoints.
"""
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.services.enrichment import enrich_iocs
from app.services.report_generator import (
    generate_csv_report, generate_markdown_report, save_analysis_history
)
from app.models.ioc_models import EnrichmentResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["IOC Enrichment"])

# In-memory cache of recent analyses (production would use Redis/DB)
analysis_cache: dict = {}


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "IOC Enrichment Platform"}


@router.post("/enrich", response_model=EnrichmentResponse)
async def enrich_ioc_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="TXT or CSV file containing IOCs (one per line)")
):
    """
    Upload an IOC file and enrich all indicators.
    
    Accepts a plain text file with one IOC per line.
    Supports: IP addresses, domains, URLs, and file hashes.
    """
    # Validate file type
    if not file.filename.endswith((".txt", ".csv")):
        raise HTTPException(
            status_code=400,
            detail="Only .txt and .csv files are supported"
        )

    # Read file content
    content = await file.read()
    try:
        raw_text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="File is empty")

    logger.info(f"Processing file: {file.filename} ({len(raw_text)} chars)")

    # Run enrichment
    response = await enrich_iocs(raw_text)

    # Cache results and schedule background report generation
    analysis_cache[response.analysis_id] = response
    background_tasks.add_task(
        _save_reports_background, response, file.filename
    )

    return response


@router.post("/enrich/text", response_model=EnrichmentResponse)
async def enrich_ioc_text(background_tasks: BackgroundTasks, body: dict):
    """
    Enrich IOCs from raw text (JSON body with 'text' field).
    Alternative to file upload for programmatic access.
    """
    raw_text = body.get("text", "")
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    response = await enrich_iocs(raw_text)
    analysis_cache[response.analysis_id] = response
    background_tasks.add_task(_save_reports_background, response, "manual_input.txt")
    return response


@router.get("/report/{analysis_id}/csv")
async def download_csv_report(analysis_id: str):
    """Download the CSV report for a specific analysis."""
    response = analysis_cache.get(analysis_id)
    if not response:
        raise HTTPException(status_code=404, detail="Analysis not found. Reports are cached for the session.")

    filepath = generate_csv_report(response)
    return FileResponse(
        path=filepath,
        media_type="text/csv",
        filename=f"ioc_report_{analysis_id[:8]}.csv"
    )


@router.get("/report/{analysis_id}/markdown")
async def download_markdown_report(analysis_id: str):
    """Download the Markdown report for a specific analysis."""
    response = analysis_cache.get(analysis_id)
    if not response:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    filepath = generate_markdown_report(response)
    return FileResponse(
        path=filepath,
        media_type="text/markdown",
        filename=f"ioc_report_{analysis_id[:8]}.md"
    )


@router.get("/history")
async def get_analysis_history():
    """Get the list of past analyses from the history file."""
    history_file = Path("app/reports/analysis_history.json")
    if not history_file.exists():
        return []
    try:
        with open(history_file) as f:
            return json.load(f)
    except Exception:
        return []


async def _save_reports_background(response: EnrichmentResponse, filename: str):
    """Background task: generate reports and save history."""
    try:
        generate_csv_report(response)
        generate_markdown_report(response)
        save_analysis_history(response, filename)
    except Exception as e:
        logger.error(f"Background report generation failed: {e}")
