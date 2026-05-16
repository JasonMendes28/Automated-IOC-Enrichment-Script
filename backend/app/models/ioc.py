"""
models/ioc.py
─────────────
Pydantic data models that represent every IOC at each stage of the
enrichment pipeline: raw input → validated → enriched → final report.
"""

from __future__ import annotations
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ── Enumerations ───────────────────────────────────────────────────────────────

class IOCType(str, Enum):
    IP      = "ip"
    DOMAIN  = "domain"
    URL     = "url"
    HASH    = "hash"
    UNKNOWN = "unknown"


class ThreatLevel(str, Enum):
    SAFE        = "safe"
    SUSPICIOUS  = "suspicious"
    MALICIOUS   = "malicious"
    UNKNOWN     = "unknown"


# ── Per-source result blocks ───────────────────────────────────────────────────

class VirusTotalResult(BaseModel):
    """Normalised VirusTotal response for a single IOC."""
    queried: bool             = False
    malicious: int            = 0       # number of engines flagging malicious
    suspicious: int           = 0
    harmless: int             = 0
    undetected: int           = 0
    total_engines: int        = 0
    permalink: Optional[str]  = None
    error: Optional[str]      = None


class AbuseIPDBResult(BaseModel):
    """Normalised AbuseIPDB response (IP only)."""
    queried: bool                    = False
    abuse_confidence_score: int      = 0
    total_reports: int               = 0
    country_code: Optional[str]      = None
    isp: Optional[str]               = None
    domain: Optional[str]            = None
    is_public: bool                  = True
    is_whitelisted: bool             = False
    error: Optional[str]             = None


class OTXResult(BaseModel):
    """Normalised AlienVault OTX response."""
    queried: bool               = False
    pulse_count: int            = 0
    malware_families: list[str] = Field(default_factory=list)
    tags: list[str]             = Field(default_factory=list)
    threat_score: int           = 0
    error: Optional[str]       = None


# ── Core enriched IOC record ───────────────────────────────────────────────────

class EnrichedIOC(BaseModel):
    """
    Single IOC with all enrichment data attached.
    This is the primary object passed through the pipeline and
    returned to the frontend.
    """
    ioc_value: str
    ioc_type: IOCType           = IOCType.UNKNOWN
    threat_level: ThreatLevel   = ThreatLevel.UNKNOWN
    threat_score: int           = 0          # 0–100 composite score
    virustotal: VirusTotalResult   = Field(default_factory=VirusTotalResult)
    abuseipdb: AbuseIPDBResult     = Field(default_factory=AbuseIPDBResult)
    otx: OTXResult                 = Field(default_factory=OTXResult)
    tags: list[str]                = Field(default_factory=list)
    analyzed_at: datetime          = Field(default_factory=datetime.utcnow)
    error: Optional[str]           = None


# ── API request / response contracts ──────────────────────────────────────────

class EnrichmentRequest(BaseModel):
    """Body for the /enrich endpoint when IOCs are sent as JSON."""
    iocs: list[str]


class EnrichmentResponse(BaseModel):
    """Envelope returned by the enrichment API."""
    total: int
    malicious: int
    suspicious: int
    safe: int
    unknown: int
    results: list[EnrichedIOC]
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


# ── Report models ──────────────────────────────────────────────────────────────

class ReportEntry(BaseModel):
    """Flat row written to CSV / Markdown reports."""
    ioc_value: str
    ioc_type: str
    threat_level: str
    threat_score: int
    vt_malicious: int
    vt_total_engines: int
    abuse_confidence: int
    abuse_reports: int
    otx_pulses: int
    tags: str
    analyzed_at: str


class AnalysisHistory(BaseModel):
    """Metadata for one completed analysis stored in session history."""
    session_id: str
    filename: Optional[str]
    total_iocs: int
    malicious: int
    suspicious: int
    safe: int
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    report_path: Optional[str] = None
