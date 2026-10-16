# STILLGOOD — 3-Minute Hackathon Demo Script
### Google AI Builder Cup 2026 | Sustainability & Social Impact

## Target Time: 3 Minutes (180 Seconds)
**Presenter Role:** Kitchen Operations Manager demonstrating the AI Decision Twin during a live morning shift disruption.

---

### Minute 0:00 – 0:30 | The Problem & The Living Kitchen
1. **Open Application Home Screen:** [Today — Living Kitchen Dashboard]
   - *Presenter:* "Welcome to STILLGOOD. Every morning, commercial kitchens face two opposing risks: overpreparing food creates staggering food waste and financial loss, while underpreparing causes shortages and angry diners. Simple demand reduction often fails when unexpected disruptions hit."
2. **Point out the 5 Key Operational Metrics:**
   - Expected Meals: 500
   - Planned Meals: 500
   - At-Risk Stock: 24 kg Fresh Baby Spinach expiring in 28 hours
   - Pending Decisions: 1 Action Needed
   - Measured Waste / Meal: 0.010 kg
3. **Show the 8 Kitchen Archetypes:**
   - Click the header archetype selector to show support for Restaurants, Hotels, Hospitals (Clinical Strict), Universities, Factories, Caterers, and NGOs.

---

### Minute 0:30 – 1:15 | The Sudden Disruption & Gemini Interpretation
1. **Click the Prominent CTA:** `Fix My Kitchen Plan` (or switch to **AI Assistant** tab).
2. **Highlight the Disruption Notice:**
   - *Alert:* "Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible."
3. **Trigger Analysis:**
   - Click **Analyze Disruption**.
   - Show how Gemini converts natural language into 4 typed operational parameters:
     - Attendance: 500 &rarr; 350
     - Excluded Ingredient: Paneer (supplier delayed past lunch cutoff)
     - Hard Dietary Constraint: Minimum 120 Vegetarian meals
     - Inventory Priority: Fresh Baby Spinach (At-Risk)
4. **Demonstrate Multimodal Slip OCR:**
   - Point to the delivery slip upload showing Gemini Vision extracting dispatch ETA from supplier notices.

---

### Minute 1:15 – 2:00 | 3-Way Plan Comparison & Rejected Candidate Gate
1. **Switch to [Plan Comparison] Tab:**
   - *Presenter:* "Most software either does nothing or does simple proportional scaling. Let's look at all three options evaluated by our deterministic engine:"
2. **Explain the 3 Options:**
   - **Plan A (Retain 500):** Fails with 150 surplus meals, $745 purchase spend, and a 15 kg paneer shortage from the delayed supplier. Status: **INFEASIBLE**.
   - **Plan B (Simple Demand Scaling):** Scales down to 350 meals, but **STILL FAILS** because it still tries to cook 140 portions of Shahi Paneer when the supplier is delayed! Status: **INFEASIBLE**.
   - **Plan C (STILLGOOD Smart Rescue):** **FEASIBLE & RECOMMENDED.**
     - Replaces unavailable paneer with in-stock Amritsari Chana Masala (140 portions) + Homestyle Palak Dal (140 portions).
     - Rescues 14.0 kg of the at-risk spinach.
     - Provides 280 vegetarian portions (surpassing the 120 minimum).
     - Reduces purchasing from $745 to $142 (saving over $600!).
3. **Show the Visibly Rejected Candidates:**
   - Scroll down to the **Rejected Alternatives** box:
     - *Candidate #1 Rejected:* Attempted partial paneer prep &rarr; Rejected by code due to Supplier Delivery Cutoff Breach.
     - *Candidate #2 Rejected:* High poultry fallback &rarr; Rejected by code due to Dietary Minimum Breach (0 veg meals).
   - *Presenter:* "STILLGOOD's engine never recommends an invalid plan as safe."

---

### Minute 2:00 – 2:30 | The Evidence Receipt & Manager Approval
1. **Click [Inspect Evidence Receipt]:**
   - Present the beautifully designed Evidence Receipt modal:
     - Traceable timestamp and unique receipt ID (`RCPT-SG-...`).
     - Recipe version numbers (`v2`, `v3`).
     - FEFO lot codes (`LOT-SPN-2026-1014`).
     - Supplier cutoff math and pack-size rounding.
     - Honest uncertainty disclosures.
   - Click **Download JSON** or **Print** to show full audit exportability.
2. **Click [Proceed to Manager Approval]:**
   - Sign off as "Executive Kitchen Manager".
   - Click **Authorize & Commit Plan**.
   - Show how the plan is permanently stamped in audit history without unverified automated purchasing.

---

### Minute 2:30 – 3:00 | Impact Dashboard & Google Cloud Architecture
1. **Switch to [Impact Dashboard] Tab:**
   - Show the strict separation of the 3 Accounting Tiers:
     - **Tier 1 (Modeled):** 150 surplus meals avoided, $603 purchase spend saved.
     - **Tier 2 (Operational):** 100% manager authorization, 14 kg perishable stock rescued.
     - **Tier 3 (Measured):** 0.010 kg waste per meal physically logged on kitchen scales post-service.
2. **Conclude with Architecture:**
   - "Built from scratch on Google Cloud: React and Tailwind on Firebase Hosting, FastAPI on Google Cloud Run, Firestore for records, and Gemini 2.5 Flash on Vertex AI. STILLGOOD proves that AI in hospitality is most powerful when Gemini proposes, deterministic code validates, and humans approve."
   - **"No Meal Left Behind. No Good Food Wasted."**
