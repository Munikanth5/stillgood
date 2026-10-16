# STILLGOOD Technical Architecture

## 1. Executive Vision
**STILLGOOD** is an AI-powered Kitchen Decision Twin engineered for commercial and institutional food-service organizations. It solves two critical operational problems simultaneously:
1. **Preventing Avoidable Food Waste:** Rescuing at-risk inventory, eliminating excess batch preparation, and preventing unneeded supplier purchasing.
2. **Protecting Meal Availability & Food Safety:** Enforcing hard dietary minimums (e.g. Vegetarian, Halal, Diabetic), respecting supplier delivery cutoffs, and strictly quarantining unsafe or recalled inventory.

---

## 2. Google Cloud Platform Architecture

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │                      USERS / CHEFS                     │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
                                      ┌───────────────────────────▼────────────────────────────┐
                                      │                    FIREBASE HOSTING                    │
                                      │         React 18 + TypeScript + Tailwind CSS           │
                                      │           Linear Polish + Hospitality Design           │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │ HTTPS / REST
                                      ┌───────────────────────────▼────────────────────────────┐
                                      │                  GOOGLE CLOUD RUN                      │
                                      │                 FastAPI + Python 3.13                  │
                                      │             Pydantic v2 Contract Validation            │
                                      └───┬───────────────────────────────┬────────────────────┘
                                          │                               │
                ┌─────────────────────────┴─────────────┐   ┌─────────────┴────────────────────────┐
                │        GOOGLE VERTEX AI               │   │      DETERMINISTIC KITCHEN ENGINE    │
                │        Gemini 2.5 Flash               │   │                                      │
                ├───────────────────────────────────────┤   ├──────────────────────────────────────┤
                │ • Disruption Alert Understanding     │   │ • FEFO Inventory Batch Allocation    │
                │ • Multimodal Note & Slip OCR (Vision) │   │ • Recipe Scaling & Aggregate Demand  │
                │ • Candidate Rescue Plan Generation   │   │ • Pack-Size Purchase Rounding        │
                │ • Transparent Audit Explanations     │   │ • Hard Operational Constraint Gates  │
                │ • Tool Calling / Structured Output   │   │ • Mathematical Evidence Receipts     │
                └───────────────────────────────────────┘   └─────────────┬────────────────────────┘
                                                                          │
                                                    ┌─────────────────────┴────────────────────────┐
                                                    │             GOOGLE CLOUD FIRESTORE           │
                                                    │    Kitchens • Batches • Recipes • Audits     │
                                                    └──────────────────────────────────────────────┘
```

---

## 3. The 9-Stage Decision Workflow

Unlike generic conversational bots, STILLGOOD executes a strict 9-stage operational decision loop:

1. **Understand:** Disruption alerts (voice, text, or delivery slip photo) are processed by Gemini into typed parameters.
2. **Forecast:** Historical attendance, calendar day-matching, and badge swipe data update target meal counts.
3. **Simulate:** Real-time What-If simulator recalculates recipe ingredient needs across multiple headcount and supply scenarios.
4. **Replan:** Generates 3 comparative options:
   - *Plan A:* Retain original schedule (shows excess surplus & supply failures).
   - *Plan B:* Simple proportional demand scaling (shows remaining shortage blockers).
   - *Plan C (STILLGOOD):* Smart rescue substituting missing ingredients with in-stock approved recipes and prioritizing at-risk perishables.
5. **Validate:** Independent deterministic code evaluates hard operational constraints:
   - Dietary minimums (e.g. $\ge 120$ vegetarian portions).
   - Supplier delivery cutoffs (e.g. delivery arrives after lunch closes).
   - Kitchen batch capacity ceilings.
   - Food safety exclusions (quarantined or expired stock).
6. **Explain:** Generates a mathematically verifiable **Evidence Receipt** disclosing calculations, version numbers, lot codes, and rejected alternatives.
7. **Approve:** Human kitchen manager reviews and signs off on the plan. No automated food redistribution or supplier purchasing is committed without human authorization.
8. **Measure:** Post-service scale logs document actual preparation waste, plate waste, and unserved portions.
9. **Learn:** Historical accuracy informs future variance buffers and ordering thresholds.

---

## 4. Division of Responsibility: AI vs Deterministic Code

| Function | Responsible Subsystem | Rationale |
| :--- | :--- | :--- |
| Natural language disruption understanding | Gemini 2.5 Flash | Translates messy human voice/text into structured typed parameters |
| Menu document & slip OCR | Gemini 2.5 Vision | Extracts handwritten notes, delivery times, and items from photos |
| Candidate recipe pairings | Gemini 2.5 Flash | Proposes creative substitutions using *only approved recipes* |
| Unit conversion & recipe scaling | Deterministic Python Engine | Exact arithmetic; zero hallucination |
| Inventory allocation | Deterministic FEFO Allocator | Allocates earliest-expiring eligible batches first |
| Food safety quarantine gate | Deterministic Safety Gate | Permanently blocks quarantined or expired inventory |
| Supplier cutoff verification | Deterministic Validator | Compares service window times against supplier ETA |
| Purchasing calculation | Deterministic Engine | Applies pack-size and minimum order quantity math |
| Decision commitment | Human Kitchen Manager | Protects kitchen accountability and operational safety |

---

## 5. Food Safety and Quarantine Architecture
STILLGOOD adheres to strict food safety protocols:
- **Eligible Stock:** Fresh, unexpired batches within temperature thresholds.
- **At-Risk Stock:** Approaching shelf-life expiration (e.g. 24–48 hours); given highest FEFO priority for immediate cooking.
- **Ineligible / Quarantined Stock:** Temperature abuse, damaged packaging, or recall notices trigger immediate exclusion. The system actively logs rejected batches and prevents them from appearing in any recipe allocation.
