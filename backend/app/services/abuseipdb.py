"""
AbuseIPDB API Service.
Checks IP addresses against the AbuseIPDB database.
Docs: https://docs.abuseipdb.com/
"""
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config.settings import get_settings
from app.models.ioc_models import IOCType, APIResult
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

ABUSEIPDB_BASE_URL = "https://api.abuseipdb.com/api/v2"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
)
async def query_abuseipdb(value: str, ioc_type: IOCType) -> APIResult:
    """
    Query AbuseIPDB for an IP address.
    Only supports IP IOC type — returns empty result for others.
    """
    if not settings.abuseipdb_api_key:
        return APIResult(source="abuseipdb", success=False, error="API key not configured")

    # AbuseIPDB only handles IP addresses
    if ioc_type != IOCType.IP:
        return APIResult(source="abuseipdb", success=True, data={"skipped": True, "reason": "Not an IP"})

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{ABUSEIPDB_BASE_URL}/check",
                params={"ipAddress": value, "maxAgeInDays": 90, "verbose": False},
                headers={
                    "Key": settings.abuseipdb_api_key,
                    "Accept": "application/json",
                }
            )

            if response.status_code == 429:
                return APIResult(source="abuseipdb", success=False, error="Rate limit exceeded")

            response.raise_for_status()
            data = response.json().get("data", {})

            return APIResult(
                source="abuseipdb",
                success=True,
                data={
                    "abuse_confidence_score": data.get("abuseConfidenceScore", 0),
                    "total_reports": data.get("totalReports", 0),
                    "country_code": data.get("countryCode", None),
                    "domain": data.get("domain", None),
                    "isp": data.get("isp", None),
                    "is_whitelisted": data.get("isWhitelisted", False),
                    "last_reported_at": data.get("lastReportedAt", None),
                }
            )

    except httpx.HTTPStatusError as e:
        logger.error(f"AbuseIPDB HTTP error for {value}: {e.response.status_code}")
        return APIResult(source="abuseipdb", success=False, error=f"HTTP {e.response.status_code}")
    except Exception as e:
        logger.error(f"AbuseIPDB error for {value}: {str(e)}")
        return APIResult(source="abuseipdb", success=False, error=str(e))
