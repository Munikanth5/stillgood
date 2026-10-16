# AGENTS.md — Permanent Rules for STILLGOOD

This file establishes the foundational principles, design constraints, and operating rules for the STILLGOOD engineering team and any AI coding agents working on this codebase.

## 1. Permanent Product Rules

1. **STILLGOOD's Core Vision Must Remain Unchanged:**
   The product is an AI-powered Kitchen Decision Twin dedicated to: "No Meal Left Behind. No Good Food Wasted." The goal is simultaneously preventing avoidable food waste while guaranteeing meal availability, dietary compliance, and food safety.

2. **Supports Multiple Food-Service Environments:**
   The decision twin engine supports 8 profile archetypes: Restaurants/Cafes, Hotels/Buffets, College/School Canteens, Corporate Cafeterias, Hospitals/Healthcare, Factory/Industrial, Catering/Events, and NGOs/Community Kitchens.

3. **User-Facing Simplicity is Mandatory:**
   A first-time kitchen manager must comprehend the core workflow in less than 60 seconds:
   *(1) Choose kitchen -> (2) State what changed -> (3) See a better plan -> (4) Understand and approve.*
   Never overwhelm non-technical operators with raw optimization parameters or mathematical jargon.

4. **Premium Visual Design Must Not Reduce Usability:**
   Aesthetic standards follow "Apple-level simplicity + Linear-level polish + modern hospitality warmth". Clean typography (Fraunces/Newsreader display, Manrope/Inter body), generous whitespace, restrained cards, and high-contrast semantic colors (Dark Green `#153D34`, Terracotta `#C57B55`, Warm Ivory `#F8F7F2`).

5. **Gemini Proposes; Deterministic Code Validates; Humans Approve:**
   LLMs generate creative candidate rescue plans and natural language explanations. All arithmetic, unit conversions, inventory reservations, recipe scaling, supplier cutoffs, and constraint verifications are executed deterministically. No plan is active without explicit human approval.

6. **No Invented Operational Data:**
   All numerical forecasts, inventory levels, recipe yield ratios, and purchase estimates must stem from verified records or clearly flagged synthetic seed datasets. Gemini must never hallucinate stock or supplier capacities.

7. **No Unsupported Food-Waste or Carbon Claims:**
   Strictly separate three tiers of impact:
   - *Tier 1: Modeled Scenario Benefits* (What the simulator projects)
   - *Tier 2: Operational Actions* (What a manager committed to/approved)
   - *Tier 3: Measured Outcomes* (Actual kitchen waste logged post-service)
   Never claim unserved meals as verified landfill savings without verification.

8. **No Unsafe Food Recommendations:**
   Never suggest utilizing spoiled, quarantined, expired, or temperature-abused ingredients. Never override allergen or clinical healthcare dietary constraints. When in doubt, output "Needs Human Review".

9. **No Hidden Mock Responses Masquerading as Live Gemini:**
   When Gemini API credentials are present, use the official Google Gen AI SDK live. When operating offline or without credentials, display a clear indicator ("Deterministic Fallback Engine Active") so evaluators can inspect genuine versus fallback behavior.

10. **Keep Demo and Production Modes Clearly Distinguishable:**
    Synthetic data must carry visual tags (`[DEMO SAMPLE]`). A single click allows switching between the 8 sample kitchen archetypes or resetting to initial hackathon state.

11. **Run Relevant Tests After Implementing Features:**
    Every mathematical calculation (recipe scaling, batch FEFO allocation, supplier cutoffs, shortage calculations) must have automated unit and integration tests.

12. **Preserve Working Functionality During Refactoring:**
    Never break existing endpoints, data schemas, or UI flows while adding new features.

13. **Document Unfinished Features and Integration Blockers Honestly:**
    Provide crystal-clear instructions for Google Cloud Vertex AI, Firebase, and Cloud Run deployment, distinguishing live cloud connections from local offline emulation.

14. **Secure All Private Data and Credentials:**
    Never commit API keys or service account credentials. Use environment variables and Google Secret Manager.

15. **Prioritize the End-to-End Hackathon Workflow Before Optional Features:**
    The signature WOW scenario (Apex Tech Corporate Cafeteria: 500 to 350 attendance drop, delayed paneer supplier, 120 veg minimum, at-risk spinach priority, candidate rescue plan generation, constraint check, rejection of invalid candidate, evidence receipt generation, approval, and impact tracking) is Priority 0.
