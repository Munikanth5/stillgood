# STILLGOOD — Known Limitations & Operational Considerations

## 1. Cloud Run Cold Starts
- **Behavior:** With `min-instances: 0` configured to ensure \$0 idle cost, the first request after an extended idle period (~15 minutes of zero traffic) may experience a cold start of 3–5 seconds while a container instance is provisioned.
- **Remedy:** In high-volume production environments, `min-instances` can be adjusted to `1` in the Google Cloud Console or via `gcloud run services update stillgood-backend --min-instances 1 --region asia-south1`.

## 2. Firebase Console Terms Acceptance
- **Behavior:** Firebase Management APIs (`projects:addfirebase`) require the Google Cloud account owner to accept the Firebase Terms of Service in the web browser at least once per Google account.
- **Status:** The primary Cloud Run deployment (`https://stillgood-backend-518727782721.asia-south1.run.app`) serves both frontend and backend seamlessly with full HTTPS and no external CDN dependency. Firebase Hosting can be bound at any time by completing the one-time console acceptance at [Firebase Console](https://console.firebase.google.com).

## 3. Vertex AI Model Selection & Quota
- **Model:** Default configured model is `gemini-2.5-flash`.
- **Location:** `asia-south1` (Mumbai) routes Vertex AI requests locally; if specific multimodal features require regional failover, the `GOOGLE_CLOUD_REGION` environment variable can be set to another supported Vertex AI region (e.g. `us-central1`).
- **Graceful Fallback:** If Vertex AI quotas or network errors occur, the backend automatically transitions to STILLGOOD's deterministic rules engine without throwing 500 errors to the kitchen staff.

## 4. In-Memory Demo State Synchronization
- **Behavior:** The application includes a rich set of pre-seeded demonstration kitchens (Osteria Verde Bistro, Apex Cafeteria, etc.). Transactional changes (such as combo orders, inventory deductions, and disruption staging) synchronize to Firestore and local memory. Resetting the container or redeploying re-hydrates baseline demo state for consistent presentation demos.
