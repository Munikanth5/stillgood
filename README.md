# STILLGOOD — No-Meal-Left-Behind AI Kitchen Decision Twin
### Google AI Builder Cup 2026 | Sustainability & Social Impact

> **Tagline:** No Meal Left Behind. No Good Food Wasted.  
> **Mission:** Simultaneously reduce avoidable food waste without compromising meal availability, dietary requirements, or kitchen food safety.

### 🌐 Live Production Deployments
- **Primary Application (Firebase Hosting CDN):** [https://project-698b49f2-0692-4677-948.web.app](https://project-698b49f2-0692-4677-948.web.app)
- **Direct Cloud Run Microservice (Mumbai `asia-south1`):** [https://stillgood-backend-518727782721.asia-south1.run.app](https://stillgood-backend-518727782721.asia-south1.run.app)
- **GitHub Repository:** [https://github.com/Munikanth5/stillgood](https://github.com/Munikanth5/stillgood)

---

## 1. Executive Summary

Commercial and institutional kitchens face a daily dilemma: over-preparing food leads to avoidable waste, high purchasing spend, and spoilage, while under-preparing causes meal shortages, dietary non-compliance, and operational chaos.

**STILLGOOD** is an AI-powered Kitchen Decision Twin that models sudden disruptions (attendance shifts, supplier delays, perishable stock at risk) and computes feasible, constraint-validated rescue plans.

### Core Decision Workflow:
$$\text{Understand} \longrightarrow \text{Forecast} \longrightarrow \text{Simulate} \longrightarrow \text{Replan} \longrightarrow \text{Validate} \longrightarrow \text{Explain} \longrightarrow \text{Approve} \longrightarrow \text{Measure} \longrightarrow \text{Learn}$$

---

## 2. Key Features

- **Living Kitchen Dashboard:** 5 key metrics answering: *"What is happening in my kitchen right now, and what needs my attention?"*
- **8 Kitchen Archetypes:** Pre-configured profiles for Corporate Cafeterias, Hospitals (Strict Clinical Diets), Hotel Buffets, School Canteens, Restaurants, Industrial Shift Kitchens, Event Caterers, and NGOs.
- **AI Kitchen Assistant:** Powered by official **Google Gen AI SDK (Gemini 2.5 Flash)** with multimodal document and delivery slip OCR.
- **Interactive What-If Simulator:** Real-time recalculation using genuine backend optimization and verified operational presets.
- **Alternative Plan Comparison:** Evaluates Plan A (Inertia Baseline), Plan B (Simple Scaling), and Plan C (STILLGOOD Rescue) side-by-side.
- **Integrity Validation Gate:** Visibly evaluates and rejects infeasible candidate alternatives (e.g. supplier delivery cutoff violations, dietary minimum breaches).
- **Verifiable Evidence Receipt:** Core product differentiator producing an immutable audit receipt with batch LOT codes, recipe versioning, and uncertainty disclosures.
- **Human Manager Approval:** Enforces food safety and accountability before any operational change is committed.
- **3-Tier Defensible Impact Accounting:** Strictly separates Modeled Benefits (Tier 1), Operational Commitments (Tier 2), and Physical Scale Measurements (Tier 3).

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn
- **AI Engine:** Google Gen AI SDK (`google-genai`), Gemini 2.5 Flash (Vertex AI / Developer API)
- **Deployment:** Google Cloud Run (Containerized Backend), Firebase Hosting (SPA Frontend), Cloud Firestore
- **Testing:** Pytest, HTTPX TestClient, TypeScript compilation suite

---

## 4. Prerequisites

- **Python:** 3.11+ (Tested on Python 3.13)
- **Node.js:** 18+ (Tested on Node 20 / 25)
- **npm:** 9+
- Optional for Live Gemini: `GEMINI_API_KEY` or Google Cloud Project with Vertex AI enabled.

---

## 5. Local Setup & Startup Instructions

### Clone / Navigate to Project Directory
```bash
cd C:\Users\polepam\.gemini\antigravity\scratch\stillgood
```

### Option A: Run Backend
```bash
cd backend
# 1. Activate virtual environment
.\.venv\Scripts\Activate.ps1   # On Windows PowerShell
# source .venv/bin/activate    # On Linux/macOS

# 2. (Optional) Set your Gemini API key for live Gemini 2.5 Flash
$env:GEMINI_API_KEY="your_api_key_here"

# 3. Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000`.  
Swagger API Docs available at `http://127.0.0.1:8000/docs`.

### Option B: Run Frontend
```bash
cd frontend
# 1. Start Vite development server
npm run dev
```
Frontend UI will be live at `http://localhost:5173`.

### Option C: Run Everything via Docker Compose
```bash
docker-compose up --build
```

---

## 6. Running Automated Tests

Run the backend verification suite (mathematical engine, FEFO allocation, constraint checks, and API integration):
```bash
cd backend
.\.venv\Scripts\python -m pytest tests/
```
Run the frontend type check and production build:
```bash
cd frontend
npm run build
```

---

## 7. Signature Kitchen Walkthrough Scenario

Follow this walkthrough to reproduce the core operational demonstration:

1. **Initial State:** Apex Tech Corporate Cafeteria expects 500 covers for lunch.
2. **Disruption Alert:** Morning attendance drops from 500 to 350. Fresh Dairy Farms paneer delivery is delayed until 2:30 PM (lunch finishes at 2:00 PM). Kitchen has 24 kg of Fresh Spinach expiring tomorrow.
3. **AI Interpretation:** Gemini extracts typed parameters: 350 target covers, Paneer locked out, Minimum 120 vegetarian portions required, Spinach prioritized.
4. **Plan Comparison:**
   - **Plan A (Retain 500):** 150 surplus meals, $745 spend, 15 kg paneer shortage &rarr; **INFEASIBLE**.
   - **Plan B (Simple Scale):** Scaled to 350 meals, but still requires 9 kg unavailable paneer &rarr; **INFEASIBLE**.
   - **Plan C (STILLGOOD Rescue):** Replaces paneer with Amritsari Chana Masala (140) + Homestyle Palak Dal (140), rescues 14 kg at-risk spinach, satisfies 280 veg meals, spend drops to $142 &rarr; **FEASIBLE & RECOMMENDED**.
5. **Visible Rejections:** Evaluator can inspect rejected candidates (e.g. Candidate #1 rejected for supplier cutoff breach; Candidate #2 rejected for dietary violation).
6. **Evidence Receipt:** Inspect and export the verifiable Evidence Receipt (`.json` or print).
7. **Approval:** Sign off as Kitchen Manager to record the audit snapshot.
8. **Impact Accounting:** Inspect Tier 1 (Modeled), Tier 2 (Operational), and Tier 3 (Measured) performance.

---

## 8. Documentation Sitemap

- [Production Deployment Report](docs/DEPLOYMENT_REPORT.md)
- [Production Verification Runbook](docs/PRODUCTION_VERIFICATION.md)
- [Google Cloud Setup](docs/GOOGLE_CLOUD_SETUP.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Impact Accounting Methodology](docs/IMPACT_METHODOLOGY.md)
- [Permanent Operating Rules](AGENTS.md)

---

## 9. Known Limitations & Future Roadmap

- **BigQuery ML Forecasting:** Baseline uses day-matching Bayesian estimates; full BigQuery ML integration is planned for P2.
- **POS Direct Sync:** Currently accepts CSV and manual outcome logs; direct Toast / Square API webhooks on roadmap.
- **Live Food Bank Redistribution:** Integration with local food rescue charity routing engines scheduled for v2.0.

---

## 10. License
Built for the **Google AI Builder Cup 2026**. Open source under the Apache 2.0 License.
