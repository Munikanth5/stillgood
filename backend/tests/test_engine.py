import pytest
from app.models.schemas import (
    KitchenProfile, KitchenType, ParsedScenario, DietaryTag,
    BatchEligibility, BatchStorageStatus, PlanItem
)
from app.data.seed_data import (
    KITCHEN_PROFILES, APEX_INGREDIENTS, APEX_INVENTORY,
    APEX_RECIPES, APEX_SUPPLIERS
)
from app.engine.recipe_calculator import RecipeCalculator
from app.engine.inventory_allocator import InventoryAllocator
from app.engine.constraint_validator import ConstraintValidator
from app.engine.rescue_planner import RescuePlanner
from app.engine.evidence_builder import EvidenceBuilder

def test_recipe_scaling_and_demands():
    recipes_by_id = {r.id: r for r in APEX_RECIPES}
    planned = [
        PlanItem(
            recipe_id="recipe_shahi_paneer",
            recipe_name="Shahi Paneer Royale",
            portions=100,
            dietary_tags=[DietaryTag.VEGETARIAN],
            cost_per_portion=1.35,
            total_cost=135.0
        ),
        PlanItem(
            recipe_id="recipe_palak_dal",
            recipe_name="Homestyle Palak Dal Tadka",
            portions=100,
            dietary_tags=[DietaryTag.VEGETARIAN],
            cost_per_portion=0.62,
            total_cost=62.0
        )
    ]
    demands = RecipeCalculator.calculate_total_ingredient_demands(recipes_by_id, planned)
    # Shahi Paneer uses 0.10 kg paneer per portion -> 100 * 0.10 = 10.0 kg paneer
    assert demands["ing_paneer"]["total_qty_needed"] == 10.0
    # Palak Dal uses 0.10 kg spinach per portion -> 100 * 0.10 = 10.0 kg spinach
    assert demands["ing_spinach"]["total_qty_needed"] == 10.0
    # Both use tomatoes: 100 * 0.08 + 100 * 0.04 = 8.0 + 4.0 = 12.0 kg
    assert demands["ing_tomatoes"]["total_qty_needed"] == 12.0

def test_inventory_allocation_fefo_and_safety_exclusion():
    ingredients_by_id = {i.id: i for i in APEX_INGREDIENTS}
    demands = {
        "ing_spinach": {
            "ingredient_id": "ing_spinach",
            "ingredient_name": "Fresh Baby Spinach",
            "total_qty_needed": 14.0,
            "unit": "kg",
            "used_in_recipes": ["Palak Dal"]
        },
        "ing_quarantined_milk": {
            "ingredient_id": "ing_quarantined_milk",
            "ingredient_name": "Whole Cow Milk (Quarantined)",
            "total_qty_needed": 5.0,
            "unit": "l",
            "used_in_recipes": ["Tea"]
        }
    }
    result = InventoryAllocator.allocate_stock(demands, APEX_INVENTORY, ingredients_by_id)

    # Spinach was AT_RISK and should be allocated
    spinach_alloc = [a for a in result["allocations"] if a["ingredient_id"] == "ing_spinach"]
    assert len(spinach_alloc) > 0
    assert spinach_alloc[0]["allocated_qty"] == 14.0
    assert spinach_alloc[0]["was_at_risk"] is True
    assert result["at_risk_utilized_kg"] == 14.0

    # Quarantined milk MUST NOT be allocated to any food
    milk_alloc = [a for a in result["allocations"] if a["ingredient_id"] == "ing_quarantined_milk"]
    assert len(milk_alloc) == 0
    # Should be recorded in rejected batches for food safety
    assert any("quarantined" in r["reason"].lower() for r in result["ineligible_batches_rejected"])

def test_rescue_planner_hackathon_scenario():
    kitchen = KITCHEN_PROFILES["kitchen_corporate_apex"]
    planner = RescuePlanner(
        kitchen=kitchen,
        recipes=APEX_RECIPES,
        inventory=APEX_INVENTORY,
        ingredients=APEX_INGREDIENTS,
        suppliers=APEX_SUPPLIERS
    )

    scenario = ParsedScenario(
        scenario_id="SCEN-TEST-001",
        kitchen_id="kitchen_corporate_apex",
        original_expected_meals=500,
        revised_expected_meals=350,
        service_buffer_percentage=5.0,
        supplier_disruptions=[{
            "supplier_name": "Fresh Dairy Farms Co.",
            "ingredient": "paneer",
            "status": "delayed_after_lunch"
        }],
        dietary_constraints=[{"tag": "vegetarian", "min_meals": 120}],
        inventory_priorities=["spinach"],
        excluded_ingredients=["paneer"],
        raw_explanation="Attendance 500 to 350. Paneer delayed. Min 120 veg. Prioritize spinach."
    )

    bundle = planner.generate_all_scenario_plans(scenario)

    # 1. Plan A should be INFEASIBLE (violates supplier cutoff & massive surplus)
    plan_a = bundle["plan_a"]
    assert plan_a.feasibility_status == "INFEASIBLE"
    assert plan_a.expected_surplus_meals > 0

    # 2. Plan B should be INFEASIBLE (still requires paneer from delayed supplier)
    plan_b = bundle["plan_b"]
    assert plan_b.feasibility_status == "INFEASIBLE"

    # 3. Plan C (Smart Rescue Plan) MUST BE FEASIBLE & RECOMMENDED
    plan_c = bundle["plan_c"]
    assert plan_c.feasibility_status == "FEASIBLE"
    assert plan_c.is_recommended is True
    assert plan_c.at_risk_inventory_utilized_kg >= 14.0  # Spinach successfully rescued!
    assert plan_c.total_purchase_cost < plan_a.total_purchase_cost  # Significant purchase savings

    # 4. Rejected candidates must explicitly exist with failure reasons
    assert len(bundle["rejected_candidates"]) >= 2
    for rejected in bundle["rejected_candidates"]:
        assert rejected.feasibility_status == "INFEASIBLE"
        assert len(rejected.rejection_reasons) > 0

    # 5. Evidence Receipt verification
    receipt = EvidenceBuilder.build_receipt(
        kitchen=kitchen,
        scenario=scenario,
        recommended_plan=plan_c,
        baseline_plan_a=plan_a,
        rejected_candidates=bundle["rejected_candidates"],
        recipes_by_id={r.id: r for r in APEX_RECIPES}
    )
    assert receipt.receipt_id.startswith("RCPT-SG-")
    assert receipt.modeled_surplus_avoidance_meals > 0
    assert receipt.modeled_purchase_savings_cost > 0
    assert receipt.modeled_at_risk_rescued_kg >= 14.0

def test_rescue_planner_restaurant_verde_fixed_menu_and_two_stage_prep():
    from app.data.seed_data import (
        VERDE_INGREDIENTS, VERDE_INVENTORY, VERDE_RECIPES, VERDE_SUPPLIERS
    )
    kitchen = KITCHEN_PROFILES["kitchen_restaurant_verde"]
    planner = RescuePlanner(
        kitchen=kitchen,
        recipes=VERDE_RECIPES,
        inventory=VERDE_INVENTORY,
        ingredients=VERDE_INGREDIENTS,
        suppliers=VERDE_SUPPLIERS
    )

    # Restaurant scenario: 40 cancellations (70 left), cream supplier delayed, at-risk strawberries
    scenario = ParsedScenario(
        scenario_id="SCEN-VERDE-001",
        kitchen_id="kitchen_restaurant_verde",
        original_expected_meals=120,
        revised_expected_meals=70,
        service_buffer_percentage=5.0,
        supplier_disruptions=[{
            "supplier_name": "Country Fresh Dairy",
            "ingredient": "cream",
            "status": "delayed_after_lunch"
        }],
        dietary_constraints=[{"tag": "vegetarian", "min_meals": 35}],
        inventory_priorities=["strawberries"],
        excluded_ingredients=["cream"],
        raw_explanation="Rainstorm: 40 table cancellations. 70 confirmed diners remaining. Dairy delayed."
    )

    bundle = planner.generate_all_scenario_plans(scenario)

    # Plan A: Prepares for 120 anyway (50 meals wasted)
    plan_a = bundle["plan_a"]
    assert plan_a.expected_surplus_meals == 50

    # Plan B: Scales blindly, fails to rescue strawberries
    plan_b = bundle["plan_b"]
    assert plan_b.is_recommended is False

    # Plan C: Fixed-Menu Smart Pairing with Two-Stage Prep
    plan_c = bundle["plan_c"]
    assert plan_c.is_recommended is True
    assert plan_c.two_stage_prep is not None
    assert plan_c.two_stage_prep["stage_1_portions"] == 70  # Pre-service hot line for confirmed reservations
    assert plan_c.two_stage_prep["stage_2_portions"] == 0   # Target 70 was all confirmed
    assert "Strawberries & Hand-Whipped Vanilla Cream" in [item.recipe_name for item in plan_c.planned_items]

    # Verify food safety: Quarantined batch LOT-BAD-CRM-12 was never allocated
    allocated_batches = [a["batch_code"] for a in plan_c.inventory_allocated]
    assert "LOT-BAD-CRM-12" not in allocated_batches
    assert len(bundle["rejected_candidates"]) >= 2

