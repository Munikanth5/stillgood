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
