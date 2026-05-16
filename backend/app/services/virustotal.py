"""
VirusTotal API Service.
Queries VirusTotal for threat intelligence on IPs, domains, URLs, and hashes.
Docs: https://developers.virustotal.com/reference
"""
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config.settings import get_settings
from app.models.ioc_models import IOCType, APIResult
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

VT_BASE_URL = "https://www.virustotal.com/api/v3"


def _get_headers() -> dict:
    return {"x-apikey": settings.virustotal_api_key, "Accept": "application/json"}


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
)
async def query_virustotal(value: str, ioc_type: IOCType) -> APIResult:
    """
    Query VirusTotal for a given IOC.
    Returns normalized APIResult with detection counts.
    """
    if not settings.virustotal_api_key:
        return APIResult(source="virustotal", success=False, error="API key not configured")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if ioc_type == IOCType.IP:
                url = f"{VT_BASE_URL}/ip_addresses/{value}"
            elif ioc_type == IOCType.DOMAIN:
                url = f"{VT_BASE_URL}/domains/{value}"
            elif ioc_type == IOCType.URL:
                import base64
                url_id = base64.urlsafe_b64encode(value.encode()).decode().strip("=")
                url = f"{VT_BASE_URL}/urls/{url_id}"
            elif ioc_type == IOCType.HASH:
                url = f"{VT_BASE_URL}/files/{value}"
            else:
                return APIResult(source="virustotal", success=False, error="Unsupported IOC type")

            response = await client.get(url, headers=_get_headers())

            if response.status_code == 404:
                return APIResult(source="virustotal", success=True, data={
                    "malicious": 0, "suspicious": 0, "undetected": 0, "total": 0
                })

            if response.status_code == 429:
                return APIResult(source="virustotal", success=False, error="Rate limit exceeded")

            response.raise_for_status()
            data = response.json()

            # Extract analysis stats
            stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            country = data.get("data", {}).get("attributes", {}).get("country", None)
            asn = data.get("data", {}).get("attributes", {}).get("asn", None)

            return APIResult(
                source="virustotal",
                success=True,
                data={
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "harmless": stats.get("harmless", 0),
                    "total": sum(stats.values()) if stats else 0,
                    "country": country,
                    "asn": str(asn) if asn else None,
                }
            )

    except httpx.HTTPStatusError as e:
        logger.error(f"VT HTTP error for {value}: {e.response.status_code}")
        return APIResult(source="virustotal", success=False, error=f"HTTP {e.response.status_code}")
    except Exception as e:
        logger.error(f"VT error for {value}: {str(e)}")
        return APIResult(source="virustotal", success=False, error=str(e))
