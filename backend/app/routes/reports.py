"""
routes/reports.py
─────────────────
Endpoints for downloading generated reports.

GET /api/reports/          – list all report files
GET /api/reports/{filename} – download a specific report
"""

from __future__ import annotations
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/")
async def list_reports():
    """Return metadata for every report file in REPORTS_DIR."""
    files = []
    for p in sorted(settings.REPORTS_DIR.iterdir(), reverse=True):
        if p.suffix in (".csv", ".md"):
            files.append({
                "filename":  p.name,
                "size_kb":   round(p.stat().st_size / 1024, 2),
                "extension": p.suffix,
            })
    return {"reports": files}


@router.get("/{filename}")
async def download_report(filename: str):
    """Stream a report file to the client."""
    # Basic path-traversal guard
    safe_name = Path(filename).name
    path = settings.REPORTS_DIR / safe_name

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found.")

    media_type = (
        "text/csv"   if path.suffix == ".csv"
        else "text/markdown"
    )
    return FileResponse(path, media_type=media_type, filename=safe_name)
