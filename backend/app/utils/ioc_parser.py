"""
IOC Parser and Validator.
Extracts and classifies IOCs from raw text input.
"""
import re
import ipaddress
from typing import List, Tuple
from app.models.ioc_models import IOCType


# --- Regex Patterns ---
IP_PATTERN = re.compile(
    r'\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b'
)

DOMAIN_PATTERN = re.compile(
    r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b'
)

URL_PATTERN = re.compile(
    r'https?://[^\s<>"{}|\\^`\[\]]+'
)

MD5_PATTERN = re.compile(r'\b[a-fA-F0-9]{32}\b')
SHA1_PATTERN = re.compile(r'\b[a-fA-F0-9]{40}\b')
SHA256_PATTERN = re.compile(r'\b[a-fA-F0-9]{64}\b')

# Private/reserved IP ranges to exclude
PRIVATE_RANGES = [
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('0.0.0.0/8'),
    ipaddress.ip_network('169.254.0.0/16'),
]


def is_private_ip(ip_str: str) -> bool:
    """Check if an IP address is in a private/reserved range."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in network for network in PRIVATE_RANGES)
    except ValueError:
        return False


def classify_ioc(value: str) -> IOCType:
    """Determine the type of an IOC."""
    value = value.strip()

    # Check URL first (before domain)
    if URL_PATTERN.match(value):
        return IOCType.URL

    # Check IP
    if IP_PATTERN.fullmatch(value):
        return IOCType.IP

    # Check hash (longest first to avoid false positives)
    if SHA256_PATTERN.fullmatch(value):
        return IOCType.HASH
    if SHA1_PATTERN.fullmatch(value):
        return IOCType.HASH
    if MD5_PATTERN.fullmatch(value):
        return IOCType.HASH

    # Check domain
    if DOMAIN_PATTERN.fullmatch(value):
        return IOCType.DOMAIN

    return IOCType.UNKNOWN


def parse_iocs_from_text(raw_text: str) -> List[Tuple[str, IOCType]]:
    """
    Extract all IOCs from raw text.
    Returns list of (value, type) tuples, deduplicated.
    """
    iocs = []
    seen = set()

    lines = raw_text.strip().splitlines()
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # Each line may contain one IOC
        # Try to classify the whole line
        ioc_type = classify_ioc(line)

        if ioc_type != IOCType.UNKNOWN:
            # Skip private IPs
            if ioc_type == IOCType.IP and is_private_ip(line):
                continue

            value = line.lower() if ioc_type != IOCType.HASH else line.upper()
            if value not in seen:
                seen.add(value)
                iocs.append((value, ioc_type))

    return iocs
