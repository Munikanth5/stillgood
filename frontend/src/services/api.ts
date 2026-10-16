import {
  KitchenProfile, InventoryBatch, Recipe, Supplier,
  ParsedScenario, PlanEvaluation, EvidenceReceipt,
  ApprovalRecord, ActualOutcomeLog, ImpactDashboardMetrics
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
