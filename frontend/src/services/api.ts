import {
  KitchenProfile, InventoryBatch, Recipe, Supplier,
  ParsedScenario, PlanEvaluation, EvidenceReceipt,
  ApprovalRecord, ActualOutcomeLog, ImpactDashboardMetrics,
  KitchenCompanionSummary, PreparedFoodBatch, PreparedFoodIntakeRequest,
  WalkinForecastResult, WalkinEvent, MealComboProposal,
  MealOfferOrderRequest, MealOfferOrderResult,
  KitchenContext, TemporaryDisruption, DisruptionProposalResponse,
  ConfirmedCustomerOrder, CreateCustomerOrderRequest, MenuPreparationPlan
} from '../types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchKitchens(): Promise<KitchenProfile[]> {
  const res = await fetch(`${API_BASE}/kitchens`);
  if (!res.ok) throw new Error('Failed to fetch kitchens');
  return res.json();
}

export async function fetchKitchen(id: string): Promise<KitchenProfile> {
  const res = await fetch(`${API_BASE}/kitchens/${id}`);
  if (!res.ok) throw new Error('Failed to fetch kitchen');
  return res.json();
}

export async function createKitchen(data: Partial<KitchenProfile>): Promise<KitchenProfile> {
  const res = await fetch(`${API_BASE}/kitchens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create kitchen');
  return res.json();
}

export async function fetchInventory(kitchenId: string): Promise<InventoryBatch[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/inventory`);
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

export async function addInventoryBatch(kitchenId: string, batch: Partial<InventoryBatch>): Promise<InventoryBatch> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  });
  if (!res.ok) throw new Error('Failed to add batch');
  return res.json();
}

export async function fetchRecipes(kitchenId: string): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/recipes`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

export async function fetchSuppliers(kitchenId: string): Promise<Supplier[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/suppliers`);
  if (!res.ok) throw new Error('Failed to fetch suppliers');
  return res.json();
}

export async function interpretDisruption(rawText: string, kitchenId: string): Promise<ParsedScenario> {
  const res = await fetch(`${API_BASE}/ai/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, kitchen_id: kitchenId }),
  });
  if (!res.ok) throw new Error('Failed to interpret disruption');
  return res.json();
}

export async function extractDocument(file?: File, rawNotes?: string) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (rawNotes) formData.append('raw_notes', rawNotes);

  const res = await fetch(`${API_BASE}/ai/extract-document`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to extract document');
  return res.json();
}

export async function calculateReplan(scenario: ParsedScenario): Promise<{
  scenario: ParsedScenario;
  plans: {
    plan_a: PlanEvaluation;
    plan_b: PlanEvaluation;
    plan_c: PlanEvaluation;
    rejected_candidates: PlanEvaluation[];
  };
  receipt_id: string;
  evidence_receipt: EvidenceReceipt;
}> {
  const res = await fetch(`${API_BASE}/plans/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });
  if (!res.ok) throw new Error('Failed to calculate replan');
  return res.json();
}

export async function fetchEvidenceReceipt(receiptId: string): Promise<EvidenceReceipt> {
  const res = await fetch(`${API_BASE}/plans/evidence/${receiptId}`);
  if (!res.ok) throw new Error('Failed to fetch evidence receipt');
  return res.json();
}

export async function submitApproval(payload: {
  plan_id: string;
  kitchen_id: string;
  approver_name: string;
  action: 'APPROVE' | 'REJECT';
  notes?: string;
}): Promise<ApprovalRecord> {
  const res = await fetch(`${API_BASE}/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit approval');
  return res.json();
}

export async function fetchApprovals(kitchenId: string): Promise<ApprovalRecord[]> {
  const res = await fetch(`${API_BASE}/approvals/${kitchenId}`);
  if (!res.ok) throw new Error('Failed to fetch approvals');
  return res.json();
}

export async function fetchOutcomes(kitchenId: string): Promise<ActualOutcomeLog[]> {
  const res = await fetch(`${API_BASE}/outcomes/${kitchenId}`);
  if (!res.ok) throw new Error('Failed to fetch outcomes');
  return res.json();
}

export async function recordOutcome(log: Partial<ActualOutcomeLog>): Promise<ActualOutcomeLog> {
  const res = await fetch(`${API_BASE}/outcomes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) throw new Error('Failed to record outcome');
  return res.json();
}

export async function fetchImpactMetrics(kitchenId: string): Promise<ImpactDashboardMetrics> {
  const res = await fetch(`${API_BASE}/impact/${kitchenId}`);
  if (!res.ok) throw new Error('Failed to fetch impact metrics');
  return res.json();
}

export async function resetDemoState(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/system/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset demo');
  return res.json();
}

// ==========================================
// STILLGOOD 3.0 API METHODS
// ==========================================

export async function fetchCompanionSummary(kitchenId: string): Promise<KitchenCompanionSummary> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/companion-summary`);
  if (!res.ok) throw new Error('Failed to fetch companion summary');
  return res.json();
}

export async function fetchPreparedFood(kitchenId: string): Promise<PreparedFoodBatch[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/prepared-food`);
  if (!res.ok) throw new Error('Failed to fetch prepared food');
  return res.json();
}

export async function intakePreparedFood(kitchenId: string, payload: PreparedFoodIntakeRequest): Promise<PreparedFoodBatch> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/prepared-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to record prepared surplus food');
  }
  return res.json();
}

export async function fetchWalkinForecast(
  kitchenId: string,
  params?: {
    cancellations?: number;
    current_walkins?: number;
    manager_override?: number;
    manager_override_reason?: string;
  }
): Promise<WalkinForecastResult> {
  const query = new URLSearchParams();
  if (params?.cancellations !== undefined) query.set('cancellations', String(params.cancellations));
  if (params?.current_walkins !== undefined) query.set('current_walkins', String(params.current_walkins));
  if (params?.manager_override !== undefined) query.set('manager_override', String(params.manager_override));
  if (params?.manager_override_reason) query.set('manager_override_reason', params.manager_override_reason);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/walkin-forecast${qStr}`);
  if (!res.ok) throw new Error('Failed to fetch walk-in forecast');
  return res.json();
}

export async function recordWalkinEvent(
  kitchenId: string,
  event: { id?: string; kitchen_id?: string; party_size: number; event_type?: string; notes?: string }
): Promise<WalkinEvent> {
  const payload = {
    id: event.id || `EVT-MANUAL-${Date.now()}`,
    kitchen_id: kitchenId,
    timestamp: new Date().toISOString().substring(11, 16) + ' UTC',
    party_size: event.party_size,
    event_type: event.event_type || 'walkin_arrival',
    notes: event.notes || 'Front-of-house arrival'
  };
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/walkin-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to record walk-in arrival');
  return res.json();
}

export async function fetchCombos(kitchenId: string): Promise<MealComboProposal[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/combos`);
  if (!res.ok) throw new Error('Failed to fetch meal combos');
  return res.json();
}

export async function generateCombos(kitchenId: string): Promise<MealComboProposal[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/combos/generate`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate meal combinations');
  }
  return res.json();
}

export async function publishCombo(kitchenId: string, comboId: string): Promise<MealComboProposal> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/combos/${comboId}/publish`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to publish meal combo');
  return res.json();
}

export async function orderCombo(comboId: string, payload: MealOfferOrderRequest): Promise<MealOfferOrderResult> {
  const res = await fetch(`${API_BASE}/combos/${comboId}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to complete combo order');
  }
  return res.json();
}

// --- PART 1: Kitchen Context & Disruptions Lifecycle ---
export async function fetchKitchenContext(kitchenId: string): Promise<KitchenContext> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/context`);
  if (!res.ok) throw new Error('Failed to fetch kitchen context');
  return res.json();
}

export async function fetchDisruptions(kitchenId: string, activeOnly: boolean = true): Promise<TemporaryDisruption[]> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/disruptions?active_only=${activeOnly}`);
  if (!res.ok) throw new Error('Failed to fetch disruptions');
  return res.json();
}

export async function extractDisruptionProposal(rawText: string, kitchenId: string): Promise<DisruptionProposalResponse> {
  const res = await fetch(`${API_BASE}/disruptions/extract-proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, kitchen_id: kitchenId }),
  });
  if (!res.ok) throw new Error('Failed to extract disruption proposal');
  return res.json();
}

export async function confirmDisruption(payload: {
  disruption_id: string;
  confirmed: boolean;
  stock_depleted: boolean;
  supplier_halted: boolean;
  notes?: string;
}): Promise<TemporaryDisruption> {
  const res = await fetch(`${API_BASE}/disruptions/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to confirm disruption');
  return res.json();
}

export async function resolveDisruption(payload: {
  disruption_id: string;
  delivery_received: boolean;
  stock_replenished_qty?: number;
  notes?: string;
}): Promise<TemporaryDisruption> {
  const res = await fetch(`${API_BASE}/disruptions/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to resolve disruption');
  return res.json();
}

// --- PART 3: Operational Disposal & Donation ---
export async function recordDisposal(kitchenId: string, payload: {
  batch_id: string;
  disposed_weight_kg: number;
  disposal_reason: string;
}): Promise<PreparedFoodBatch> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/prepared-food/dispose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to record food disposal');
  }
  return res.json();
}

export async function recordDonation(kitchenId: string, payload: {
  batch_id: string;
  portions_donated: number;
  partner_name?: string;
  transport_temp_c?: number;
}): Promise<PreparedFoodBatch> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/prepared-food/donate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to complete donation handover');
  }
  return res.json();
}

// --- Menu-Based Demand & Confirmed Customer Orders (Plan My Food) ---
export async function fetchCustomerOrders(kitchenId: string, status?: string): Promise<ConfirmedCustomerOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/orders${query}`);
  if (!res.ok) throw new Error('Failed to fetch customer orders');
  return res.json();
}

export async function recordCustomerOrder(kitchenId: string, req: CreateCustomerOrderRequest): Promise<ConfirmedCustomerOrder> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to record customer order');
  return res.json();
}

export async function cancelCustomerOrder(kitchenId: string, orderId: string): Promise<ConfirmedCustomerOrder> {
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/orders/${orderId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to cancel customer order');
  return res.json();
}

export async function fetchMenuPlan(kitchenId: string, expectedGuests?: number): Promise<MenuPreparationPlan> {
  const query = expectedGuests ? `?expected_guests=${expectedGuests}` : '';
  const res = await fetch(`${API_BASE}/kitchens/${kitchenId}/menu-plan${query}`);
  if (!res.ok) throw new Error('Failed to fetch menu preparation plan');
  return res.json();
}


