export type KitchenType =
  | 'restaurant_cafe'
  | 'hotel_buffet'
  | 'school_canteen'
  | 'corporate_cafeteria'
  | 'hospital_healthcare'
  | 'factory_industrial'
  | 'catering_event'
  | 'community_ngo';

export interface KitchenProfile {
  id: string;
  name: string;
  type: KitchenType;
  tagline: string;
  capacity_meals_per_service: number;
  default_service_period: string;
  currency: string;
  timezone: string;
  description: string;
  is_sample: boolean;
  dietary_strictness: string;
  primary_demand_driver: string;
  confirmed_reservations?: number;
  predicted_walkins?: number;
  menu_type?: string;
  stage_1_prep_label?: string;
  stage_2_prep_label?: string;
}

export interface InventoryBatch {
  id: string;
  kitchen_id: string;
  ingredient_id: string;
  ingredient_name: string;
  batch_code: string;
  received_date: string;
  expiry_date: string;
  initial_qty: number;
  remaining_qty: number;
  reserved_qty: number;
  unit: string;
  unit_cost: number;
  storage_status: 'optimal' | 'near_expiry' | 'expired' | 'quarantined';
  eligibility_status: 'eligible' | 'at_risk' | 'ineligible';
  notes?: string;
}

export interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name: string;
  qty_per_portion: number;
  unit: string;
  is_core: boolean;
  allowed_substitutions: string[];
}

export interface Recipe {
  id: string;
  kitchen_id: string;
  name: string;
  category: string;
  dietary_tags: string[];
  portion_size_grams: number;
  base_prep_time_minutes: number;
  allergens: string[];
  ingredients: RecipeIngredient[];
  cost_per_portion: number;
  approved: boolean;
  version: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  lead_time_hours: number;
  cutoff_time: string;
  minimum_order_value: number;
  supplies_ingredients: string[];
  status: string;
  delay_notes?: string;
}

export interface ParsedScenario {
  scenario_id: string;
  kitchen_id: string;
  original_expected_meals: number;
  revised_expected_meals: number;
  service_buffer_percentage: number;
  confirmed_reservations?: number;
  predicted_walkins?: number;
  supplier_disruptions: Array<{
    supplier_name: string;
    ingredient: string;
    status: string;
    detail?: string;
  }>;
  dietary_constraints: Array<{
    tag: string;
    min_meals: number;
  }>;
  inventory_priorities: string[];
  excluded_ingredients: string[];
  raw_explanation: string;
  confidence: number;
  extraction_source: string;
}

export interface PlanItem {
  recipe_id: string;
  recipe_name: string;
  portions: number;
  dietary_tags: string[];
  cost_per_portion: number;
  total_cost: number;
}

export interface ConstraintCheckResult {
  constraint_name: string;
  category: string;
  passed: boolean;
  target_value: string;
  actual_value: string;
  message: string;
}

export interface PlanEvaluation {
  plan_id: string;
  plan_type: string;
  title: string;
  subtitle: string;
  is_recommended: boolean;
  feasibility_status: 'FEASIBLE' | 'INFEASIBLE' | 'NEEDS_HUMAN_REVIEW';
  meals_covered: number;
  total_portions: number;
  planned_items: PlanItem[];
  ingredient_requirements: Array<{
    ingredient_id: string;
    ingredient_name: string;
    total_qty_needed: number;
    unit: string;
    used_in_recipes: string[];
  }>;
  inventory_allocated: Array<{
    ingredient_id: string;
    ingredient_name: string;
    batch_id: string;
    batch_code: string;
    expiry_date: string;
    allocated_qty: number;
    unit: string;
    was_at_risk: boolean;
    batch_cost: number;
  }>;
  shortages: Array<{
    ingredient_id: string;
    ingredient_name: string;
    shortage_qty: number;
    unit: string;
    used_in_recipes: string[];
  }>;
  purchases_required: Array<{
    ingredient_id: string;
    ingredient_name: string;
    shortage_qty: number;
    order_qty: number;
    pack_size: number;
    unit: string;
    unit_cost: number;
    purchase_cost: number;
  }>;
  total_purchase_cost: number;
  at_risk_inventory_utilized_kg: number;
  at_risk_inventory_utilized_value: number;
  expected_surplus_meals: number;
  operational_complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  constraint_check_results: ConstraintCheckResult[];
  rejection_reasons: string[];
  summary_explanation: string;
  why_gemini_suggested?: string;
  two_stage_prep?: {
    stage_1_portions: number;
    stage_2_portions: number;
    stage_1_label: string;
    stage_2_label: string;
    details: string[];
  };
  reservation_breakdown?: {
    confirmed_reservations: number;
    predicted_walkins: number;
    total_target: number;
  };
}

export interface EvidenceReceipt {
  receipt_id: string;
  timestamp: string;
  kitchen_id: string;
  kitchen_name: string;
  disruption_summary: string;
  original_assumptions: Record<string, any>;
  revised_assumptions: Record<string, any>;
  forecast_method: string;
  recipes_evaluated: Array<{
    recipe_id: string;
    recipe_name: string;
    version: number;
    category: string;
    portions_planned: number;
    cost_per_portion: number;
    total_cost: number;
    allergens: string[];
  }>;
  inventory_batches_allocated: any[];
  ingredient_calculations: any[];
  purchasing_calculations: any[];
  constraints_verified: ConstraintCheckResult[];
  rejected_alternatives: Array<{
    candidate_id: string;
    title: string;
    rejection_reasons: string[];
    failed_constraints: string[];
  }>;
  remaining_uncertainty: string[];
  manager_approval_required: boolean;
  modeled_surplus_avoidance_meals: number;
  modeled_purchase_savings_cost: number;
  modeled_at_risk_rescued_kg: number;
}

export interface ApprovalRecord {
  approval_id: string;
  plan_id: string;
  kitchen_id: string;
  approver_name: string;
  action: 'APPROVE' | 'REJECT';
  approved_at: string;
  notes?: string;
  plan_snapshot: Record<string, any>;
}

export interface ActualOutcomeLog {
  id: string;
  kitchen_id: string;
  plan_id?: string;
  service_date: string;
  service_period: string;
  meals_planned: number;
  meals_prepared: number;
  meals_served: number;
  unserved_portions: number;
  discarded_weight_kg: number;
  ingredient_spoilage_kg: number;
  prep_waste_kg: number;
  plate_waste_kg: number;
  stockouts_count: number;
  notes?: string;
  is_sample: boolean;
}

export interface ImpactDashboardMetrics {
  kitchen_id: string;
  kitchen_name: string;
  modeled_surplus_prevented_meals: number;
  modeled_purchase_savings_usd: number;
  modeled_at_risk_rescued_kg: number;
  plans_simulated: number;
  plans_approved: number;
  manager_acceptance_rate_pct: number;
  total_meals_served: number;
  total_discarded_waste_kg: number;
  measured_waste_per_meal_kg: number;
  forecast_mean_error_pct: number;
  actual_spoilage_reduction_pct: number;
  notes: string[];
}

// ==========================================
// STILLGOOD 3.0 EXTENSIONS
// ==========================================

export type PreparedFoodStatus =
  | 'unserved_controlled'
  | 'safe_holding'
  | 'offered_for_sale'
  | 'reserved'
  | 'sold'
  | 'eligible_for_donation'
  | 'blocked_safety_review'
  | 'ineligible'
  | 'disposed'
  | 'outcome_verified';

export type SafetyDecision =
  | 'PASS_ELIGIBLE'
  | 'NEEDS_STAFF_REVIEW'
  | 'INELIGIBLE_DISPOSE';

export type RecommendedRescueAction =
  | 'CONTINUE_ORDINARY_SALE'
  | 'OFFER_DISCOUNTED_COMBO'
  | 'REUSE_NEXT_SERVICE'
  | 'DONATE_RECOVERY_ORG'
  | 'DISPOSE_AND_LOG';

export interface SafetyRuleCheck {
  rule_id: string;
  rule_name: string;
  passed: boolean;
  critical: boolean;
  evidence_observed: string;
  reason: string;
}

export interface PreparedFoodBatch {
  id: string;
  kitchen_id: string;
  dish_name: string;
  service_period: string;
  preparation_time: string;
  portions_initially_available: number;
  portions_remaining: number;
  portions_sold: number;
  portions_donated: number;
  portions_disposed: number;
  customer_contact: boolean;
  buffet_exposed: boolean;
  buffet_exposure_hours: number;
  staff_controlled: boolean;
  holding_temp_c: number;
  safe_use_cutoff: string;
  allergen_profile: string[];
  handling_notes?: string;
  authorized_staff: string;
  safety_decision: SafetyDecision;
  rule_checks: SafetyRuleCheck[];
  recommended_action: RecommendedRescueAction;
  current_status: PreparedFoodStatus;
  created_at: string;
}

export interface PreparedFoodIntakeRequest {
  dish_name: string;
  service_period: string;
  preparation_time: string;
  portions: number;
  customer_contact: boolean;
  buffet_exposed: boolean;
  buffet_exposure_hours: number;
  staff_controlled: boolean;
  holding_temp_c: number;
  safe_use_cutoff: string;
  allergen_profile: string[];
  authorized_staff: string;
  handling_notes?: string;
}

export interface WalkinIntervalForecast {
  time_slot: string;
  expected_walkins: number;
  lower_bound_90pct: number;
  upper_bound_90pct: number;
  is_current_slot: boolean;
}

export interface WalkinForecastResult {
  kitchen_id: string;
  service_period: string;
  timestamp: string;
  interval_minutes: number;
  confirmed_reservations: number;
  expected_reservation_attendance: number;
  predicted_walkins_next_30m: number;
  walkin_prediction_interval: number[];
  total_expected_covers_today: number;
  high_demand_scenario: number;
  low_demand_scenario: number;
  current_recorded_arrivals: number;
  remaining_seating_capacity: number;
  extra_prep_batch_recommendation: string;
  model_name: string;
  model_confidence: string;
  evaluation_metrics: {
    model_type: string;
    training_window: string;
    mean_absolute_error_covers: number;
    mean_absolute_percentage_error: string;
    r_squared: number;
    reservation_turnup_rate: number;
  };
  intervals: WalkinIntervalForecast[];
  explanation: string;
}

export interface WalkinEvent {
  id: string;
  kitchen_id: string;
  timestamp: string;
  party_size: number;
  table_type: string;
  estimated_duration_minutes: number;
  notes?: string;
}

export interface ComboPriceOption {
  band_name: string;
  discount_pct: number;
  discounted_price: number;
  standard_price: number;
  gross_margin_pct: number;
  savings_amount: number;
  recommended: boolean;
}

export interface MealComboProposal {
  combo_id: string;
  kitchen_id: string;
  combo_title: string;
  description: string;
  component_batches: string[];
  component_dishes: string[];
  original_combined_price: number;
  price_options: ComboPriceOption[];
  portions_available: number;
  allergen_profile: string[];
  safe_until: string;
  status: 'draft' | 'published' | 'sold_out' | 'expired';
  created_at: string;
}

export interface MealOfferOrderRequest {
  combo_id: string;
  quantity: number;
  chosen_band: string;
  customer_name?: string;
}

export interface MealOfferOrderResult {
  success: boolean;
  order_id: string;
  combo_id: string;
  combo_title: string;
  quantity_ordered: number;
  total_price: number;
  remaining_portions: number;
  decremented_batches: Array<{
    batch_id: string;
    dish_name: string;
    decremented_by: number;
    remaining_portions: number;
  }>;
  message: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  urgency: 'high' | 'medium' | 'low';
  action_type: 'walkin' | 'prepared_rescue' | 'replan' | 'combo';
}

export interface KitchenCompanionSummary {
  kitchen_id: string;
  kitchen_name: string;
  service_period: string;
  status_message: string;
  attention_items: AttentionItem[];
  ai_recommendation: {
    title: string;
    what_to_do: string;
    why_it_helps: string;
    what_is_required: string;
    what_is_uncertain: string;
    suggested_action: string;
  };
  pending_rescue_batches_count: number;
  active_combos_count: number;
  walkins_expected_today: number;
}
