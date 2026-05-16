"""
Core Enrichment Engine.
Orchestrates all API queries and computes final threat scores.
"""
import asyncio
import uuid
from typing import List, Tuple
from app.models.ioc_models import (
    IOCType, ThreatLevel, EnrichedIOC, APIResult, EnrichmentResponse
)
from app.services.virustotal import query_virustotal
from app.services.abuseipdb import query_abuseipdb
from app.services.otx import query_otx
from app.utils.ioc_parser import parse_iocs_from_text
from app.utils.logger import get_logger
from app.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


def _compute_threat_level(
    vt_malicious: int,
    vt_suspicious: int,
    vt_total: int,
    abuse_score: int,
    otx_pulses: int,
) -> Tuple[ThreatLevel, int]:
    """
    Compute ThreatLevel and numeric score (0-100) from API results.
    
    Scoring logic:
    - VT malicious detections > 3 → malicious (60 pts base)
    - VT malicious 1-3 → suspicious (30 pts base)
    - AbuseIPDB confidence > 75 → malicious bonus
    - AbuseIPDB confidence 25-75 → suspicious
    - OTX pulses > 5 → bonus points
    """
    score = 0

    # VirusTotal scoring
    if vt_total > 0:
        vt_ratio = vt_malicious / vt_total
        score += int(vt_ratio * 50)  # Max 50 pts from VT malicious ratio
    if vt_suspicious > 0:
        score += min(vt_suspicious * 2, 10)

    # AbuseIPDB scoring
    if abuse_score > 75:
        score += 35
    elif abuse_score > 50:
        score += 25
    elif abuse_score > 25:
        score += 10

    # OTX pulse scoring
    if otx_pulses > 10:
        score += 15
    elif otx_pulses > 5:
        score += 10
    elif otx_pulses > 0:
        score += 5

    score = min(score, 100)

    # Determine threat level
    if vt_malicious > 3 or abuse_score > 75 or score >= 60:
        level = ThreatLevel.MALICIOUS
    elif vt_malicious > 0 or abuse_score > 25 or otx_pulses > 0 or score >= 20:
        level = ThreatLevel.SUSPICIOUS
    else:
        level = ThreatLevel.SAFE

    return level, score


async def enrich_single_ioc(value: str, ioc_type: IOCType) -> EnrichedIOC:
    """
    Run all API queries for a single IOC concurrently and return enriched result.
    """
    logger.info(f"Enriching {ioc_type.value}: {value}")
    ioc_id = str(uuid.uuid4())[:8]

    # Run all API queries concurrently
    vt_result, abuse_result, otx_result = await asyncio.gather(
        query_virustotal(value, ioc_type),
        query_abuseipdb(value, ioc_type),
        query_otx(value, ioc_type),
        return_exceptions=True,
    )

    # Handle exceptions from gather
    api_results = []
    for result in [vt_result, abuse_result, otx_result]:
        if isinstance(result, Exception):
            api_results.append(APIResult(source="unknown", success=False, error=str(result)))
        else:
            api_results.append(result)

    vt_r, abuse_r, otx_r = api_results

    # Extract normalized values
    vt_malicious = vt_r.data.get("malicious", 0) if vt_r.success and vt_r.data else 0
    vt_suspicious = vt_r.data.get("suspicious", 0) if vt_r.success and vt_r.data else 0
    vt_total = vt_r.data.get("total", 0) if vt_r.success and vt_r.data else 0
    country = vt_r.data.get("country") if vt_r.success and vt_r.data else None
    asn = vt_r.data.get("asn") if vt_r.success and vt_r.data else None

    abuse_score = abuse_r.data.get("abuse_confidence_score", 0) if abuse_r.success and abuse_r.data else 0
    abuse_reports = abuse_r.data.get("total_reports", 0) if abuse_r.success and abuse_r.data else 0
    if not country and abuse_r.success and abuse_r.data:
        country = abuse_r.data.get("country_code")

    otx_pulses = otx_r.data.get("pulse_count", 0) if otx_r.success and otx_r.data else 0
    tags = otx_r.data.get("tags", []) if otx_r.success and otx_r.data else []

    threat_level, threat_score = _compute_threat_level(
        vt_malicious, vt_suspicious, vt_total, abuse_score, otx_pulses
    )

    return EnrichedIOC(
        id=ioc_id,
        value=value,
        ioc_type=ioc_type,
        threat_level=threat_level,
        threat_score=threat_score,
        api_results=api_results,
        vt_malicious=vt_malicious,
        vt_suspicious=vt_suspicious,
        vt_total_engines=vt_total,
        abuseipdb_score=abuse_score,
        abuseipdb_reports=abuse_reports,
        otx_pulses=otx_pulses,
        country=country,
        asn=asn,
        tags=tags[:5],
    )


async def enrich_iocs(raw_text: str) -> EnrichmentResponse:
    """
    Parse IOCs from text and enrich all of them.
    Returns full enrichment response with summary stats.
    """
    parsed = parse_iocs_from_text(raw_text)
    logger.info(f"Parsed {len(parsed)} IOCs from input")

    if not parsed:
        analysis_id = str(uuid.uuid4())
        return EnrichmentResponse(
            total=0, malicious=0, suspicious=0, safe=0, unknown=0,
            results=[], analysis_id=analysis_id
        )

    # Add small delay between IOCs to respect rate limits
    results = []
    for value, ioc_type in parsed:
        enriched = await enrich_single_ioc(value, ioc_type)
        results.append(enriched)
        await asyncio.sleep(settings.api_request_delay)

    # Compute summary stats
    malicious = sum(1 for r in results if r.threat_level == ThreatLevel.MALICIOUS)
    suspicious = sum(1 for r in results if r.threat_level == ThreatLevel.SUSPICIOUS)
    safe = sum(1 for r in results if r.threat_level == ThreatLevel.SAFE)
    unknown = sum(1 for r in results if r.threat_level == ThreatLevel.UNKNOWN)

    return EnrichmentResponse(
        total=len(results),
        malicious=malicious,
        suspicious=suspicious,
        safe=safe,
        unknown=unknown,
        results=results,
        analysis_id=str(uuid.uuid4()),
    )
