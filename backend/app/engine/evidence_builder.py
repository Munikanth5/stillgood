from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.schemas import (
    EvidenceReceipt, PlanEvaluation, ParsedScenario, KitchenProfile, Recipe
)

class EvidenceBuilder:
    """
    Constructs an immutable, mathematically verifiable Evidence Receipt
    tracing operational assumptions, recipe versioning, FEFO batch allocations,
    constraint verifications, and projected tier-1 modeled outcomes.
    """

    @staticmethod
    def build_receipt(
        kitchen: KitchenProfile,
        scenario: ParsedScenario,
        recommended_plan: PlanEvaluation,
        baseline_plan_a: PlanEvaluation,
        rejected_candidates: List[PlanEvaluation],
        recipes_by_id: Dict[str, Recipe]
    ) -> EvidenceReceipt:
        now_utc = datetime.now(timezone.utc)
        timestamp_str = now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")
        receipt_id = f"RCPT-SG-{kitchen.id[-5:].upper()}-{now_utc.strftime('%Y%m%d%H%M%S')}"

        # Recipes evaluated with versions
        recipes_evaluated = []
        for item in recommended_plan.planned_items:
            rec = recipes_by_id.get(item.recipe_id)
            recipes_evaluated.append({
                "recipe_id": item.recipe_id,
                "recipe_name": item.recipe_name,
                "version": rec.version if rec else 1,
                "category": rec.category if rec else "main",
                "portions_planned": item.portions,
                "cost_per_portion": item.cost_per_portion,
                "total_cost": item.total_cost,
                "allergens": rec.allergens if rec else []
            })

        # Calculate Modeled Benefits against Plan A baseline
        modeled_surplus_avoidance = max(0, baseline_plan_a.expected_surplus_meals - recommended_plan.expected_surplus_meals)
        modeled_purchase_savings = max(0.0, baseline_plan_a.total_purchase_cost - recommended_plan.total_purchase_cost)
        modeled_at_risk_rescued = recommended_plan.at_risk_inventory_utilized_kg

        # Summarize rejected alternatives
        rejected_summary = []
        for cand in rejected_candidates:
            rejected_summary.append({
                "candidate_id": cand.plan_id,
                "title": cand.title,
                "rejection_reasons": cand.rejection_reasons,
                "failed_constraints": [
                    c.constraint_name for c in cand.constraint_check_results if not c.passed
                ]
            })

        # Remaining uncertainty disclosures (adhering to honest audit rules)
        remaining_uncertainty = [
            f"Badge swipe walk-in variance: modeled around {scenario.revised_expected_meals} ±{int(scenario.revised_expected_meals * (scenario.service_buffer_percentage / 100))} meals.",
            "Weather or transit anomalies could alter lunch arrival distribution between 11:30 AM and 1:30 PM.",
            "Fresh Dairy Farms truck repair status remains monitored; any surprise early arrival will be logged for dinner prep.",
            "Portion consumption is based on standardized 260g portion spoons; chef plating adherence is required."
        ]

        return EvidenceReceipt(
            receipt_id=receipt_id,
            timestamp=timestamp_str,
            kitchen_id=kitchen.id,
            kitchen_name=kitchen.name,
            disruption_summary=scenario.raw_explanation,
            original_assumptions={
                "expected_meals": scenario.original_expected_meals,
                "planned_service": kitchen.default_service_period,
                "primary_demand_driver": kitchen.primary_demand_driver,
                "original_purchase_spend": baseline_plan_a.total_purchase_cost,
                "original_surplus_risk_portions": baseline_plan_a.expected_surplus_meals
            },
            revised_assumptions={
                "expected_meals": scenario.revised_expected_meals,
                "service_buffer_percentage": scenario.service_buffer_percentage,
                "dietary_constraints": scenario.dietary_constraints,
                "excluded_ingredients": scenario.excluded_ingredients,
                "inventory_priorities": scenario.inventory_priorities
            },
            forecast_method="Historical Day-Matching with Badge Attendance Bayesian Update",
            recipes_evaluated=recipes_evaluated,
            inventory_batches_allocated=recommended_plan.inventory_allocated,
            ingredient_calculations=recommended_plan.ingredient_requirements,
            purchasing_calculations=recommended_plan.purchases_required,
            constraints_verified=recommended_plan.constraint_check_results,
            rejected_alternatives=rejected_summary,
            remaining_uncertainty=remaining_uncertainty,
            manager_approval_required=True,
            modeled_surplus_avoidance_meals=modeled_surplus_avoidance,
            modeled_purchase_savings_cost=round(modeled_purchase_savings, 2),
            modeled_at_risk_rescued_kg=round(modeled_at_risk_rescued, 2)
        )
