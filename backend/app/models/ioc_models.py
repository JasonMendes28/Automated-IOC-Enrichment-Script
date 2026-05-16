"""
Pydantic models for IOC data structures.
Used for request/response validation throughout the API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class IOCType(str, Enum):
    """Supported IOC types."""
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    HASH = "hash"
    UNKNOWN = "unknown"


class ThreatLevel(str, Enum):
    """Threat severity levels."""
    SAFE = "safe"
    SUSPICIOUS = "suspicious"
    MALICIOUS = "malicious"
    UNKNOWN = "unknown"


class APIResult(BaseModel):
    """Result from a single threat intelligence API."""
    source: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class EnrichedIOC(BaseModel):
    """Fully enriched IOC with all threat intelligence data."""
    id: str
    value: str
    ioc_type: IOCType
    threat_level: ThreatLevel
    threat_score: int = Field(ge=0, le=100, description="0-100 threat score")
    api_results: List[APIResult] = []
    
    # Aggregated intel
    vt_malicious: int = 0
    vt_suspicious: int = 0
    vt_total_engines: int = 0
    abuseipdb_score: int = 0
    abuseipdb_reports: int = 0
    otx_pulses: int = 0
    
    # Metadata
    country: Optional[str] = None
    asn: Optional[str] = None
    tags: List[str] = []
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None


class EnrichmentRequest(BaseModel):
    """Request to enrich a list of IOCs."""
    iocs: List[str]


class EnrichmentResponse(BaseModel):
    """Full enrichment response with stats."""
    total: int
    malicious: int
    suspicious: int
    safe: int
    unknown: int
    results: List[EnrichedIOC]
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    analysis_id: str


class AnalysisSummary(BaseModel):
    """Summary entry for history tracking."""
    analysis_id: str
    filename: str
    total_iocs: int
    malicious: int
    suspicious: int
    safe: int
    analyzed_at: datetime
