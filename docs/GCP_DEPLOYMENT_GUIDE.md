# STILLGOOD — Google Cloud Deployment Guide

This guide walks through deploying STILLGOOD to **Google Cloud Run** (Backend) and **Firebase Hosting** (Frontend) with **Vertex AI** and **Cloud Firestore**.

---

## 1. Prerequisites

1. Google Cloud Project with Billing Enabled:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Enable Required Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com \
     aiplatform.googleapis.com \
     firestore.googleapis.com \
     secretmanager.googleapis.com
   ```
3. Install Firebase CLI (for frontend hosting):
   ```bash
   npm install -g firebase-tools
   ```

---

## 2. Vertex AI Service Account Configuration

Create a dedicated service account for STILLGOOD Cloud Run backend:
```bash
# 1. Create Service Account
gcloud iam service-accounts create stillgood-sa \
  --description="Service account for STILLGOOD Kitchen Decision Twin" \
  --display-name="stillgood-sa"

# 2. Grant Vertex AI User & Firestore User Roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:stillgood-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:stillgood-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## 3. Deploy Backend to Google Cloud Run

```bash
# 1. Navigate to backend directory
cd backend

# 2. Build and Deploy directly with Google Cloud Build & Cloud Run
gcloud run deploy stillgood-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account="stillgood-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_REGION=us-central1"
```

Note the output Service URL: `https://stillgood-backend-xyz-uc.a.run.app`.

---

## 4. Deploy Frontend to Firebase Hosting

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Update production proxy / environment URL in vite.config.ts or .env.production
echo "VITE_API_URL=https://stillgood-backend-xyz-uc.a.run.app" > .env.production

# 3. Build optimized static assets
npm run build

# 4. Initialize and Deploy to Firebase
firebase init hosting
# Select: Use an existing project -> YOUR_PROJECT_ID
# Public directory: dist
# Configure as single-page app: Yes
# Overwrite index.html: No

firebase deploy --only hosting
```

---

## 5. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional: Gemini Developer API key (if using outside Vertex AI) | `AIzaSy...` |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud Project ID for Vertex AI | `stillgood-2026` |
| `GOOGLE_CLOUD_REGION` | Vertex AI & Cloud Run region | `us-central1` |
| `PORT` | Cloud Run server port | `8080` |
