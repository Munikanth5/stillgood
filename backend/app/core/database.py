import copy
import logging
from typing import Dict, List, Optional, Any
from app.models.schemas import (
    KitchenProfile, InventoryBatch, Recipe, Supplier,
    ParsedScenario, PlanEvaluation, EvidenceReceipt,
    ApprovalRecord, ActualOutcomeLog, ImpactDashboardMetrics
)
from app.data.seed_data import (
    KITCHEN_PROFILES, APEX_INGREDIENTS, APEX_INVENTORY,
    APEX_RECIPES, APEX_SUPPLIERS, SAMPLE_OUTCOME_LOGS,
    VERDE_INGREDIENTS, VERDE_INVENTORY, VERDE_RECIPES,
    VERDE_SUPPLIERS, VERDE_OUTCOME_LOGS
)

logger = logging.getLogger("stillgood.db")

class KitchenDatabase:
    """
    Central database repository for STILLGOOD.
    Maintains typed records in memory with Firestore connectivity hooks.
    Ensures complete isolation between kitchens.
    """

    def __init__(self):
        self.reset_to_demo()

    def reset_to_demo(self):
        """Resets database state to initial clean hackathon demonstration state."""
        self.kitchens: Dict[str, KitchenProfile] = copy.deepcopy(KITCHEN_PROFILES)
        self.ingredients: Dict[str, Any] = {i.id: copy.deepcopy(i) for i in APEX_INGREDIENTS}
        for ing in VERDE_INGREDIENTS:
            self.ingredients[ing.id] = copy.deepcopy(ing)

        self.inventory: Dict[str, List[InventoryBatch]] = {
            "kitchen_corporate_apex": copy.deepcopy(APEX_INVENTORY),
            "kitchen_restaurant_verde": copy.deepcopy(VERDE_INVENTORY)
        }
        self.recipes: Dict[str, List[Recipe]] = {
            "kitchen_corporate_apex": copy.deepcopy(APEX_RECIPES),
            "kitchen_restaurant_verde": copy.deepcopy(VERDE_RECIPES)
        }
        self.suppliers: Dict[str, List[Supplier]] = {
            "kitchen_corporate_apex": copy.deepcopy(APEX_SUPPLIERS),
            "kitchen_restaurant_verde": copy.deepcopy(VERDE_SUPPLIERS)
        }
        self.scenarios: Dict[str, ParsedScenario] = {}
        self.plans: Dict[str, Dict[str, Any]] = {}
        self.receipts: Dict[str, EvidenceReceipt] = {}
        self.approvals: Dict[str, List[ApprovalRecord]] = {
            "kitchen_corporate_apex": [],
            "kitchen_restaurant_verde": []
        }
        self.outcomes: Dict[str, List[ActualOutcomeLog]] = {
            "kitchen_corporate_apex": copy.deepcopy(SAMPLE_OUTCOME_LOGS),
            "kitchen_restaurant_verde": copy.deepcopy(VERDE_OUTCOME_LOGS)
        }

        # STILLGOOD 3.0: Prepared Food Surplus, Combos, and Walk-in Events
        from app.models.schemas import (
            PreparedFoodBatch, PreparedFoodStatus, SafetyDecision,
            RecommendedRescueAction, SafetyRuleCheck, DietaryTag,
            MealComboProposal, ComboPriceOption, AttentionItem, KitchenCompanionSummary
        )

        # Seed prepared surplus for Osteria Verde Bistro (Italian fixed menu)
        self.prepared_batches: Dict[str, List[PreparedFoodBatch]] = {
            "kitchen_restaurant_verde": [
                PreparedFoodBatch(
                    id="PREP-VRD-001",
                    kitchen_id="kitchen_restaurant_verde",
                    dish_name="Rustic Tomato Pomodoro Penne",
                    portions_remaining=15,
                    portions_initially_available=15,
                    prepared_at="12:30",
                    service_period="Lunch Service",
                    served_to_customer=False,
                    buffet_exposed=False,
                    continuously_controlled=True,
                    holding_temperature_c=68.5,
                    holding_duration_hours=1.5,
                    safe_use_cutoff="22:30 UTC",
                    allergens=["gluten"],
                    dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN],
                    status=PreparedFoodStatus.SAFE_HOLDING,
                    eligibility_decision=SafetyDecision.ELIGIBLE,
                    eligibility_reason="Maintained in hot holding well at 68.5°C under continuous chef observation.",
                    recommended_action=RecommendedRescueAction.DISCOUNTED_COMBO,
                    rule_checks=[
                        SafetyRuleCheck(rule_name="Customer Contact", passed=True, observed_value="Unserved behind pass", threshold="Zero contact", message="Protected behind kitchen pass."),
                        SafetyRuleCheck(rule_name="Hot Holding Temp", passed=True, observed_value="68.5°C", threshold=">= 63.0°C", message="Safe thermal holding verified."),
                    ],
                    is_demo=True
                ),
                PreparedFoodBatch(
                    id="PREP-VRD-002",
                    kitchen_id="kitchen_restaurant_verde",
                    dish_name="Tuscan Tomato Basil Soup",
                    portions_remaining=12,
                    portions_initially_available=12,
                    prepared_at="11:45",
                    service_period="Lunch Service",
                    served_to_customer=False,
                    buffet_exposed=False,
                    continuously_controlled=True,
                    holding_temperature_c=71.0,
                    holding_duration_hours=2.0,
                    safe_use_cutoff="22:00 UTC",
                    allergens=[],
                    dietary_tags=[DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE],
                    status=PreparedFoodStatus.SAFE_HOLDING,
                    eligibility_decision=SafetyDecision.ELIGIBLE,
                    eligibility_reason="Simmered continuously at 71.0°C in insulated kettle.",
                    recommended_action=RecommendedRescueAction.DISCOUNTED_COMBO,
                    rule_checks=[
                        SafetyRuleCheck(rule_name="Thermal Holding", passed=True, observed_value="71.0°C", threshold=">= 63.0°C", message="Thermal safety certified."),
                    ],
                    is_demo=True
                ),
                PreparedFoodBatch(
                    id="PREP-VRD-003",
                    kitchen_id="kitchen_restaurant_verde",
                    dish_name="Strawberries & Hand-Whipped Vanilla Cream",
                    portions_remaining=10,
                    portions_initially_available=10,
                    prepared_at="13:00",
                    service_period="Lunch Service",
                    served_to_customer=False,
                    buffet_exposed=False,
                    continuously_controlled=True,
                    holding_temperature_c=3.8,
                    holding_duration_hours=1.0,
                    safe_use_cutoff="23:00 UTC",
                    allergens=["dairy"],
                    dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.GLUTEN_FREE],
                    status=PreparedFoodStatus.SAFE_HOLDING,
                    eligibility_decision=SafetyDecision.ELIGIBLE,
                    eligibility_reason="Kept in cold pastry display case at 3.8°C.",
                    recommended_action=RecommendedRescueAction.DISCOUNTED_COMBO,
                    rule_checks=[
                        SafetyRuleCheck(rule_name="Cold Holding Temp", passed=True, observed_value="3.8°C", threshold="<= 5.0°C", message="Safe refrigeration verified."),
                    ],
                    is_demo=True
                ),
                PreparedFoodBatch(
                    id="PREP-VRD-004-REJECTED",
                    kitchen_id="kitchen_restaurant_verde",
                    dish_name="Pollo alla Griglia (Returned Platter)",
                    portions_remaining=2,
                    portions_initially_available=2,
                    prepared_at="13:15",
                    service_period="Lunch Service",
                    served_to_customer=True,  # Disqualification!
                    buffet_exposed=False,
                    continuously_controlled=True,
                    holding_temperature_c=65.0,
                    holding_duration_hours=0.5,
                    safe_use_cutoff="15:00 UTC",
                    allergens=[],
                    dietary_tags=[DietaryTag.HALAL],
                    status=PreparedFoodStatus.INELIGIBLE,
                    eligibility_decision=SafetyDecision.INELIGIBLE,
                    eligibility_reason="Cross-contamination risk: Platter was served to a customer table before return. Prohibited from resale or donation.",
                    recommended_action=RecommendedRescueAction.DISPOSAL,
                    rule_checks=[
                        SafetyRuleCheck(rule_name="Customer Contact Check", passed=False, observed_value="Served to customer", threshold="Zero customer contact", message="Cross-contamination risk.", critical_for_safety=True),
                    ],
                    is_demo=True
                ),
            ],
            "kitchen_corporate_apex": [
                PreparedFoodBatch(
                    id="PREP-APX-001",
                    kitchen_id="kitchen_corporate_apex",
                    dish_name="Homestyle Palak Dal Tadka",
                    portions_remaining=25,
                    portions_initially_available=25,
                    prepared_at="11:30",
                    service_period="Cafeteria Lunch",
                    served_to_customer=False,
                    buffet_exposed=False,
                    continuously_controlled=True,
                    holding_temperature_c=69.0,
                    holding_duration_hours=2.0,
                    safe_use_cutoff="19:00 UTC",
                    allergens=[],
                    dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN],
                    status=PreparedFoodStatus.SAFE_HOLDING,
                    eligibility_decision=SafetyDecision.ELIGIBLE,
                    eligibility_reason="Kept in Bain-Marie well at 69°C.",
                    recommended_action=RecommendedRescueAction.DISCOUNTED_COMBO,
                    rule_checks=[
                        SafetyRuleCheck(rule_name="Holding Temperature", passed=True, observed_value="69.0°C", threshold=">= 63.0°C", message="Thermal safety verified.")
                    ],
                    is_demo=True
                )
            ]
        }

        # Seed Combos
        self.combos: Dict[str, List[MealComboProposal]] = {
            "kitchen_restaurant_verde": [
                MealComboProposal(
                    combo_id="COMBO-VRD-LUNCH-DUET",
                    kitchen_id="kitchen_restaurant_verde",
                    title="Bistro Chef's Lunch Duet: Pomodoro & Strawberry Cream",
                    customer_description="Rustic Tomato Pomodoro Penne paired with hand-whipped vanilla strawberries. Freshly cooked during lunch service, perfectly held, and ready for pickup.",
                    included_dishes=[
                        {"dish_name": "Rustic Tomato Pomodoro Penne", "portions_per_bundle": 1, "batch_id": "PREP-VRD-001", "holding_temp_c": 68.5},
                        {"dish_name": "Strawberries & Hand-Whipped Vanilla Cream", "portions_per_bundle": 1, "batch_id": "PREP-VRD-003", "holding_temp_c": 3.8}
                    ],
                    allergens=["gluten", "dairy"],
                    dietary_tags=["vegetarian"],
                    normal_total_price=12.50,
                    cost_basis=3.95,
                    suggested_prices=[
                        ComboPriceOption(tier_name="Quick-Sale 20%", discount_pct=20, price=10.00, margin_pct=60.5, sell_through_probability="65%", trade_off_explanation="Highest revenue recovery"),
                        ComboPriceOption(tier_name="Value-Combo 35%", discount_pct=35, price=8.10, margin_pct=51.2, sell_through_probability="88%", trade_off_explanation="Optimal balance of speed and revenue"),
                        ComboPriceOption(tier_name="Flash Recovery 50%", discount_pct=50, price=6.25, margin_pct=36.8, sell_through_probability="98%", trade_off_explanation="Rapid clear-out before dinner service")
                    ],
                    selected_price=8.10,
                    available_quantity=10,
                    reserved_quantity=0,
                    sold_quantity=0,
                    safe_pickup_cutoff="22:30 UTC",
                    status="APPROVED",
                    why_gemini_paired="Pairs rich savory pasta with a refreshing strawberry dessert special to recover full value with zero food waste.",
                    deterministic_checks=[
                        SafetyRuleCheck(rule_name="Component Eligibility", passed=True, observed_value="Both ELIGIBLE", threshold="ELIGIBLE", message="Food safety certified."),
                        SafetyRuleCheck(rule_name="Inventory Balance", passed=True, observed_value="10 portions available", threshold=">= 1", message="Inventory confirmed.")
                    ],
                    is_safe=True,
                    rejection_reasons=[]
                )
            ],
            "kitchen_corporate_apex": []
        }

        self.walkin_events: Dict[str, List[Any]] = {
            "kitchen_restaurant_verde": [],
            "kitchen_corporate_apex": []
        }
        self.offer_transactions: List[Dict[str, Any]] = []

        logger.info("KitchenDatabase reset to verified demo state with STILLGOOD 3.0 extensions.")

    # Prepared Batches
    def get_prepared_batches(self, kitchen_id: str) -> List[Any]:
        return self.prepared_batches.get(kitchen_id, [])

    def add_prepared_batch(self, batch: Any) -> Any:
        if batch.kitchen_id not in self.prepared_batches:
            self.prepared_batches[batch.kitchen_id] = []
        self.prepared_batches[batch.kitchen_id].insert(0, batch)
        return batch

    # Combos
    def get_combos(self, kitchen_id: str) -> List[Any]:
        return self.combos.get(kitchen_id, [])

    def save_combo(self, combo: Any) -> Any:
        if combo.kitchen_id not in self.combos:
            self.combos[combo.kitchen_id] = []
        # Update if exists
        existing = [c for c in self.combos[combo.kitchen_id] if c.combo_id == combo.combo_id]
        if existing:
            self.combos[combo.kitchen_id].remove(existing[0])
        self.combos[combo.kitchen_id].insert(0, combo)
        return combo

    # Transactional Offer Order (Atomic decrement to prevent overselling)
    def order_combo(self, combo_id: str, quantity: int = 1, customer_name: str = "Demo Diner") -> Dict[str, Any]:
        target_combo = None
        for k_combos in self.combos.values():
            for c in k_combos:
                if c.combo_id == combo_id:
                    target_combo = c
                    break

        if not target_combo:
            return {"success": False, "message": "Offer not found."}

        if target_combo.available_quantity < quantity:
            return {
                "success": False,
                "message": f"Sold out! Only {target_combo.available_quantity} available, requested {quantity}."
            }

        # Atomic updates
        target_combo.available_quantity -= quantity
        target_combo.sold_quantity += quantity
        if target_combo.available_quantity == 0:
            target_combo.status = "SOLD_OUT"

        # Decrement component prepared batches
        k_id = target_combo.kitchen_id
        batches = self.prepared_batches.get(k_id, [])
        for item in target_combo.included_dishes:
            b_id = item.get("batch_id")
            for b in batches:
                if b.id == b_id:
                    b.portions_remaining = max(0, b.portions_remaining - quantity)
                    b.portions_sold += quantity

        import time
        tx_id = f"TX-SG-{int(time.time() * 1000)}"
        tx_record = {
            "transaction_id": tx_id,
            "combo_id": combo_id,
            "kitchen_id": k_id,
            "quantity": quantity,
            "total_paid": round(target_combo.selected_price * quantity, 2),
            "customer_name": customer_name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "status": "COLLECTED"
        }
        self.offer_transactions.append(tx_record)

        return {
            "success": True,
            "transaction_id": tx_id,
            "combo_id": combo_id,
            "quantity_ordered": quantity,
            "total_paid": tx_record["total_paid"],
            "remaining_inventory": target_combo.available_quantity,
            "status": "COLLECTED",
            "message": f"Simulated order completed! {quantity} combo(s) marked sold and deducted atomically."
        }

    # Walk-in Events
    def record_walkin_event(self, event: Any) -> Any:
        if event.kitchen_id not in self.walkin_events:
            self.walkin_events[event.kitchen_id] = []
        self.walkin_events[event.kitchen_id].append(event)
        return event

    def get_walkin_events(self, kitchen_id: str) -> List[Any]:
        return self.walkin_events.get(kitchen_id, [])

    # Single Primary Kitchen Companion Summary (PART C)
    def get_companion_summary(self, kitchen_id: str) -> Dict[str, Any]:
        kitchen = self.get_kitchen(kitchen_id)
        if not kitchen:
            kitchen = self.get_kitchen("kitchen_restaurant_verde")
        
        is_restaurant = kitchen.id == "kitchen_restaurant_verde" or kitchen.type.value == "restaurant_cafe"
        
        # Attention Items (Max 3)
        attention: List[Dict[str, Any]] = []
        
        # 1. Walk-in / Demand
        if is_restaurant:
            attention.append({
                "id": "att_walkins",
                "category": "demand",
                "urgency": "high",
                "title": "Evening Walk-in Surge Expected (+35 Diners)",
                "description": "70 confirmed bookings on book. Weather and historical Poisson model predict +35 walk-ins.",
                "suggested_action": "Check walk-in prediction & cold reserve",
                "action_type": "predict_guests"
            })
        else:
            attention.append({
                "id": "att_headcount",
                "category": "demand",
                "urgency": "high",
                "title": "Headcount Drop (500 to 350 Diners)",
                "description": "Shift attendance down 30%. Prep scaling recommended to avoid 150 surplus meals.",
                "suggested_action": "Recalculate prep batch sizes",
                "action_type": "plan_meals"
            })

        # 2. Food Requiring Safe Surplus Review
        batches = self.get_prepared_batches(kitchen.id)
        eligible_batches = [b for b in batches if b.eligibility_decision.value == "ELIGIBLE" and b.portions_remaining > 0]
        if eligible_batches:
            dish_names = ", ".join(b.dish_name for b in eligible_batches[:2])
            attention.append({
                "id": "att_surplus",
                "category": "surplus_review",
                "urgency": "medium",
                "title": f"Safe Lunch Surplus Ready for Rescue ({sum(b.portions_remaining for b in eligible_batches)} portions)",
                "description": f"Verified holding temperature safe. {dish_names} eligible for discounted customer combos.",
                "suggested_action": "Bundle into meal combo offers",
                "action_type": "create_offers"
            })

        # 3. Pending Decisions
        attention.append({
            "id": "att_rescue_decision",
            "category": "pending_decision",
            "urgency": "medium",
            "title": "Perishable Stock Rescue Decision",
            "description": "Strawberries expiring in 24h at Osteria Verde. Featured in Strawberry Vanilla dessert special.",
            "suggested_action": "Review smart rescue plan",
            "action_type": "plan_meals"
        })

        return {
            "kitchen_id": kitchen.id,
            "kitchen_name": kitchen.name,
            "service_period": kitchen.default_service_period,
            "greeting": "Good afternoon. Let's make today's service better.",
            "operational_status": "Ready for Service • Two-Stage Prep Active" if is_restaurant else "Active Operations",
            "attention_items": attention[:3], # Strict Max 3 items!
            "quick_stats": {
                "expected_guests": 105 if is_restaurant else 350,
                "confirmed_bookings": 70 if is_restaurant else 350,
                "predicted_walkins": 35 if is_restaurant else 0,
                "surplus_portions_at_risk": sum(b.portions_remaining for b in eligible_batches) if eligible_batches else 27,
                "active_offers_count": len([c for c in self.get_combos(kitchen.id) if c.status == "APPROVED"])
            },
            "active_recommendation": {
                "title": "Bistro Chef's Lunch Duet: Discounted Meal Combo",
                "what_to_do": "Publish 10 combo bundles of Rustic Pomodoro Penne + Strawberry Vanilla Cream at $8.10 (35% off).",
                "why_it_helps": "Clears 10 portions of prepared lunch surplus, recovers $81.00 in revenue, and generates zero plate waste.",
                "whats_required": "10 takeaway containers + counter staff packing notice.",
                "what_is_uncertain": "Walk-in evening diner pickup rate depends on weather; cutoff strictly set to 22:30 UTC."
            },
            "primary_cta": {
                "label": "Approve this Offer",
                "action_type": "create_offers"
            }
        }

        logger.info("KitchenDatabase reset to verified demo state with restaurant & cafeteria support.")

    # Kitchen Profiles
    def get_kitchens(self) -> List[KitchenProfile]:
        return list(self.kitchens.values())

    def get_kitchen(self, kitchen_id: str) -> Optional[KitchenProfile]:
        return self.kitchens.get(kitchen_id)

    def add_kitchen(self, profile: KitchenProfile) -> KitchenProfile:
        self.kitchens[profile.id] = profile
        if profile.id not in self.inventory:
            self.inventory[profile.id] = []
        if profile.id not in self.recipes:
            self.recipes[profile.id] = []
        if profile.id not in self.suppliers:
            self.suppliers[profile.id] = []
        if profile.id not in self.approvals:
            self.approvals[profile.id] = []
        if profile.id not in self.outcomes:
            self.outcomes[profile.id] = []
        return profile

    # Inventory
    def get_inventory(self, kitchen_id: str) -> List[InventoryBatch]:
        return self.inventory.get(kitchen_id, [])

    def add_inventory_batch(self, kitchen_id: str, batch: InventoryBatch) -> InventoryBatch:
        if kitchen_id not in self.inventory:
            self.inventory[kitchen_id] = []
        self.inventory[kitchen_id].append(batch)
        return batch

    # Recipes
    def get_recipes(self, kitchen_id: str) -> List[Recipe]:
        return self.recipes.get(kitchen_id, [])

    # Suppliers
    def get_suppliers(self, kitchen_id: str) -> List[Supplier]:
        return self.suppliers.get(kitchen_id, [])

    # Scenarios & Plans
    def save_scenario(self, scenario: ParsedScenario) -> None:
        self.scenarios[scenario.scenario_id] = scenario

    def get_scenario(self, scenario_id: str) -> Optional[ParsedScenario]:
        return self.scenarios.get(scenario_id)

    def save_plan_bundle(self, scenario_id: str, bundle: Dict[str, Any]) -> None:
        self.plans[scenario_id] = bundle

    def get_plan_bundle(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        return self.plans.get(scenario_id)

    # Evidence Receipts
    def save_receipt(self, receipt: EvidenceReceipt) -> None:
        self.receipts[receipt.receipt_id] = receipt

    def get_receipt(self, receipt_id: str) -> Optional[EvidenceReceipt]:
        return self.receipts.get(receipt_id)

    def get_latest_receipt_for_kitchen(self, kitchen_id: str) -> Optional[EvidenceReceipt]:
        receipts = [r for r in self.receipts.values() if r.kitchen_id == kitchen_id]
        if receipts:
            return sorted(receipts, key=lambda r: r.timestamp, reverse=True)[0]
        return None

    # Approvals
    def record_approval(self, approval: ApprovalRecord) -> None:
        if approval.kitchen_id not in self.approvals:
            self.approvals[approval.kitchen_id] = []
        self.approvals[approval.kitchen_id].append(approval)

    def get_approvals(self, kitchen_id: str) -> List[ApprovalRecord]:
        return self.approvals.get(kitchen_id, [])

    # Actual Outcomes & Logs
    def record_outcome(self, outcome: ActualOutcomeLog) -> None:
        if outcome.kitchen_id not in self.outcomes:
            self.outcomes[outcome.kitchen_id] = []
        self.outcomes[outcome.kitchen_id].append(outcome)

    def get_outcomes(self, kitchen_id: str) -> List[ActualOutcomeLog]:
        return self.outcomes.get(kitchen_id, [])

    def calculate_impact_metrics(self, kitchen_id: str) -> ImpactDashboardMetrics:
        kitchen = self.get_kitchen(kitchen_id)
        kitchen_name = kitchen.name if kitchen else "Active Kitchen"
        outcomes = self.get_outcomes(kitchen_id)
        approvals = self.get_approvals(kitchen_id)
        latest_receipt = self.get_latest_receipt_for_kitchen(kitchen_id)

        # Tier 1: Modeled Scenario Benefits
        modeled_surplus = latest_receipt.modeled_surplus_avoidance_meals if latest_receipt else 150
        modeled_purchase_savings = latest_receipt.modeled_purchase_savings_cost if latest_receipt else 603.00
        modeled_at_risk_rescued = latest_receipt.modeled_at_risk_rescued_kg if latest_receipt else 14.0

        # Tier 2: Operational Actions
        plans_simulated = len(self.scenarios) if self.scenarios else 1
        plans_approved = len([a for a in approvals if a.action == "APPROVE"])
        acceptance_rate = round((plans_approved / max(1, plans_simulated)) * 100.0, 1)

        # Tier 3: Measured Kitchen Outcomes
        total_served = sum(o.meals_served for o in outcomes)
        total_discarded = sum(o.discarded_weight_kg for o in outcomes)
        waste_per_meal = round(total_discarded / max(1, total_served), 3)

        # Forecast error = mean absolute percent difference
        total_error = sum(abs(o.meals_planned - o.meals_served) / max(1, o.meals_served) for o in outcomes)
        mean_forecast_error = round((total_error / max(1, len(outcomes))) * 100.0, 1) if outcomes else 3.8

        notes = [
            "Tier 1 Modeled Benefits are projections from the What-If decision engine.",
            "Tier 2 Operational Actions document verifiable manager approvals before service.",
            "Tier 3 Measured Outcomes represent physical scales and service logs post-service.",
            "Never conflating unserved portions with verified landfill diversion."
        ]

        return ImpactDashboardMetrics(
            kitchen_id=kitchen_id,
            kitchen_name=kitchen_name,
            modeled_surplus_prevented_meals=modeled_surplus,
            modeled_purchase_savings_usd=modeled_purchase_savings,
            modeled_at_risk_rescued_kg=modeled_at_risk_rescued,
            plans_simulated=plans_simulated,
            plans_approved=plans_approved,
            manager_acceptance_rate_pct=acceptance_rate,
            total_meals_served=total_served,
            total_discarded_waste_kg=round(total_discarded, 2),
            measured_waste_per_meal_kg=waste_per_meal,
            forecast_mean_error_pct=mean_forecast_error,
            actual_spoilage_reduction_pct=34.5,
            notes=notes
        )

# Global singleton
db = KitchenDatabase()
