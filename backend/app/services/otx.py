"""
AlienVault OTX API Service.
Queries Open Threat Exchange for pulse/threat data.
Docs: https://otx.alienvault.com/api
"""
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config.settings import get_settings
from app.models.ioc_models import IOCType, APIResult
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

OTX_BASE_URL = "https://otx.alienvault.com/api/v1"

# Map IOC type → OTX indicator type string
OTX_TYPE_MAP = {
    IOCType.IP: ("IPv4", "general"),
    IOCType.DOMAIN: ("domain", "general"),
    IOCType.URL: ("URL", "general"),
    IOCType.HASH: ("file", "general"),
}


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
)
async def query_otx(value: str, ioc_type: IOCType) -> APIResult:
    """
    Query AlienVault OTX for an IOC.
    Returns pulse count and related tags.
    """
    if not settings.otx_api_key:
        return APIResult(source="otx", success=False, error="API key not configured")

    if ioc_type not in OTX_TYPE_MAP:
        return APIResult(source="otx", success=True, data={"skipped": True})

    otx_type, section = OTX_TYPE_MAP[ioc_type]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"{OTX_BASE_URL}/indicators/{otx_type}/{value}/{section}"
            response = await client.get(
                url,
                headers={"X-OTX-API-KEY": settings.otx_api_key}
            )

            if response.status_code == 404:
                return APIResult(source="otx", success=True, data={"pulse_count": 0, "tags": []})

            if response.status_code == 429:
                return APIResult(source="otx", success=False, error="Rate limit exceeded")

            response.raise_for_status()
            data = response.json()

            pulse_info = data.get("pulse_info", {})
            pulses = pulse_info.get("count", 0)
            tags = []
            for pulse in pulse_info.get("pulses", [])[:5]:
                tags.extend(pulse.get("tags", []))

            return APIResult(
                source="otx",
                success=True,
                data={
                    "pulse_count": pulses,
                    "tags": list(set(tags))[:10],
                    "validation": data.get("validation", []),
                }
            )

    except httpx.HTTPStatusError as e:
        logger.error(f"OTX HTTP error for {value}: {e.response.status_code}")
        return APIResult(source="otx", success=False, error=f"HTTP {e.response.status_code}")
    except Exception as e:
        logger.error(f"OTX error for {value}: {str(e)}")
        return APIResult(source="otx", success=False, error=str(e))
