from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class KitchenType(str, Enum):
    RESTAURANT_CAFE = "restaurant_cafe"
    HOTEL_BUFFET = "hotel_buffet"
    SCHOOL_CANTEEN = "school_canteen"
    CORPORATE_CAFETERIA = "corporate_cafeteria"
    HOSPITAL_HEALTHCARE = "hospital_healthcare"
    FACTORY_INDUSTRIAL = "factory_industrial"
    CATERING_EVENT = "catering_event"
    COMMUNITY_NGO = "community_ngo"

class DietaryTag(str, Enum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    HALAL = "halal"
    KOSHER = "kosher"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    NUT_FREE = "nut_free"
    LOW_SODIUM = "low_sodium"
    DIABETIC_FRIENDLY = "diabetic_friendly"

class StorageType(str, Enum):
    DRY = "dry"
    COLD = "cold"
    FROZEN = "frozen"

class BatchStorageStatus(str, Enum):
    OPTIMAL = "optimal"
    NEAR_EXPIRY = "near_expiry"
    EXPIRED = "expired"
    QUARANTINED = "quarantined"

class BatchEligibility(str, Enum):
    ELIGIBLE = "eligible"
    AT_RISK = "at_risk"  # Eligible but expires within 24-48 hrs, high priority to use
    INELIGIBLE = "ineligible"  # Expired, spoiled, or quarantined

class KitchenProfile(BaseModel):
    id: str
    name: str
    type: KitchenType
    tagline: str
    capacity_meals_per_service: int
    default_service_period: str
    currency: str = "USD"
    timezone: str = "UTC"
    description: str
    is_sample: bool = True
    dietary_strictness: str = "standard"  # "clinical_strict" for hospitals
    primary_demand_driver: str  # e.g., "Office Attendance", "Table Bookings", "Room Occupancy"
    confirmed_reservations: int = 70
    predicted_walkins: int = 35
    menu_type: str = "Fixed Printed Menu"
    stage_1_prep_label: str = "Stage 1: Pre-Service Hot Prep (Cook before doors open)"
    stage_2_prep_label: str = "Stage 2: Quick-Fire Cold Reserve (Portioned in cooler for walk-ins)"

class Ingredient(BaseModel):
    id: str
    name: str
    category: str  # produce, dairy, protein, grains, pantry, spices
    unit: str  # kg, l, count
    cost_per_unit: float
    min_order_qty: float = 1.0
    pack_size: float = 1.0
    storage_type: StorageType = StorageType.COLD

class InventoryBatch(BaseModel):
    id: str
    kitchen_id: str
    ingredient_id: str
    ingredient_name: str
    batch_code: str
    received_date: str
    expiry_date: str
    initial_qty: float
    remaining_qty: float
    reserved_qty: float = 0.0
    unit: str
    unit_cost: float
    storage_status: BatchStorageStatus
    eligibility_status: BatchEligibility
    notes: Optional[str] = None

class RecipeIngredient(BaseModel):
    ingredient_id: str
    ingredient_name: str
    qty_per_portion: float
    unit: str
    is_core: bool = True
    allowed_substitutions: List[str] = []

class Recipe(BaseModel):
    id: str
    kitchen_id: str
    name: str
    category: str  # main, side, soup, salad, dessert
    dietary_tags: List[DietaryTag]
    portion_size_grams: int
    base_prep_time_minutes: int
    allergens: List[str] = []
    ingredients: List[RecipeIngredient]
    cost_per_portion: float
    approved: bool = True
    version: int = 1

class Supplier(BaseModel):
    id: str
    name: str
    contact: str
    lead_time_hours: int
    cutoff_time: str  # e.g., "08:00 AM"
    minimum_order_value: float
    supplies_ingredients: List[str]
    status: str = "active"  # "active", "delayed", "unavailable"
    delay_notes: Optional[str] = None

class DisruptionInput(BaseModel):
    raw_text: str
    kitchen_id: Optional[str] = "kitchen_corporate_apex"
    file_content_base64: Optional[str] = None
    file_type: Optional[str] = None

class ParsedScenario(BaseModel):
    scenario_id: str
    kitchen_id: str
    original_expected_meals: int
    revised_expected_meals: int
    service_buffer_percentage: float = 5.0
    confirmed_reservations: Optional[int] = 70
    predicted_walkins: Optional[int] = 35
    supplier_disruptions: List[Dict[str, Any]] = []
    dietary_constraints: List[Dict[str, Any]] = []
    inventory_priorities: List[str] = []
    excluded_ingredients: List[str] = []
    raw_explanation: str
    confidence: float = 0.95
    extraction_source: str = "Gemini 2.5 Flash / GenAI SDK"

class PlanItem(BaseModel):
    recipe_id: str
    recipe_name: str
    portions: int
    dietary_tags: List[DietaryTag]
    cost_per_portion: float
    total_cost: float

class ConstraintCheckResult(BaseModel):
    constraint_name: str
    category: str  # "dietary", "supplier_cutoff", "inventory", "capacity", "allergen"
    passed: bool
    target_value: str
    actual_value: str
    message: str

class PlanEvaluation(BaseModel):
    plan_id: str
    plan_type: str  # PLAN_A_ORIGINAL, PLAN_B_SIMPLE_SCALE, PLAN_C_SMART_RESCUE, PLAN_REJECTED_CANDIDATE
    title: str
    subtitle: str
    is_recommended: bool
    feasibility_status: str  # FEASIBLE, INFEASIBLE, NEEDS_HUMAN_REVIEW
    meals_covered: int
    total_portions: int
    planned_items: List[PlanItem]
    ingredient_requirements: List[Dict[str, Any]]
    inventory_allocated: List[Dict[str, Any]]
    shortages: List[Dict[str, Any]]
    purchases_required: List[Dict[str, Any]]
    total_purchase_cost: float
    at_risk_inventory_utilized_kg: float
    at_risk_inventory_utilized_value: float
    expected_surplus_meals: int
    operational_complexity: str  # LOW, MEDIUM, HIGH
    constraint_check_results: List[ConstraintCheckResult]
    rejection_reasons: List[str] = []
    summary_explanation: str
    why_gemini_suggested: Optional[str] = None
    two_stage_prep: Optional[Dict[str, Any]] = None
    reservation_breakdown: Optional[Dict[str, Any]] = None

class EvidenceReceipt(BaseModel):
    receipt_id: str
    timestamp: str
    kitchen_id: str
    kitchen_name: str
    disruption_summary: str
    original_assumptions: Dict[str, Any]
    revised_assumptions: Dict[str, Any]
    forecast_method: str
    recipes_evaluated: List[Dict[str, Any]]
    inventory_batches_allocated: List[Dict[str, Any]]
    ingredient_calculations: List[Dict[str, Any]]
    purchasing_calculations: List[Dict[str, Any]]
    constraints_verified: List[ConstraintCheckResult]
    rejected_alternatives: List[Dict[str, Any]]
    remaining_uncertainty: List[str]
    manager_approval_required: bool = True
    modeled_surplus_avoidance_meals: int
    modeled_purchase_savings_cost: float
    modeled_at_risk_rescued_kg: float

class ApprovalRequest(BaseModel):
    plan_id: str
    kitchen_id: str
    approver_name: str = "Kitchen Operations Manager"
    action: str  # "APPROVE" or "REJECT"
    notes: Optional[str] = None

class ApprovalRecord(BaseModel):
    approval_id: str
    plan_id: str
    kitchen_id: str
    approver_name: str
    action: str
    approved_at: str
    notes: Optional[str] = None
    plan_snapshot: Dict[str, Any]

class ActualOutcomeLog(BaseModel):
    id: str
    kitchen_id: str
    plan_id: Optional[str] = None
    service_date: str
    service_period: str
    meals_planned: int
    meals_prepared: int
    meals_served: int
    unserved_portions: int
    discarded_weight_kg: float
    ingredient_spoilage_kg: float
    prep_waste_kg: float
    plate_waste_kg: float
    stockouts_count: int
    notes: Optional[str] = None
    is_sample: bool = True

class ImpactDashboardMetrics(BaseModel):
    kitchen_id: str
    kitchen_name: str
    # Tier 1: Modeled Scenario Benefits
    modeled_surplus_prevented_meals: int
    modeled_purchase_savings_usd: float
    modeled_at_risk_rescued_kg: float
    # Tier 2: Operational Actions
    plans_simulated: int
    plans_approved: int
    manager_acceptance_rate_pct: float
    # Tier 3: Measured Kitchen Outcomes
    total_meals_served: int
    total_discarded_waste_kg: float
    measured_waste_per_meal_kg: float
    forecast_mean_error_pct: float
    notes: List[str]

# ==========================================
# STILLGOOD 3.0 EXTENSIONS
# ==========================================

class PreparedFoodStatus(str, Enum):
    PREPARED_UNSERVED = "prepared_unserved"
    SAFE_HOLDING = "safe_holding"
    OFFERED_FOR_SALE = "offered_for_sale"
    RESERVED = "reserved"
    SOLD = "sold"
    ELIGIBLE_DONATION = "eligible_donation"
    BLOCKED_REVIEW = "blocked_review"
    INELIGIBLE = "ineligible"
    DISPOSED = "disposed"
    OUTCOME_VERIFIED = "outcome_verified"

class SafetyDecision(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    NEEDS_STAFF_REVIEW = "NEEDS_STAFF_REVIEW"
    INELIGIBLE = "INELIGIBLE"

class RecommendedRescueAction(str, Enum):
    ORDINARY_SALE = "ORDINARY_SALE"
    DISCOUNTED_COMBO = "DISCOUNTED_COMBO"
    NEXT_SERVICE_REUSE = "NEXT_SERVICE_REUSE"
    DONATION = "DONATION"
    DISPOSAL = "DISPOSAL"

class SafetyRuleCheck(BaseModel):
    rule_name: str
    passed: bool
    observed_value: str
    threshold: str
    message: str
    critical_for_safety: bool = True

class PreparedFoodBatch(BaseModel):
    id: str
    kitchen_id: str
    dish_name: str
    recipe_id: Optional[str] = None
    portions_remaining: int
    portions_initially_available: int
    prepared_at: str
    service_period: str  # breakfast, lunch, dinner, buffet, event, catering
    served_to_customer: bool = False  # If true -> instantly disqualified
    buffet_exposed: bool = False      # If true and > 2h -> ineligible for resale
    continuously_controlled: bool = True # Held by staff at >= 63C or <= 5C
    holding_temperature_c: float
    holding_duration_hours: float
    safe_use_cutoff: str
    allergens: List[str] = []
    dietary_tags: List[DietaryTag] = []
    status: PreparedFoodStatus = PreparedFoodStatus.PREPARED_UNSERVED
    eligibility_decision: SafetyDecision = SafetyDecision.NEEDS_STAFF_REVIEW
    eligibility_reason: str = ""
    recommended_action: RecommendedRescueAction = RecommendedRescueAction.DISCOUNTED_COMBO
    rule_checks: List[SafetyRuleCheck] = []
    portions_sold: int = 0
    portions_included_in_offers: int = 0
    portions_donated: int = 0
    portions_disposed: int = 0
    measured_disposal_weight_kg: float = 0.0
    notes: Optional[str] = None
    is_demo: bool = True
    created_at: Optional[str] = None

class PreparedFoodIntakeRequest(BaseModel):
    kitchen_id: str
    dish_name: str
    recipe_id: Optional[str] = None
    portions_remaining: int
    prepared_at: str
    service_period: str
    served_to_customer: bool = False
    buffet_exposed: bool = False
    continuously_controlled: bool = True
    holding_temperature_c: float
    holding_duration_hours: float
    safe_use_cutoff: str
    allergens: List[str] = []
    dietary_tags: List[str] = []
    notes: Optional[str] = None

class WalkinIntervalForecast(BaseModel):
    time_slot: str  # e.g., "12:30 - 13:00"
    expected_walkins: int
    lower_bound_90pct: int
    upper_bound_90pct: int
    is_current_slot: bool = False

class WalkinForecastResult(BaseModel):
    kitchen_id: str
    service_period: str
    timestamp: str
    interval_minutes: int = 30
    confirmed_reservations: int
    expected_reservation_attendance: int
    predicted_walkins_next_30m: int
    walkin_prediction_interval: List[int] # [lower, upper]
    total_expected_covers_today: int
    high_demand_scenario: int
    low_demand_scenario: int
    current_recorded_arrivals: int
    remaining_seating_capacity: int
    extra_prep_batch_recommendation: str
    model_name: str
    model_confidence: str  # HIGH, MEDIUM, LOW_COLD_START
    evaluation_metrics: Dict[str, Any]
    data_sources_connected: List[str] = ["Osteria Verde Historical Service Logs (28 Services)", "Host-Stand Live Arrival Webhook"]
    future_walkins_expected: int = 21
    manager_override: Optional[int] = None
    manager_override_reason: Optional[str] = None
    connector_mode: str = "EVALUATED_HISTORICAL_WITH_LIVE_EVENTS"
    intervals: List[WalkinIntervalForecast]
    explanation: str

class WalkinEvent(BaseModel):
    id: str
    kitchen_id: str
    timestamp: str
    party_size: int
    event_type: str  # "walkin_arrival", "reservation_arrival", "cancellation", "takeaway"
    notes: Optional[str] = None

class ComboPriceOption(BaseModel):
    tier_name: str  # "Quick-Sale 20%", "Value-Combo 35%", "Flash Recovery 50%"
    discount_pct: int
    price: float
    margin_pct: float
    sell_through_probability: str
    trade_off_explanation: str

class MealComboProposal(BaseModel):
    combo_id: str
    kitchen_id: str
    title: str
    customer_description: str
    included_dishes: List[Dict[str, Any]]
    allergens: List[str]
    dietary_tags: List[str]
    normal_total_price: float
    cost_basis: float
    suggested_prices: List[ComboPriceOption]
    selected_price: float
    available_quantity: int
    reserved_quantity: int = 0
    sold_quantity: int = 0
    safe_pickup_cutoff: str
    status: str = "DRAFT" # DRAFT, APPROVED, ACTIVE, SOLD_OUT, EXPIRED
    why_gemini_paired: str
    deterministic_checks: List[SafetyRuleCheck]
    is_safe: bool = True
    rejection_reasons: List[str] = []

class MealOfferOrderRequest(BaseModel):
    combo_id: str
    quantity: int = 1
    customer_name: str = "In-App Demo Diner"

class MealOfferOrderResult(BaseModel):
    success: bool
    transaction_id: str
    combo_id: str
    quantity_ordered: int
    total_paid: float
    remaining_inventory: int
    status: str
    message: str

class AttentionItem(BaseModel):
    id: str
    category: str # "demand", "surplus_review", "pending_decision"
    urgency: str  # "high", "medium", "low"
    title: str
    description: str
    suggested_action: str
    action_type: str # "plan_meals", "predict_guests", "rescue_food", "create_offers"

class KitchenCompanionSummary(BaseModel):
    kitchen_id: str
    kitchen_name: str
    service_period: str
    greeting: str
    operational_status: str
    attention_items: List[AttentionItem]
    quick_stats: Dict[str, Any]
    active_recommendation: Dict[str, Any]
    primary_cta: Dict[str, Any]

# ==========================================
# PART 1: DYNAMIC KITCHEN CONTEXT & DISRUPTIONS
# ==========================================

class KitchenPolicy(BaseModel):
    version: int = 1
    kitchen_id: str
    approved_recipes_count: int
    capacity_meals_per_service: int
    dietary_strictness: str = "standard"
    dietary_exclusions_allowed: List[str] = ["dairy", "gluten", "nuts"]
    minimum_contracted_meals: int = 0
    supplier_contract_rules: List[Dict[str, Any]] = []
    approved_safety_policy: str = "FSSAI / HACCP Thermal Control Standards (2026)"
    last_updated: str = "2026-10-18 00:00 UTC"

class KitchenOperationalFacts(BaseModel):
    kitchen_id: str
    eligible_inventory_batches_count: int
    at_risk_inventory_kg: float
    confirmed_reservations: int
    current_recorded_arrivals: int
    active_supplier_orders_count: int
    prepared_meals_in_holding: int
    available_prep_capacity: int
    last_synced: str

class DisruptionStatus(str, Enum):
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
    CONFIRMED = "CONFIRMED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class TemporaryDisruption(BaseModel):
    id: str
    kitchen_id: str
    affected_entity_type: str = "ingredient"  # ingredient, supplier, recipe, service, equipment
    affected_name: str
    issue_type: str  # out_of_stock, delayed, breakdown, weather_cancellation
    start_date: str
    end_date: str
    duration_days: int = 5
    actual_resolution_time: Optional[str] = None
    source_and_evidence: str
    confirmation_status: DisruptionStatus = DisruptionStatus.PENDING_CONFIRMATION
    confirmation_needed: str
    confirmation_details: Optional[Dict[str, Any]] = None
    created_by: str = "Kitchen Operations Manager"
    created_at: str
    last_updated: str
    affected_recipe_ids: List[str] = []
    affected_recipe_names: List[str] = []
    is_active: bool = True

class DisruptionProposalResponse(BaseModel):
    extracted_disruption: TemporaryDisruption
    clarification_message: str
    confirmation_prompt: str
    options: List[Dict[str, Any]]

class ConfirmDisruptionRequest(BaseModel):
    disruption_id: str
    confirmed: bool = True
    stock_depleted: bool = True
    supplier_halted: bool = True
    notes: Optional[str] = None
    confirmed_by: str = "Kitchen Operations Manager"

class ResolveDisruptionRequest(BaseModel):
    disruption_id: str
    delivery_received: bool = True
    stock_replenished_qty: float = 0.0
    notes: Optional[str] = None
    resolved_by: str = "Kitchen Operations Manager"

class KitchenContext(BaseModel):
    kitchen: KitchenProfile
    policy: KitchenPolicy
    operational_facts: KitchenOperationalFacts
    active_disruptions: List[TemporaryDisruption]
    past_disruptions: List[TemporaryDisruption] = []

class RecordDisposalRequest(BaseModel):
    batch_id: str
    disposed_weight_kg: float
    disposal_reason: str
    disposed_by: str = "Kitchen Duty Supervisor"

class RecordDonationRequest(BaseModel):
    batch_id: str
    portions_donated: int
    partner_name: str = "City Harvest Recovery Network"
    transport_temp_c: float = 4.0
    confirmed_by: str = "Kitchen Logistics Lead"


