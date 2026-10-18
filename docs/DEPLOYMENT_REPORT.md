# STILLGOOD — Production Deployment Report

**Deployment Date:** October 18, 2026  
**Live Production URL (Firebase Hosting CDN):** https://project-698b49f2-0692-4677-948.web.app  
**Alternate Production URL (Firebase):** https://project-698b49f2-0692-4677-948.firebaseapp.com  
**Direct Microservice URL (Cloud Run):** https://stillgood-backend-518727782721.asia-south1.run.app  
**Google Cloud Project:** `project-698b49f2-0692-4677-948` (Project Number: `518727782721`)  
**Deployment Region:** `asia-south1` (Mumbai, India)  
**Platform Architecture:** Google Cloud Run (Serverless Container), Firebase Hosting (Global Edge CDN), Google Artifact Registry, Google Cloud Firestore (Native Mode), Vertex AI (Gemini 2.5 Flash), Google Cloud Build.

---

## 1. Executive Summary

STILLGOOD has been containerized and deployed to Google Cloud in the Mumbai (`asia-south1`) region. The production environment features:

- **Unified Single-URL Delivery:** The Cloud Run deployment serves both the FastAPI intelligent kitchen twin backend and the production-optimized React/Vite single-page application under valid HTTPS certificates.
- **Scale-to-Zero Cost Controls:** Cloud Run is configured with `min-instances: 0`, guaranteeing \$0 idle computing cost when no traffic is being served, with an upper throttle of `max-instances: 3` and concurrency of 80 requests per container.
- **Direct Vertex AI Integration:** Cloud Run securely connects to Vertex AI Gemini 2.5 Flash using the Google Compute Engine Default Service Account (`roles/aiplatform.user`), eliminating all hardcoded API keys.
- **Firestore Persistence:** Cloud Firestore operates in Native Mode in `asia-south1`, persistence-connected with IAM role `roles/datastore.user`.
- **Zero Secrets in Source:** No private keys, passwords, or tokens are checked into git or bundled in frontend client assets.

---

## 2. Deployed Infrastructure & Resources

| Service | Resource Name / ID | Region | Status |
| :--- | :--- | :--- | :--- |
| **Cloud Run** | `stillgood-backend` | `asia-south1` | **Active / Serving 100% Traffic** |
| **Artifact Registry** | `stillgood-repo` (Docker) | `asia-south1` | **Active** (`backend:latest`) |
| **Cloud Firestore** | `(default)` (Native Mode) | `asia-south1` | **Active** |
| **Vertex AI** | `gemini-2.5-flash` | `asia-south1` | **Connected & Verified** |
| **Cloud Build** | Build ID `97fc30ed-9cb9-4016-9a9c-b9716844e293` | Global / `asia-south1` | **SUCCESS** |
| **IAM Service Account** | `518727782721-compute@developer.gserviceaccount.com` | Global | Bound to `datastore.user`, `aiplatform.user`, `artifactregistry.writer`, `storage.admin` |

---

## 3. Verified End-to-End Test Matrix

| Verification Check | Endpoint / Command | Result | Evidence |
| :--- | :--- | :--- | :--- |
| **Health Check & AI Twin** | `GET /api/health` | **PASS (HTTP 200)** | `is_live_gemini: true`, `model: "gemini-2.5-flash"`, `provider: "Vertex AI / Google GenAI SDK"` |
| **Frontend Root SPA** | `GET /` | **PASS (HTTP 200)** | Clean HTML response, verified title and theme color tokens |
| **Frontend Static Assets** | `GET /assets/index-Cuq-vO_1.js` | **PASS (HTTP 200)** | Bundled, minified JS loaded over HTTPS |
| **Frontend Styles** | `GET /assets/index-CAPn09HT.css` | **PASS (HTTP 200)** | Tailwind CSS production bundle served |
| **Kitchen Context API** | `GET /api/kitchens` | **PASS (HTTP 200)** | 8 segregated kitchens returned including Osteria Verde Bistro & Apex Cafeteria |
| **Vertex AI Disruption NLP** | `POST /api/ai/interpret` | **PASS (HTTP 200)** | Natural language extraction: identified strawberry stock outage and adjusted planning |
| **Atomic Combo Ordering** | `POST /api/combos/{id}/order` | **PASS (HTTP 200)** | Deducted available quantity from 10 to 8 atomically with unique transaction receipt |
| **Oversell Prevention** | `POST /api/combos/{id}/order` (qty: 50) | **REJECTED (HTTP 400)** | Rejected with `"Sold out! Only 8 available, requested 50."` |
| **Menu-Based Demand Planning** | `GET /api/kitchens/{id}/menu-plan` | **PASS (HTTP 200)** | Generated realistic à la carte demand, attaching tickets to live cook-now commands |
| **Automated Regression Suite**| `pytest` (21 tests) | **100% PASS (21/21)** | Full backend logic verified before and after deployment |

---

## 4. Redeployment & Rollback Procedures

### Redeployment Command
```bash
# 1. Build and push new container
gcloud builds submit --tag asia-south1-docker.pkg.dev/project-698b49f2-0692-4677-948/stillgood-repo/backend:latest ./backend --project project-698b49f2-0692-4677-948

# 2. Deploy updated container to Cloud Run
gcloud run deploy stillgood-backend \
  --image asia-south1-docker.pkg.dev/project-698b49f2-0692-4677-948/stillgood-repo/backend:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 80 \
  --service-account 518727782721-compute@developer.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=project-698b49f2-0692-4677-948,GOOGLE_CLOUD_REGION=asia-south1 \
  --project project-698b49f2-0692-4677-948
```

### Rollback Command
```bash
# Roll back traffic immediately to prior revision
gcloud run services update-traffic stillgood-backend \
  --to-revisions stillgood-backend-00001-v29=100 \
  --region asia-south1 \
  --project project-698b49f2-0692-4677-948
```
