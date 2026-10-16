from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    PlanEvaluation, PlanItem, KitchenProfile, ParsedScenario,
    Recipe, InventoryBatch, Ingredient, Supplier, DietaryTag
)
from app.engine.recipe_calculator import RecipeCalculator
from app.engine.inventory_allocator import InventoryAllocator
from app.engine.constraint_validator import ConstraintValidator

class RescuePlanner:
    """
    Deterministic comparative plan engine.
    Calculates Plan A (Original), Plan B (Simple Scale), Plan C (STILLGOOD Rescue),
    and explicitly rejected candidate alternatives.
    """

    def __init__(
        self,
        kitchen: KitchenProfile,
        recipes: List[Recipe],
        inventory: List[InventoryBatch],
        ingredients: List[Ingredient],
        suppliers: List[Supplier]
    ):
        self.kitchen = kitchen
        self.recipes_by_id = {r.id: r for r in recipes}
        self.inventory = inventory
        self.ingredients_by_id = {i.id: i for i in ingredients}
        self.suppliers_by_id = {s.id: s for s in suppliers}

    def evaluate_plan_items(
        self,
        plan_id: str,
        plan_type: str,
        title: str,
        subtitle: str,
        scenario: ParsedScenario,
        planned_items: List[PlanItem],
        why_gemini_suggested: str,
        is_recommended: bool = False
    ) -> PlanEvaluation:
        """Evaluates a candidate plan through deterministic simulation and validation."""
        total_portions = sum(item.portions for item in planned_items if self.recipes_by_id.get(item.recipe_id, None) and self.recipes_by_id[item.recipe_id].category == "main")
        if total_portions == 0:
            total_portions = sum(item.portions for item in planned_items)

        # 1. Calculate aggregate ingredient demands
        demands = RecipeCalculator.calculate_total_ingredient_demands(
            self.recipes_by_id, planned_items
        )

        # 2. Allocate inventory via FEFO and compute purchases & shortages
        alloc_result = InventoryAllocator.allocate_stock(
            demands, self.inventory, self.ingredients_by_id
        )

        # 3. Calculate dietary portions
        dietary_counts = RecipeCalculator.calculate_dietary_counts(
            self.recipes_by_id, planned_items
        )

        # 4. Independent constraint validation
        is_feasible, constraint_results, rejection_reasons = ConstraintValidator.validate_plan(
            kitchen=self.kitchen,
            scenario=scenario,
            dietary_counts=dietary_counts,
            total_portions=total_portions,
            shortages=alloc_result["shortages"],
            purchases_required=alloc_result["purchases_required"],
            suppliers_by_id=self.suppliers_by_id
        )

        # Expected surplus calculation
        target_demand = scenario.revised_expected_meals
        expected_surplus = max(0, total_portions - target_demand)

        # Operational complexity heuristic
        unique_mains = len([item for item in planned_items if self.recipes_by_id.get(item.recipe_id) and self.recipes_by_id[item.recipe_id].category == "main"])
        if unique_mains <= 2:
            op_complexity = "LOW"
        elif unique_mains <= 3:
            op_complexity = "MEDIUM"
        else:
            op_complexity = "HIGH"

        feasibility_status = "FEASIBLE" if is_feasible else "INFEASIBLE"

        summary = (
            f"{'Feasible' if is_feasible else 'Infeasible'} plan covering {total_portions} portions. "
            f"Utilizes {alloc_result['at_risk_utilized_kg']} kg at-risk stock. "
            f"Estimated purchase spend: ${alloc_result['total_purchase_cost']:.2f}. "
            f"Projected surplus: {expected_surplus} portions."
        )

        return PlanEvaluation(
            plan_id=plan_id,
            plan_type=plan_type,
            title=title,
            subtitle=subtitle,
            is_recommended=is_recommended and is_feasible,
            feasibility_status=feasibility_status,
            meals_covered=min(total_portions, scenario.revised_expected_meals),
            total_portions=total_portions,
            planned_items=planned_items,
            ingredient_requirements=list(demands.values()),
            inventory_allocated=alloc_result["allocations"],
            shortages=alloc_result["shortages"],
            purchases_required=alloc_result["purchases_required"],
            total_purchase_cost=alloc_result["total_purchase_cost"],
            at_risk_inventory_utilized_kg=alloc_result["at_risk_utilized_kg"],
            at_risk_inventory_utilized_value=alloc_result["at_risk_utilized_value"],
            expected_surplus_meals=expected_surplus,
            operational_complexity=op_complexity,
            constraint_check_results=constraint_results,
            rejection_reasons=rejection_reasons,
            summary_explanation=summary,
            why_gemini_suggested=why_gemini_suggested
        )

    def generate_all_scenario_plans(
        self, scenario: ParsedScenario
    ) -> Dict[str, Any]:
        """
        Generates Plan A, Plan B, Plan C, and rejected candidates for the scenario.
        """
        # --- PLAN A: Keep Original Plan (500 Meals) ---
        plan_a_items = [
            PlanItem(
                recipe_id="recipe_shahi_paneer",
                recipe_name="Shahi Paneer Royale",
                portions=300,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=1.35,
                total_cost=405.0
            ),
            PlanItem(
                recipe_id="recipe_chicken_tikka",
                recipe_name="Murgh Tikka Masala",
                portions=200,
                dietary_tags=[DietaryTag.HALAL, DietaryTag.GLUTEN_FREE],
                cost_per_portion=1.52,
                total_cost=304.0
            ),
            PlanItem(
                recipe_id="recipe_jeera_rice",
                recipe_name="Fragrant Jeera Basmati Rice",
                portions=500,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=0.22,
                total_cost=110.0
            ),
            PlanItem(
                recipe_id="recipe_tandoori_roti",
                recipe_name="Artisan Tandoori Roti",
                portions=500,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN],
                cost_per_portion=0.12,
                total_cost=60.0
            ),
            PlanItem(
                recipe_id="recipe_garden_salad",
                recipe_name="Rainbow Garden Salad",
                portions=350,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=0.24,
                total_cost=84.0
            ),
        ]
        plan_a = self.evaluate_plan_items(
            plan_id="plan_a_original",
            plan_type="PLAN_A_ORIGINAL",
            title="Plan A: Retain Original Schedule (500 Meals)",
            subtitle="No adjustment for 350 attendance drop; ignores paneer supplier disruption.",
            scenario=scenario,
            planned_items=plan_a_items,
            why_gemini_suggested="Baseline comparison. Prepares for full 500 attendance ignoring all reported disruption signals.",
            is_recommended=False
        )

        # --- PLAN B: Simple Proportional Demand Adjustment (350 Meals) ---
        # Proportionally scales down dishes, but keeps same recipes
        plan_b_items = [
            PlanItem(
                recipe_id="recipe_shahi_paneer",
                recipe_name="Shahi Paneer Royale",
                portions=140,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=1.35,
                total_cost=189.0
            ),
            PlanItem(
                recipe_id="recipe_chicken_tikka",
                recipe_name="Murgh Tikka Masala",
                portions=105,
                dietary_tags=[DietaryTag.HALAL, DietaryTag.GLUTEN_FREE],
                cost_per_portion=1.52,
                total_cost=159.6
            ),
            PlanItem(
                recipe_id="recipe_jeera_rice",
                recipe_name="Fragrant Jeera Basmati Rice",
                portions=350,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=0.22,
                total_cost=77.0
            ),
            PlanItem(
                recipe_id="recipe_tandoori_roti",
                recipe_name="Artisan Tandoori Roti",
                portions=350,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN],
                cost_per_portion=0.12,
                total_cost=42.0
            ),
            PlanItem(
                recipe_id="recipe_garden_salad",
                recipe_name="Rainbow Garden Salad",
                portions=245,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=0.24,
                total_cost=58.8
            ),
        ]
        plan_b = self.evaluate_plan_items(
            plan_id="plan_b_simple_scale",
            plan_type="PLAN_B_SIMPLE_SCALE",
            title="Plan B: Simple Demand Scaling (350 Meals)",
            subtitle="Scales quantities to 350 but retains original recipes without addressing supplier cutoff.",
            scenario=scenario,
            planned_items=plan_b_items,
            why_gemini_suggested="Traditional rule-of-thumb scaling. Fails because paneer is unavailable from supplier before lunch.",
            is_recommended=False
        )

        # --- PLAN C: STILLGOOD Smart Rescue Plan (350 Meals + Rescue) ---
        # Substitutes Shahi Paneer with Chana Masala (140) + Palak Dal (140) + Chicken Tikka (70)
        # Veg Total = 280 (exceeds >= 120 required)
        # Palak Dal consumes 14 kg of the 24 kg at-risk spinach!
        # Chana Masala uses pantry chickpeas. Zero paneer needed!
        plan_c_items = [
            PlanItem(
                recipe_id="recipe_chana_masala",
                recipe_name="Amritsari Chana Masala",
                portions=140,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE, DietaryTag.DAIRY_FREE],
                cost_per_portion=0.65,
                total_cost=91.0
            ),
            PlanItem(
                recipe_id="recipe_palak_dal",
                recipe_name="Homestyle Palak Dal Tadka",
                portions=140,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE, DietaryTag.DAIRY_FREE],
                cost_per_portion=0.62,
                total_cost=86.8
            ),
            PlanItem(
                recipe_id="recipe_chicken_tikka",
                recipe_name="Murgh Tikka Masala",
                portions=70,
                dietary_tags=[DietaryTag.HALAL, DietaryTag.GLUTEN_FREE],
                cost_per_portion=1.52,
                total_cost=106.4
            ),
            PlanItem(
                recipe_id="recipe_jeera_rice",
                recipe_name="Fragrant Jeera Basmati Rice",
                portions=350,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=0.22,
                total_cost=77.0
            ),
            PlanItem(
                recipe_id="recipe_tandoori_roti",
                recipe_name="Artisan Tandoori Roti",
                portions=350,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN],
                cost_per_portion=0.12,
                total_cost=42.0
            ),
            PlanItem(
                recipe_id="recipe_garden_salad",
                recipe_name="Rainbow Garden Salad",
                portions=200,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                cost_per_portion=0.24,
                total_cost=48.0
            ),
        ]
        plan_c = self.evaluate_plan_items(
            plan_id="plan_c_smart_rescue",
            plan_type="PLAN_C_SMART_RESCUE",
            title="Plan C: STILLGOOD Smart Rescue Plan",
            subtitle="Replaces delayed paneer with approved Chana Masala & rescues at-risk spinach in Palak Dal.",
            scenario=scenario,
            planned_items=plan_c_items,
            why_gemini_suggested=(
                "Gemini identified that in-stock Kabuli Chickpeas and at-risk Fresh Spinach could replace unavailable Paneer. "
                "By pairing Amritsari Chana Masala with Homestyle Palak Dal, the kitchen preserves 280 vegetarian portions "
                "(exceeding the 120-meal requirement), rescues 14.0 kg of perishable spinach before expiry, and bypasses the delayed dairy supplier."
            ),
            is_recommended=True
        )

        # --- CANDIDATE #4: Explicitly Rejected Candidate (Supplier Cutoff Breach) ---
        rejected_cand_1_items = [
            PlanItem(
                recipe_id="recipe_shahi_paneer",
                recipe_name="Shahi Paneer Royale",
                portions=90,
                dietary_tags=[DietaryTag.VEGETARIAN],
                cost_per_portion=1.35,
                total_cost=121.5
            ),
            PlanItem(
                recipe_id="recipe_chicken_tikka",
                recipe_name="Murgh Tikka Masala",
                portions=120,
                dietary_tags=[DietaryTag.HALAL],
                cost_per_portion=1.52,
                total_cost=182.4
            ),
            PlanItem(
                recipe_id="recipe_palak_dal",
                recipe_name="Homestyle Palak Dal Tadka",
                portions=140,
                dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN],
                cost_per_portion=0.62,
                total_cost=86.8
            ),
        ]
        rejected_1 = self.evaluate_plan_items(
            plan_id="candidate_rejected_supplier",
            plan_type="PLAN_REJECTED_CANDIDATE",
            title="Candidate Alternative #1 (Attempted Partial Paneer)",
            subtitle="Rejected by validation engine due to supplier cutoff failure.",
            scenario=scenario,
            planned_items=rejected_cand_1_items,
            why_gemini_suggested="Attempted to prepare a smaller 90-portion batch of Shahi Paneer.",
            is_recommended=False
        )

        # --- CANDIDATE #5: Explicitly Rejected Candidate (Dietary Minimum Breach) ---
        rejected_cand_2_items = [
            PlanItem(
                recipe_id="recipe_chicken_tikka",
                recipe_name="Murgh Tikka Masala",
                portions=250,
                dietary_tags=[DietaryTag.HALAL],
                cost_per_portion=1.52,
                total_cost=380.0
            ),
            PlanItem(
                recipe_id="recipe_jeera_rice",
                recipe_name="Fragrant Jeera Basmati Rice",
                portions=350,
                dietary_tags=[DietaryTag.VEGAN],
                cost_per_portion=0.22,
                total_cost=77.0
            ),
        ]
        rejected_2 = self.evaluate_plan_items(
            plan_id="candidate_rejected_dietary",
            plan_type="PLAN_REJECTED_CANDIDATE",
            title="Candidate Alternative #2 (Meat-Heavy Fallback)",
            subtitle="Rejected by validation engine due to dietary violation (< 120 veg meals).",
            scenario=scenario,
            planned_items=rejected_cand_2_items,
            why_gemini_suggested="Attempted to simplify service with a high-protein poultry focus.",
            is_recommended=False
        )

        return {
            "plan_a": plan_a,
            "plan_b": plan_b,
            "plan_c": plan_c,
            "rejected_candidates": [rejected_1, rejected_2]
        }
