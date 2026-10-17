from typing import List, Tuple
from datetime import datetime, timezone
from app.models.schemas import (
    PreparedFoodIntakeRequest, PreparedFoodBatch,
    SafetyDecision, RecommendedRescueAction, SafetyRuleCheck
)

class DeterministicSafetyGate:
    """
    Deterministic Food Safety & Regulatory Eligibility Gate.
    Based on FSSAI (Food Safety and Standards Authority of India) Schedule 4
    and standard commercial kitchen HACCP thermal holding rules.
    
    CRITICAL: Never delegates food safety certification to an LLM.
    Purely deterministic, auditable, and conservative.
    """

    HOT_HOLDING_MIN_TEMP_C = 63.0
    COLD_HOLDING_MAX_TEMP_C = 5.0
    MAX_DANGER_ZONE_HOURS = 2.0
    MAX_BUFFET_EXPOSURE_HOURS_FOR_SALE = 2.0

    @classmethod
    def evaluate_prepared_batch(
        cls,
        req: PreparedFoodIntakeRequest
    ) -> Tuple[SafetyDecision, str, RecommendedRescueAction, List[SafetyRuleCheck]]:
        checks: List[SafetyRuleCheck] = []
        is_eligible = True
        needs_review = False
        rejection_reasons: List[str] = []

        # 1. Customer Contact Check (Strict Zero-Tolerance)
        has_customer_contact = req.served_to_customer
        checks.append(SafetyRuleCheck(
            rule_name="Customer Contact & Return Status",
            passed=not has_customer_contact,
            observed_value="Served/Returned by customer" if has_customer_contact else "Unserved behind kitchen pass",
            threshold="Zero customer contact permitted",
            message="Item was touched or served to a customer; automatic disqualification from resale and donation." if has_customer_contact else "Protected behind pass under chef control.",
            critical_for_safety=True
        ))
        if has_customer_contact:
            is_eligible = False
            rejection_reasons.append("Cross-contamination risk: Food was served to or returned by a customer.")

        # 2. Continuous Temperature Control Verification
        temp = req.holding_temperature_c
        duration = req.holding_duration_hours
        continuous = req.continuously_controlled

        is_hot_safe = temp >= cls.HOT_HOLDING_MIN_TEMP_C
        is_cold_safe = temp <= cls.COLD_HOLDING_MAX_TEMP_C
        is_in_danger_zone = not (is_hot_safe or is_cold_safe)

        temp_msg = ""
        if is_hot_safe:
            temp_msg = f"Hot holding maintained at {temp:.1f}°C (Threshold >= 63.0°C)."
            temp_passed = True
        elif is_cold_safe:
            temp_msg = f"Cold holding maintained at {temp:.1f}°C (Threshold <= 5.0°C)."
            temp_passed = True
        else:
            temp_msg = f"Temperature abuse: {temp:.1f}°C falls within danger zone (5°C - 63°C) for {duration:.1f}h."
            temp_passed = duration <= cls.MAX_DANGER_ZONE_HOURS

        checks.append(SafetyRuleCheck(
            rule_name="Thermal Holding Safety (HACCP)",
            passed=temp_passed and continuous,
            observed_value=f"{temp:.1f}°C for {duration:.1f} hrs (Continuous: {continuous})",
            threshold=">= 63.0°C (Hot) OR <= 5.0°C (Cold), or < 2h in danger zone",
            message=temp_msg,
            critical_for_safety=True
        ))

        if not continuous:
            needs_review = True
            rejection_reasons.append("Holding log incomplete: Missing continuous temperature control logs.")

        if is_in_danger_zone and duration > cls.MAX_DANGER_ZONE_HOURS:
            is_eligible = False
            rejection_reasons.append(f"Thermal breach: Food was held in the temperature danger zone for {duration:.1f}h (maximum allowed: {cls.MAX_DANGER_ZONE_HOURS}h).")

        # 3. Buffet Exposure Protocol
        buffet = req.buffet_exposed
        if buffet:
            buffet_passed = duration <= cls.MAX_BUFFET_EXPOSURE_HOURS_FOR_SALE and is_hot_safe
            checks.append(SafetyRuleCheck(
                rule_name="Self-Service Buffet Hygiene Rule",
                passed=buffet_passed,
                observed_value=f"Exposed on self-service buffet for {duration:.1f}h",
                threshold=f"Max {cls.MAX_BUFFET_EXPOSURE_HOURS_FOR_SALE}h with sneeze guard & active heating",
                message="Buffet leftovers exposed beyond safe resale limit." if not buffet_passed else "Buffet food collected within safe 2-hour window under sneeze-guards.",
                critical_for_safety=True
            ))
            if not buffet_passed:
                is_eligible = False
                rejection_reasons.append("Hygiene policy violation: Self-service buffet items exposed beyond 2 hours cannot be resold.")
        else:
            checks.append(SafetyRuleCheck(
                rule_name="Self-Service Buffet Hygiene Rule",
                passed=True,
                observed_value="Back-of-house storage (No buffet exposure)",
                threshold="N/A",
                message="Food remained protected in kitchen vessels.",
                critical_for_safety=False
            ))

        # 4. Allergen & Transparency Verification
        has_allergen_data = isinstance(req.allergens, list)
        checks.append(SafetyRuleCheck(
            rule_name="Allergen Disclosure Profile",
            passed=has_allergen_data,
            observed_value=", ".join(req.allergens) if req.allergens else "None / Verified Allergen-Free",
            threshold="Declared allergens or explicit nil declaration",
            message="Allergens fully mapped for safe consumer disclosure." if has_allergen_data else "Missing allergen declaration.",
            critical_for_safety=True
        ))
        if not has_allergen_data:
            needs_review = True
            rejection_reasons.append("Safety disclosure warning: Allergen profile not documented.")

        # 5. Final Decision Determination
        if not is_eligible:
            decision = SafetyDecision.INELIGIBLE
            reason = "Failed mandatory food safety criteria: " + "; ".join(rejection_reasons)
            action = RecommendedRescueAction.DISPOSAL
        elif needs_review:
            decision = SafetyDecision.NEEDS_STAFF_REVIEW
            reason = "Held for supervisor verification: " + "; ".join(rejection_reasons)
            action = RecommendedRescueAction.NEXT_SERVICE_REUSE if is_hot_safe else RecommendedRescueAction.DISPOSAL
        else:
            decision = SafetyDecision.ELIGIBLE
            reason = "Passed all HACCP and FSSAI temperature holding and hygiene criteria. Safe for immediate repurposing."
            action = RecommendedRescueAction.DISCOUNTED_COMBO

        return decision, reason, action, checks
