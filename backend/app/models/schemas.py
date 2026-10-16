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
    actual_spoilage_reduction_pct: float
    notes: List[str]
