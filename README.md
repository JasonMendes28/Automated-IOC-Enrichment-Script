# 🛡️ Automated IOC Enrichment Platform

A professional **Security Operations Center (SOC)** automation tool that enriches Indicators of Compromise (IOCs) using multiple threat intelligence APIs, generating analyst-ready reports with a sleek cybersecurity dashboard.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+ (or 3.14+)
- Node.js 18+
- API keys for: [VirusTotal](https://www.virustotal.com/gui/my-apikey), [AbuseIPDB](https://www.abuseipdb.com/account/api), [AlienVault OTX](https://otx.alienvault.com/api)

---

## 🔧 Setup

### 1. Clone / Navigate to Project

```bash
cd ioc-platform
```

### 2. Backend Setup

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Configure API Keys

Edit `backend/.env`:
```
VIRUSTOTAL_API_KEY=your_key_here
ABUSEIPDB_API_KEY=your_key_here
OTX_API_KEY=your_key_here
```

### 4. Run Backend

```bash
# From backend/ directory (with venv activated)
uvicorn app.main:app --reload
```

API available at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### 5. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Dashboard at: http://localhost:5173

---

## 📁 Project Structure

```
ioc-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── routes/
│   │   │   └── ioc_routes.py    # API endpoints
│   │   ├── services/
│   │   │   ├── enrichment.py    # Core enrichment orchestrator
│   │   │   ├── virustotal.py    # VirusTotal API client
│   │   │   ├── abuseipdb.py     # AbuseIPDB API client
│   │   │   ├── otx.py           # AlienVault OTX client
│   │   │   └── report_generator.py  # CSV/Markdown exports
│   │   ├── utils/
│   │   │   ├── ioc_parser.py    # IOC extraction & validation
│   │   │   └── logger.py        # Logging config
│   │   ├── models/
│   │   │   └── ioc_models.py    # Pydantic data models
│   │   └── config/
│   │       └── settings.py      # Environment settings
│   ├── requirements.txt
│   ├── .env.example
│   └── sample_iocs.txt          # Test IOC file
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/          # Reusable UI components
    │   ├── pages/               # Dashboard, Upload, Analytics, Reports
    │   ├── services/api.js      # Backend API calls
    │   ├── hooks/               # React hooks
    │   └── utils/               # Helpers
    ├── package.json
    └── vite.config.js
```

---

## 🔌 Supported IOC Types

| Type | Examples |
|------|----------|
| IP Address | `185.220.101.45`, `8.8.8.8` |
| Domain | `malicious.ru`, `evil-c2.com` |
| URL | `http://phishing.com/page` |
| Hash (MD5/SHA1/SHA256) | `d41d8cd9...` |

---

## 🧠 Threat Scoring Logic

| Condition | Score Impact |
|-----------|-------------|
| VT malicious detections (ratio) | +0 to +50 pts |
| VT suspicious detections | +2 per engine (max 10) |
| AbuseIPDB > 75% confidence | +35 pts |
| AbuseIPDB 50-75% | +25 pts |
| AbuseIPDB 25-50% | +10 pts |
| OTX > 10 pulses | +15 pts |
| OTX > 5 pulses | +10 pts |
| OTX > 0 pulses | +5 pts |

**Final Classification:**
- 🔴 **Malicious**: VT malicious > 3, or AbuseIPDB > 75%, or score ≥ 60
- 🟡 **Suspicious**: VT malicious > 0, or AbuseIPDB > 25%, or OTX pulses > 0, or score ≥ 20
- 🟢 **Safe**: Score < 20, no detections

---

## ➕ Adding a New Threat Intel API

1. Create `backend/app/services/new_api.py`:
```python
async def query_new_api(value: str, ioc_type: IOCType) -> APIResult:
    # Query your API and return APIResult
    ...
```

2. Add to `enrichment.py` — import and add to `asyncio.gather()` call

3. Extract relevant fields and include in scoring logic

4. Add API key to `settings.py` and `.env.example`

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/enrich` | Upload IOC file |
| `POST` | `/api/v1/enrich/text` | Enrich from raw text |
| `GET` | `/api/v1/report/{id}/csv` | Download CSV report |
| `GET` | `/api/v1/report/{id}/markdown` | Download Markdown report |
| `GET` | `/api/v1/history` | Analysis history |

---

## 🚀 Deployment

### Docker (recommended)
```bash
# Backend
docker build -t ioc-backend ./backend
docker run -p 8000:8000 --env-file .env ioc-backend

# Frontend (build and serve)
cd frontend && npm run build
# Serve dist/ with nginx or any static host
```

### Railway / Render
Deploy backend as a Python web service pointing to `uvicorn app.main:app`

---

## 💼 Resume Description

**Automated IOC Enrichment Platform** — Full-Stack Cybersecurity Tool  

Built a production-grade SOC automation platform for enriching Indicators of Compromise (IOCs) using real-time threat intelligence APIs. The system parses IOC files, concurrently queries VirusTotal, AbuseIPDB, and AlienVault OTX, computes threat scores using a weighted scoring algorithm, and generates analyst-ready reports in CSV and Markdown.

**Skills Demonstrated:**
- `FastAPI` · `Python 3.12` · `Async/Await` · `httpx` · `Pydantic`
- `React.js` · `Vite` · `Tailwind CSS` · `Recharts`
- REST API design · API rate limit handling · Retry logic (`tenacity`)
- Threat intelligence integration (VirusTotal, AbuseIPDB, OTX)
- IOC parsing (regex-based IP/domain/URL/hash detection)
- Report generation (CSV, Markdown)
- Modular, scalable architecture

**ATS Keywords:**
- SOC automation | Threat intelligence | IOC enrichment
- OSINT | Incident response | Malware analysis
- FastAPI | Python | React | Cybersecurity
- VirusTotal | AbuseIPDB | AlienVault OTX

---

*Built with ❤️ for SOC analysts and blue team defenders*
