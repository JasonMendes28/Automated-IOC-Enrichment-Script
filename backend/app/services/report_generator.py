"""
Report Generation Service.
Exports enrichment results as CSV or Markdown files.
"""
import os
import csv
import json
from datetime import datetime
from pathlib import Path
from app.models.ioc_models import EnrichmentResponse
from app.config.settings import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


def _ensure_reports_dir() -> Path:
    """Create reports directory if it doesn't exist."""
    reports_path = Path(settings.reports_dir)
    reports_path.mkdir(parents=True, exist_ok=True)
    return reports_path


def generate_csv_report(response: EnrichmentResponse, filename: str = None) -> str:
    """
    Generate a CSV report file from enrichment results.
    Returns the file path.
    """
    reports_dir = _ensure_reports_dir()
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    fname = filename or f"ioc_report_{ts}_{response.analysis_id[:8]}.csv"
    filepath = reports_dir / fname

    fieldnames = [
        "value", "type", "threat_level", "threat_score",
        "vt_malicious", "vt_suspicious", "vt_total_engines",
        "abuseipdb_score", "abuseipdb_reports", "otx_pulses",
        "country", "asn", "tags", "analyzed_at"
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for ioc in response.results:
            writer.writerow({
                "value": ioc.value,
                "type": ioc.ioc_type.value,
                "threat_level": ioc.threat_level.value,
                "threat_score": ioc.threat_score,
                "vt_malicious": ioc.vt_malicious,
                "vt_suspicious": ioc.vt_suspicious,
                "vt_total_engines": ioc.vt_total_engines,
                "abuseipdb_score": ioc.abuseipdb_score,
                "abuseipdb_reports": ioc.abuseipdb_reports,
                "otx_pulses": ioc.otx_pulses,
                "country": ioc.country or "",
                "asn": ioc.asn or "",
                "tags": "|".join(ioc.tags),
                "analyzed_at": ioc.analyzed_at.isoformat(),
            })

    logger.info(f"CSV report saved: {filepath}")
    return str(filepath)


def generate_markdown_report(response: EnrichmentResponse, filename: str = None) -> str:
    """
    Generate a professional Markdown threat intelligence report.
    Returns the file path.
    """
    reports_dir = _ensure_reports_dir()
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    fname = filename or f"ioc_report_{ts}_{response.analysis_id[:8]}.md"
    filepath = reports_dir / fname

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Severity emoji
    def severity_badge(level: str) -> str:
        badges = {
            "malicious": "🔴 MALICIOUS",
            "suspicious": "🟡 SUSPICIOUS",
            "safe": "🟢 SAFE",
            "unknown": "⚪ UNKNOWN",
        }
        return badges.get(level, "⚪ UNKNOWN")

    lines = [
        "# 🛡️ IOC Enrichment Analysis Report",
        f"\n**Analysis ID:** `{response.analysis_id}`  ",
        f"**Generated:** {now}  ",
        f"**Total IOCs Analyzed:** {response.total}",
        "\n---\n",
        "## 📊 Executive Summary\n",
        f"| Metric | Count |",
        f"|--------|-------|",
        f"| Total IOCs | {response.total} |",
        f"| 🔴 Malicious | {response.malicious} |",
        f"| 🟡 Suspicious | {response.suspicious} |",
        f"| 🟢 Safe | {response.safe} |",
        f"| ⚪ Unknown | {response.unknown} |",
        "\n---\n",
        "## 🔍 Detailed IOC Analysis\n",
    ]

    # Sort by threat score descending
    sorted_results = sorted(response.results, key=lambda x: x.threat_score, reverse=True)

    for ioc in sorted_results:
        lines.extend([
            f"### {severity_badge(ioc.threat_level.value)} — `{ioc.value}`\n",
            f"- **Type:** {ioc.ioc_type.value.upper()}",
            f"- **Threat Score:** {ioc.threat_score}/100",
            f"- **Country:** {ioc.country or 'N/A'}",
            f"- **ASN:** {ioc.asn or 'N/A'}",
            f"- **Tags:** {', '.join(ioc.tags) if ioc.tags else 'None'}",
            "",
            "**API Results:**",
            f"| Source | Malicious | Suspicious | AbuseScore | OTX Pulses |",
            f"|--------|-----------|------------|------------|------------|",
            f"| VirusTotal | {ioc.vt_malicious} | {ioc.vt_suspicious} | — | — |",
            f"| AbuseIPDB | — | — | {ioc.abuseipdb_score}% | — |",
            f"| OTX | — | — | — | {ioc.otx_pulses} |",
            "\n---\n",
        ])

    lines.extend([
        "## ⚠️ Malicious Indicators Summary\n",
    ])

    malicious_iocs = [r for r in response.results if r.threat_level.value == "malicious"]
    if malicious_iocs:
        for ioc in malicious_iocs:
            lines.append(f"- `{ioc.value}` (Score: {ioc.threat_score}/100)")
    else:
        lines.append("No malicious indicators detected.")

    lines.extend([
        "\n---",
        "\n*Report generated by Automated IOC Enrichment Platform*",
        f"*Powered by VirusTotal, AbuseIPDB, AlienVault OTX*",
    ])

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    logger.info(f"Markdown report saved: {filepath}")
    return str(filepath)


def save_analysis_history(response: EnrichmentResponse, filename: str = "unknown.txt") -> None:
    """Save analysis metadata to a JSON history file."""
    reports_dir = _ensure_reports_dir()
    history_file = reports_dir / "analysis_history.json"
    
    entry = {
        "analysis_id": response.analysis_id,
        "filename": filename,
        "total_iocs": response.total,
        "malicious": response.malicious,
        "suspicious": response.suspicious,
        "safe": response.safe,
        "analyzed_at": response.analyzed_at.isoformat(),
    }

    history = []
    if history_file.exists():
        try:
            with open(history_file, "r") as f:
                history = json.load(f)
        except Exception:
            history = []

    history.insert(0, entry)
    history = history[:50]  # Keep only last 50 analyses

    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)
