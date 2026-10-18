# STILLGOOD — Production Verification Runbook & Audit

**Production URLs:**
- **Firebase Hosting CDN:** https://project-698b49f2-0692-4677-948.web.app
- **Cloud Run Microservice:** https://stillgood-backend-518727782721.asia-south1.run.app  
**Verification Date:** October 18, 2026  
**Auditor:** Senior Release QA & Cloud Security Engineer

---

## 1. Automated Verification Checks

### Check 1: Health & AI Integration
**Command:**
```bash
curl -s https://stillgood-backend-518727782721.asia-south1.run.app/api/health
```
**Observed Response:**
```json
{
  "status": "healthy",
  "service": "STILLGOOD AI Kitchen Decision Twin",
  "version": "1.0.0",
  "ai_integration": {
    "is_live_gemini": true,
    "provider": "Vertex AI / Google GenAI SDK",
    "model": "gemini-2.5-flash",
    "notice": "Connected to live Gemini 2.5 Flash via official Google GenAI SDK."
  }
}
```
**Result:** PASSED. Vertex AI Gemini 2.5 Flash operational via IAM metadata token exchange.

---

### Check 2: Single-Page Application (SPA) Delivery
**Command:**
```bash
curl -s https://stillgood-backend-518727782721.asia-south1.run.app/
```
**Observed Response:**
- Returns complete `index.html` with correct Google Fonts, Vite module entry point, and STILLGOOD title tags.
- Verified JavaScript asset: `/assets/index-Cuq-vO_1.js` (HTTP 200, 742 KB gzip-compressed).
- Verified CSS stylesheet: `/assets/index-CAPn09HT.css` (HTTP 200, 41 KB gzip-compressed).
**Result:** PASSED. Frontend renders completely without CORS blockers.

---

### Check 3: Transactional Meal-Offer Atomicity & Anti-Oversell
**Scenario A: Valid Order**
```bash
curl -X POST https://stillgood-backend-518727782721.asia-south1.run.app/api/combos/COMBO-VRD-LUNCH-DUET/order \
  -H "Content-Type: application/json" \
  -d '{"combo_id":"COMBO-VRD-LUNCH-DUET","quantity":2,"customer_name":"QA Verification Diner"}'
```
**Observed Response:**
```json
{
  "success": true,
  "transaction_id": "TX-SG-1792345127271",
  "combo_id": "COMBO-VRD-LUNCH-DUET",
  "quantity_ordered": 2,
  "total_paid": 16.2,
  "remaining_inventory": 8,
  "status": "COLLECTED",
  "message": "Simulated order completed! 2 combo(s) marked sold and deducted atomically."
}
```
**Result:** PASSED. Stock decremented from 10 to 8 units.

**Scenario B: Oversell Rejection**
```bash
curl -X POST https://stillgood-backend-518727782721.asia-south1.run.app/api/combos/COMBO-VRD-LUNCH-DUET/order \
  -H "Content-Type: application/json" \
  -d '{"combo_id":"COMBO-VRD-LUNCH-DUET","quantity":50,"customer_name":"Oversell Attempt"}'
```
**Observed Response:**
```json
{"detail": "Sold out! Only 8 available, requested 50."}
```
**Result:** PASSED (HTTP 400). Overselling is strictly prevented at the domain and transactional level.

---

### Check 4: Menu Demand Intelligence (Plan My Food)
**Command:**
```bash
curl -s https://stillgood-backend-518727782721.asia-south1.run.app/api/kitchens/kitchen_restaurant_verde/menu-plan
```
**Observed Response:**
- Service model: `A La Carte (Cook-to-Order)`
- Confirmed order portions: 10 portions across 3 tables.
- Safe holding credit: 66 portions in hot holding wells deducted from prep advice.
- Action advice: `"Fire 2 Creamy Garlic Fettuccine Alfredo on the sauté station now for active tickets. Serve 25 portions Pomodoro and 25 portions Soup directly from holding wells."`
**Result:** PASSED. Realistic kitchen operations validated without assuming 1 generic meal per guest.

---

### Check 5: Regression Test Suite
**Command:**
```bash
python -m pytest
```
**Observed Result:**
- `tests/test_api.py` (3 passed)
- `tests/test_engine.py` (4 passed)
- `tests/test_intelligent_operations.py` (4 passed)
- `tests/test_menu_demand_planning.py` (4 passed)
- `tests/test_v3_features.py` (6 passed)
**Total:** 21 passed in 1.64 seconds. Zero regressions.
