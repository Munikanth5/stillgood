# STILLGOOD — Impact Accounting & Audit Methodology
### Defensible Sustainability Standards for Commercial Food-Service

## 1. Core Principle: Zero Hallucination Impact Accounting

Many sustainability applications inflate carbon or financial claims by treating unserved portions as guaranteed landfill diversion or applying unverified global multiplication factors.

STILLGOOD enforces **strict separation across three operational tiers**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIER 1: MODELED SCENARIO BENEFITS                    │
│   Hypothetical projections produced by the simulator pre-service.      │
│   • Modeled Surplus Avoided = Baseline Plan A Surplus - Plan C Surplus │
│   • Modeled Spend Avoided = Baseline Plan A Spend - Plan C Spend       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Manager Review & Signature
┌───────────────────────────────────▼────────────────────────────────────┐
│                    TIER 2: OPERATIONAL COMMITMENTS                     │
│   Tangible managerial actions committed to kitchen staff before prep.  │
│   • Manager Plan Authorization (Signed & Stamped in Audit Log)         │
│   • At-Risk Perishable Stock Rescued (kg moved to active prep station) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Post-Service Physical Weigh-In
┌───────────────────────────────────▼────────────────────────────────────┐
│                     TIER 3: MEASURED KITCHEN OUTCOMES                  │
│   Empirical physical measurements recorded on floor scales post-shift. │
│   • Waste per Meal (kg/meal) = Discarded Weight (kg) / Meals Served    │
│   • Forecast Mean Error (%) = |Meals Planned - Meals Served| / Served  │
│   • Spoilage Reduction (%) = Empirical drop vs baseline shift average  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mathematical Formulations

### A. Waste Per Meal ($W_m$)
$$\text{Waste Per Meal (kg/meal)} = \frac{\text{Total Discarded Waste (kg)}}{\text{Total Meals Actually Served}}$$
- **Rule:** Discarded waste is broken down into Preparation Waste (trimmings, peels), Plate Waste (diner scrapings), and Ingredient Spoilage (expired raw stock).
- Unserved hot food sent to blast chillers or verified food banks is logged separately and is **never** counted as discarded waste.

### B. Forecast Discrepancy Error ($E_f$)
$$\text{Forecast Error (\%)} = \frac{|\text{Planned Demand} - \text{Actual Diners Served}|}{\text{Actual Diners Served}} \times 100$$

### C. Modeled Purchasing Difference ($\Delta P$)
$$\Delta P = \text{Plan A Proposed Spend} - \text{Plan C Proposed Spend}$$
- **Rule:** Calculated using verified supplier catalog prices and minimum order packaging rules.

### D. Prohibition on Double-Counting
- STILLGOOD **never** adds avoided purchasing spend to avoided waste value in the same headline metric, as doing so inflates financial savings.
- Food waste prevention is tracked by physical mass (kg), while procurement savings are tracked by currency ($).
