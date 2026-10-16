from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

from app.models.schemas import (
    KitchenProfile, InventoryBatch, Recipe, Supplier,
    DisruptionInput, ParsedScenario, PlanEvaluation,
    EvidenceReceipt, ApprovalRequest, ApprovalRecord,
    ActualOutcomeLog, ImpactDashboardMetrics
)
from app.core.database import db
from app.ai.gemini_client import gemini_service
from app.ai.disruption_interpreter import DisruptionInterpreter
from app.ai.document_extractor import DocumentExtractor
from app.engine.rescue_planner import RescuePlanner
from app.engine.evidence_builder import EvidenceBuilder

app = FastAPI(
    title="STILLGOOD — No-Meal-Left-Behind AI Kitchen Decision Twin",
    description="Kitchen Decision Twin API optimizing demand forecasting, inventory utilization, and surplus prevention.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def get_health():
    ai_status = gemini_service.get_status()
    return {
        "status": "healthy",
        "service": "STILLGOOD AI Kitchen Decision Twin",
        "version": "1.0.0",
        "ai_integration": ai_status
    }

# --- Kitchens ---
@app.get("/api/kitchens", response_model=List[KitchenProfile])
def list_kitchens():
    return db.get_kitchens()

@app.get("/api/kitchens/{kitchen_id}", response_model=KitchenProfile)
def get_kitchen(kitchen_id: str):
    k = db.get_kitchen(kitchen_id)
    if not k:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    return k

@app.post("/api/kitchens", response_model=KitchenProfile)
def create_kitchen(profile: KitchenProfile):
    return db.add_kitchen(profile)

# --- Inventory & Recipes ---
@app.get("/api/kitchens/{kitchen_id}/inventory", response_model=List[InventoryBatch])
def get_kitchen_inventory(kitchen_id: str):
    return db.get_inventory(kitchen_id)

@app.post("/api/kitchens/{kitchen_id}/inventory", response_model=InventoryBatch)
def add_kitchen_inventory_batch(kitchen_id: str, batch: InventoryBatch):
    return db.add_inventory_batch(kitchen_id, batch)

@app.get("/api/kitchens/{kitchen_id}/recipes", response_model=List[Recipe])
def get_kitchen_recipes(kitchen_id: str):
    return db.get_recipes(kitchen_id)

@app.get("/api/kitchens/{kitchen_id}/suppliers", response_model=List[Supplier])
def get_kitchen_suppliers(kitchen_id: str):
    return db.get_suppliers(kitchen_id)

# --- AI Disruption Assistant ---
@app.post("/api/ai/interpret", response_model=ParsedScenario)
def interpret_disruption(payload: DisruptionInput):
    kitchen_id = payload.kitchen_id or "kitchen_corporate_apex"
    scenario = DisruptionInterpreter.interpret(payload.raw_text, kitchen_id)
    db.save_scenario(scenario)
    return scenario

@app.post("/api/ai/extract-document")
def extract_document(
    file: Optional[UploadFile] = File(None),
    raw_notes: Optional[str] = Form(None)
):
    b64_content = None
    file_type = "image/jpeg"
    if file:
        file_bytes = file.file.read()
        import base64
        b64_content = base64.b64encode(file_bytes).decode("utf-8")
        file_type = file.content_type or "image/jpeg"
    
    extracted = DocumentExtractor.extract_from_content(
        file_content_base64=b64_content,
        file_type=file_type,
        raw_notes=raw_notes
    )
    return extracted

# --- Planning & What-If Simulation Engine ---
@app.post("/api/plans/replan")
def calculate_replan(scenario: ParsedScenario):
    kitchen = db.get_kitchen(scenario.kitchen_id)
    if not kitchen:
        kitchen = db.get_kitchen("kitchen_corporate_apex")
    
    recipes = db.get_recipes(kitchen.id)
    inventory = db.get_inventory(kitchen.id)
    ingredients = list(db.ingredients.values())
    suppliers = db.get_suppliers(kitchen.id)

    planner = RescuePlanner(
        kitchen=kitchen,
        recipes=recipes,
        inventory=inventory,
        ingredients=ingredients,
        suppliers=suppliers
    )

    plan_bundle = planner.generate_all_scenario_plans(scenario)
    db.save_plan_bundle(scenario.scenario_id, plan_bundle)

    # Build Evidence Receipt for recommended Plan C
    receipt = EvidenceBuilder.build_receipt(
        kitchen=kitchen,
        scenario=scenario,
        recommended_plan=plan_bundle["plan_c"],
        baseline_plan_a=plan_bundle["plan_a"],
        rejected_candidates=plan_bundle["rejected_candidates"],
        recipes_by_id={r.id: r for r in recipes}
    )
    db.save_receipt(receipt)

    return {
        "scenario": scenario,
        "plans": plan_bundle,
        "receipt_id": receipt.receipt_id,
        "evidence_receipt": receipt
    }

@app.get("/api/plans/evidence/{receipt_id}", response_model=EvidenceReceipt)
def get_receipt(receipt_id: str):
    receipt = db.get_receipt(receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

# --- Manager Approvals ---
@app.post("/api/approvals", response_model=ApprovalRecord)
def approve_plan(req: ApprovalRequest):
    from datetime import datetime, timezone
    now_utc = datetime.now(timezone.utc)
    approval = ApprovalRecord(
        approval_id=f"APPR-{now_utc.strftime('%Y%m%d%H%M%S')}",
        plan_id=req.plan_id,
        kitchen_id=req.kitchen_id,
        approver_name=req.approver_name,
        action=req.action,
        approved_at=now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),
        notes=req.notes,
        plan_snapshot={"plan_id": req.plan_id, "action": req.action}
    )
    db.record_approval(approval)
    return approval

@app.get("/api/approvals/{kitchen_id}", response_model=List[ApprovalRecord])
def get_approvals(kitchen_id: str):
    return db.get_approvals(kitchen_id)

# --- Outcomes & Impact Dashboard ---
@app.get("/api/outcomes/{kitchen_id}", response_model=List[ActualOutcomeLog])
def get_outcomes(kitchen_id: str):
    return db.get_outcomes(kitchen_id)

@app.post("/api/outcomes", response_model=ActualOutcomeLog)
def record_outcome(log: ActualOutcomeLog):
    db.record_outcome(log)
    return log

@app.get("/api/impact/{kitchen_id}", response_model=ImpactDashboardMetrics)
def get_impact_dashboard(kitchen_id: str):
    return db.calculate_impact_metrics(kitchen_id)

# --- Demo Reset ---
@app.post("/api/system/reset")
def reset_system():
    db.reset_to_demo()
    return {"status": "success", "message": "Demo data reset to verified initial state."}
