"""
utils/scoring.py
────────────────
Composite threat-score calculator.

Logic:
  • VT malicious > 0           → hard malicious flag   (+60 pts)
  • VT suspicious > 0          → mild flag             (+20 pts)
  • AbuseIPDB score > 50       → suspicious flag       (+40 pts)
  • AbuseIPDB score > 80       → malicious flag        (+60 pts)
  • OTX pulse_count > 0        → suspicious            (+20 pts)
  • OTX pulse_count > 10       → malicious             (+40 pts)

Final score is clamped to [0, 100].
Threat level derived from final score:
  ≥ 70 → malicious
  ≥ 30 → suspicious
  < 30 → safe
"""

from __future__ import annotations
from app.models.ioc import (
    EnrichedIOC, ThreatLevel,
    VirusTotalResult, AbuseIPDBResult, OTXResult,
)


def calculate_score(ioc: EnrichedIOC) -> EnrichedIOC:
    """
    Mutate *ioc* in-place: set threat_score, threat_level, and tags.
    Returns the same object for convenience.
    """
    score = 0
    tags: list[str] = []

    vt: VirusTotalResult   = ioc.virustotal
    ab: AbuseIPDBResult    = ioc.abuseipdb
    otx: OTXResult         = ioc.otx

    # ── VirusTotal ──────────────────────────────────────────────────────────
    if vt.queried and not vt.error:
        if vt.malicious > 0:
            score += 60
            tags.append(f"VT:{vt.malicious}/{vt.total_engines} malicious")
        elif vt.suspicious > 0:
            score += 20
            tags.append(f"VT:{vt.suspicious} suspicious")

    # ── AbuseIPDB ───────────────────────────────────────────────────────────
    if ab.queried and not ab.error:
        if ab.abuse_confidence_score > 80:
            score += 60
            tags.append(f"AbuseIPDB:{ab.abuse_confidence_score}% confidence")
        elif ab.abuse_confidence_score > 50:
            score += 40
            tags.append(f"AbuseIPDB:{ab.abuse_confidence_score}% confidence")
        if ab.total_reports > 0:
            tags.append(f"{ab.total_reports} abuse reports")

    # ── AlienVault OTX ──────────────────────────────────────────────────────
    if otx.queried and not otx.error:
        if otx.pulse_count > 10:
            score += 40
            tags.append(f"OTX:{otx.pulse_count} pulses")
        elif otx.pulse_count > 0:
            score += 20
            tags.append(f"OTX:{otx.pulse_count} pulses")
        tags.extend(otx.malware_families[:3])   # top-3 malware families

    # ── Derive level ────────────────────────────────────────────────────────
    score = min(score, 100)
    if score >= 70:
        level = ThreatLevel.MALICIOUS
    elif score >= 30:
        level = ThreatLevel.SUSPICIOUS
    elif vt.queried or ab.queried or otx.queried:
        level = ThreatLevel.SAFE
    else:
        level = ThreatLevel.UNKNOWN

    ioc.threat_score = score
    ioc.threat_level = level
    ioc.tags = tags
    return ioc
