"""
routes/ioc.py
─────────────
FastAPI router – all /api/ioc/* endpoints.

POST /api/ioc/upload   – accept a TXT/CSV file, enrich, return JSON
POST /api/ioc/enrich   – accept a JSON list of IOCs, enrich, return JSON
GET  /api/ioc/health   – simple liveness probe
"""

from __future__ import annotations
import uuid
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.models.ioc import EnrichmentRequest, EnrichmentResponse
from app.services.enrichment import enrich_batch, enrich_list
from app.services.report_generator import generate_csv, generate_markdown

logger   = logging.getLogger(__name__)
router   = APIRouter(prefix="/api/ioc", tags=["IOC Enrichment"])

# In-memory session store (replaced by a DB in production)
_sessions: dict[str, EnrichmentResponse] = {}


@router.get("/health")
async def health():
    """Liveness check."""
    return {"status": "ok", "service": "IOC Enrichment Platform"}


@router.post("/upload", response_model=EnrichmentResponse)
async def upload_ioc_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Accept a plain-text or CSV file containing one IOC per line.
    Returns enrichment results and stores them under a session_id.
    """
    if file.content_type not in (
        "text/plain", "text/csv", "application/octet-stream",
        "application/vnd.ms-excel", None,
    ):
        raise HTTPException(
            status_code=415,
            detail="Only .txt or .csv files are accepted.",
        )

    raw_bytes = await file.read()
    try:
        raw_text = raw_bytes.decode("utf-8", errors="replace")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot decode file: {exc}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    session_id = uuid.uuid4().hex
    logger.info("Starting enrichment session %s for file '%s'", session_id, file.filename)

    try:
        response = await enrich_batch(raw_text)
    except Exception as exc:
        logger.exception("Enrichment failed for session %s", session_id)
        raise HTTPException(status_code=500, detail=f"Enrichment error: {exc}")

    _sessions[session_id] = response

    # Generate reports asynchronously so we don't block the response
    background_tasks.add_task(generate_csv,      response, session_id)
    background_tasks.add_task(generate_markdown, response, session_id)

    # Attach session_id to the response headers for the frontend to store
    content = response.model_dump(mode="json")
    content["session_id"] = session_id
    return JSONResponse(content=content)


@router.post("/enrich", response_model=EnrichmentResponse)
async def enrich_json(
    body: EnrichmentRequest,
    background_tasks: BackgroundTasks,
):
    """
    Accept a JSON body: {"iocs": ["1.2.3.4", "evil.com", ...]}
    Returns enrichment results.
    """
    if not body.iocs:
        raise HTTPException(status_code=400, detail="IOC list is empty.")

    session_id = uuid.uuid4().hex
    try:
        response = await enrich_list(body.iocs)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    _sessions[session_id] = response
    background_tasks.add_task(generate_csv,      response, session_id)
    background_tasks.add_task(generate_markdown, response, session_id)

    content = response.model_dump(mode="json")
    content["session_id"] = session_id
    return JSONResponse(content=content)


@router.get("/session/{session_id}", response_model=EnrichmentResponse)
async def get_session(session_id: str):
    """Retrieve a previously computed enrichment result by session ID."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    return _sessions[session_id]


@router.get("/sessions")
async def list_sessions():
    """Return a summary list of all active sessions (in-memory only)."""
    return [
        {
            "session_id": sid,
            "total":      resp.total,
            "malicious":  resp.malicious,
            "suspicious": resp.suspicious,
            "safe":       resp.safe,
            "analyzed_at": resp.analyzed_at.isoformat(),
        }
        for sid, resp in _sessions.items()
    ]
