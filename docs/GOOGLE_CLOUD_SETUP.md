# STILLGOOD — Google Cloud Setup & Architecture Reference

## 1. Project Configuration

- **Project ID:** `project-698b49f2-0692-4677-948`
- **Project Number:** `518727782721`
- **Region:** `asia-south1` (Mumbai, India)
- **Billing Profile:** Active (`017E9C-4F5E82-1F45B6`)

---

## 2. Enabled Google Cloud Services

The following APIs are enabled and active on the project:
1. `run.googleapis.com` — Cloud Run (Serverless microservice execution)
2. `cloudbuild.googleapis.com` — Cloud Build (Automated container builds)
3. `artifactregistry.googleapis.com` — Artifact Registry (Docker container registry)
4. `firestore.googleapis.com` — Cloud Firestore (NoSQL document database)
5. `aiplatform.googleapis.com` — Vertex AI (Gemini 2.5 Flash foundation models)
6. `secretmanager.googleapis.com` — Secret Manager
7. `logging.googleapis.com` — Cloud Logging (Centralized telemetry)
8. `firebase.googleapis.com` — Firebase Management API
9. `firebasehosting.googleapis.com` — Firebase Hosting API

---

## 3. Cloud Run Service Parameters

- **Service Name:** `stillgood-backend`
- **Region:** `asia-south1`
- **Image:** `asia-south1-docker.pkg.dev/project-698b49f2-0692-4677-948/stillgood-repo/backend:latest`
- **Min Instances:** `0` (Scales to 0 when idle — guaranteed \$0 idle compute charges)
- **Max Instances:** `3` (Concurrency throttled for cost protection)
- **Concurrency:** `80` requests per instance
- **Port:** `8080` (FastAPI / Uvicorn)
- **Service Account:** `518727782721-compute@developer.gserviceaccount.com`

---

## 4. Security & IAM Policy

STILLGOOD enforces the principle of least privilege using Google Cloud IAM bindings:

| Member | Role | Purpose |
| :--- | :--- | :--- |
| `518727782721-compute@developer.gserviceaccount.com` | `roles/datastore.user` | Read/write access to Cloud Firestore collections |
| `518727782721-compute@developer.gserviceaccount.com` | `roles/aiplatform.user` | Vertex AI model inference (`gemini-2.5-flash`) |
| `518727782721-compute@developer.gserviceaccount.com` | `roles/artifactregistry.writer` | Image publication from Cloud Build |
| `518727782721-compute@developer.gserviceaccount.com` | `roles/storage.admin` | Access to temporary build staging bucket |

---

## 5. Firebase Hosting Integration (Optional Parallel CDN)

To route custom Firebase domains or use Firebase Hosting as an edge CDN:
1. Open [Firebase Console](https://console.firebase.google.com).
2. Click **Add project** and choose `project-698b49f2-0692-4677-948` (accept terms once).
3. Deploy Firebase Hosting from local repository:
   ```bash
   firebase deploy --only hosting --project project-698b49f2-0692-4677-948
   ```
   *Note: `firebase.json` already contains the Cloud Run rewrite to `stillgood-backend` in `asia-south1`.*
