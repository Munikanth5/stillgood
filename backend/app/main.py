import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional

from app.models.schemas import (
    KitchenProfile, InventoryBatch, Recipe, Supplier,
    DisruptionInput, ParsedScenario, PlanEvaluation,
    EvidenceReceipt, ApprovalRequest, ApprovalRecord,
    ActualOutcomeLog, ImpactDashboardMetrics,
    KitchenContext, TemporaryDisruption, DisruptionProposalResponse,
    ConfirmDisruptionRequest, ResolveDisruptionRequest,
    RecordDisposalRequest, RecordDonationRequest,
    ConfirmedCustomerOrder, CreateCustomerOrderRequest, MenuPreparationPlan
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

# ==========================================
# STILLGOOD 3.0 API ENDPOINTS
# ==========================================

from app.models.schemas import (
    PreparedFoodBatch, PreparedFoodIntakeRequest, WalkinForecastResult,
    WalkinEvent, MealComboProposal, MealOfferOrderRequest,
    MealOfferOrderResult, KitchenCompanionSummary
)
from app.engine.safety_gate import DeterministicSafetyGate
from app.engine.walkin_forecaster import WalkinDemandForecaster
from app.ai.meal_combo_generator import GeminiMealComboGenerator

# --- 1. Kitchen Companion Summary ---
@app.get("/api/kitchens/{kitchen_id}/companion-summary", response_model=KitchenCompanionSummary)
def get_companion_summary(kitchen_id: str):
    return db.get_companion_summary(kitchen_id)

# --- 2. Post-Service Prepared Food Rescue ---
@app.get("/api/kitchens/{kitchen_id}/prepared-food", response_model=List[PreparedFoodBatch])
def get_prepared_batches(kitchen_id: str):
    return db.get_prepared_batches(kitchen_id)

@app.post("/api/kitchens/{kitchen_id}/prepared-food", response_model=PreparedFoodBatch)
def intake_prepared_food(kitchen_id: str, req: PreparedFoodIntakeRequest):
    import time
    decision, reason, action, rule_checks = DeterministicSafetyGate.evaluate_prepared_batch(req)
    
    batch = PreparedFoodBatch(
        id=f"PREP-{kitchen_id[:3].upper()}-{int(time.time() * 1000) % 100000}",
        kitchen_id=kitchen_id,
        dish_name=req.dish_name,
        recipe_id=req.recipe_id,
        portions_remaining=req.portions_remaining,
        portions_initially_available=req.portions_remaining,
        prepared_at=req.prepared_at,
        service_period=req.service_period,
        served_to_customer=req.served_to_customer,
        buffet_exposed=req.buffet_exposed,
        continuously_controlled=req.continuously_controlled,
        holding_temperature_c=req.holding_temperature_c,
        holding_duration_hours=req.holding_duration_hours,
        safe_use_cutoff=req.safe_use_cutoff,
        allergens=req.allergens,
        dietary_tags=[],
        status="safe_holding" if decision.value == "ELIGIBLE" else ("blocked_review" if decision.value == "NEEDS_STAFF_REVIEW" else "ineligible"),
        eligibility_decision=decision,
        eligibility_reason=reason,
        recommended_action=action,
        rule_checks=rule_checks,
        notes=req.notes,
        is_demo=True,
        created_at=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    )
    return db.add_prepared_batch(batch)

# --- 3. Walk-in Demand Forecasting ---
@app.get("/api/kitchens/{kitchen_id}/walkin-forecast", response_model=WalkinForecastResult)
def get_walkin_forecast(
    kitchen_id: str,
    cancellations: int = 0,
    current_walkins: int = 0,
    manager_override: Optional[int] = None,
    manager_override_reason: Optional[str] = None
):
    kitchen = db.get_kitchen(kitchen_id)
    if not kitchen:
        kitchen = db.get_kitchen("kitchen_restaurant_verde")
    
    # Check live recorded walkin arrivals in DB
    db_walkin_count = sum(getattr(e, "party_size", 1) for e in db.get_walkin_events(kitchen_id))
    effective_walkins = max(current_walkins, db_walkin_count)

    return WalkinDemandForecaster.generate_forecast(
        kitchen=kitchen,
        service_period=kitchen.default_service_period,
        current_walkin_count=effective_walkins,
        cancellations_count=cancellations,
        manager_override=manager_override,
        manager_override_reason=manager_override_reason
    )

@app.post("/api/kitchens/{kitchen_id}/walkin-event", response_model=WalkinEvent)
def record_walkin_event(kitchen_id: str, event: WalkinEvent):
    event.kitchen_id = kitchen_id
    return db.record_walkin_event(event)

# --- 4. Meal Combos & Offers ---
@app.get("/api/kitchens/{kitchen_id}/combos", response_model=List[MealComboProposal])
def get_combos(kitchen_id: str):
    return db.get_combos(kitchen_id)

@app.post("/api/kitchens/{kitchen_id}/combos/generate", response_model=List[MealComboProposal])
def generate_combos(kitchen_id: str):
    batches = db.get_prepared_batches(kitchen_id)
    eligible = [b for b in batches if b.eligibility_decision.value == "ELIGIBLE" and b.portions_remaining > 0]
    combos = GeminiMealComboGenerator.generate_combos(kitchen_id, eligible)
    for c in combos:
        db.save_combo(c)
    return combos

@app.post("/api/kitchens/{kitchen_id}/combos/{combo_id}/publish", response_model=MealComboProposal)
def publish_combo(kitchen_id: str, combo_id: str, selected_price: Optional[float] = None):
    combos = db.get_combos(kitchen_id)
    target = next((c for c in combos if c.combo_id == combo_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Combo not found")
    if selected_price:
        target.selected_price = selected_price
    target.status = "APPROVED"
    db.save_combo(target)
    return target

@app.post("/api/combos/{combo_id}/order", response_model=MealOfferOrderResult)
def order_combo(combo_id: str, req: MealOfferOrderRequest):
    result = db.order_combo(combo_id=combo_id, quantity=req.quantity, customer_name=req.customer_name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return MealOfferOrderResult(
        success=result["success"],
        transaction_id=result["transaction_id"],
        combo_id=result["combo_id"],
        quantity_ordered=result["quantity_ordered"],
        total_paid=result["total_paid"],
        remaining_inventory=result["remaining_inventory"],
        status=result["status"],
        message=result["message"]
    )

# --- 5. Dynamic Kitchen Context & Disruption Lifecycle (PART 1) ---
@app.get("/api/kitchens/{kitchen_id}/context", response_model=KitchenContext)
def get_kitchen_context(kitchen_id: str):
    return db.get_kitchen_context(kitchen_id)

@app.get("/api/kitchens/{kitchen_id}/disruptions", response_model=List[TemporaryDisruption])
def get_disruptions(kitchen_id: str, active_only: bool = True):
    return db.get_disruptions(kitchen_id, active_only=active_only)

@app.post("/api/disruptions/extract-proposal", response_model=DisruptionProposalResponse)
def extract_disruption_proposal(payload: DisruptionInput):
    kitchen_id = payload.kitchen_id or "kitchen_restaurant_verde"
    return DisruptionInterpreter.extract_disruption_proposal(payload.raw_text, kitchen_id)

@app.post("/api/disruptions/confirm", response_model=TemporaryDisruption)
def confirm_disruption(req: ConfirmDisruptionRequest):
    try:
        return db.confirm_disruption(req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/disruptions/resolve", response_model=TemporaryDisruption)
def resolve_disruption(req: ResolveDisruptionRequest):
    try:
        return db.resolve_disruption(req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# --- 6. Operational Surplus Handover & Disposal (PART 3) ---
@app.post("/api/kitchens/{kitchen_id}/prepared-food/dispose", response_model=PreparedFoodBatch)
def record_disposal(kitchen_id: str, req: RecordDisposalRequest):
    try:
        return db.record_disposal(req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/kitchens/{kitchen_id}/prepared-food/donate", response_model=PreparedFoodBatch)
def record_donation(kitchen_id: str, req: RecordDonationRequest):
    try:
        return db.record_donation(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 7. Menu-Based Demand & Confirmed Customer Orders (Plan My Food) ---
@app.get("/api/kitchens/{kitchen_id}/orders", response_model=List[ConfirmedCustomerOrder])
def get_customer_orders(kitchen_id: str, status: Optional[str] = None):
    return db.get_customer_orders(kitchen_id, status=status)

@app.post("/api/kitchens/{kitchen_id}/orders", response_model=ConfirmedCustomerOrder)
def create_customer_order(kitchen_id: str, req: CreateCustomerOrderRequest):
    import time
    from datetime import datetime, timezone
    order_id = f"ORD-{kitchen_id[-3:].upper()}-{int(time.time() * 1000) % 10000}"
    order = ConfirmedCustomerOrder(
        order_id=order_id,
        kitchen_id=kitchen_id,
        table_number=req.table_number or "Table 1",
        party_size=req.party_size,
        timestamp=datetime.now(timezone.utc).strftime("%H:%M UTC"),
        status="CONFIRMED",
        items=req.items,
        server_name=req.server_name or "Staff"
    )
    return db.record_customer_order(order)

@app.post("/api/kitchens/{kitchen_id}/orders/{order_id}/cancel", response_model=ConfirmedCustomerOrder)
def cancel_customer_order(kitchen_id: str, order_id: str):
    order = db.cancel_customer_order(kitchen_id, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/kitchens/{kitchen_id}/menu-plan", response_model=MenuPreparationPlan)
def get_menu_preparation_plan(kitchen_id: str, expected_guests: Optional[int] = None):
    kitchen = db.get_kitchen(kitchen_id)
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    from app.engine.menu_demand_predictor import MenuDemandPredictor
    recipes = db.get_recipes(kitchen_id)
    inventory = db.get_inventory(kitchen_id)
    prepared_batches = db.get_prepared_batches(kitchen_id)
    orders = db.get_customer_orders(kitchen_id)
    disruptions = db.get_disruptions(kitchen_id, active_only=True)
    
    guests = expected_guests or (70 if "verde" in kitchen_id else 500)
    confirmed_g = int(guests * 0.65)
    walkin_g = guests - confirmed_g

    return MenuDemandPredictor.generate_menu_plan(
        kitchen=kitchen,
        recipes=recipes,
        inventory=inventory,
        prepared_batches=prepared_batches,
        customer_orders=orders,
        disruptions=disruptions,
        expected_guests=guests,
        confirmed_guests=confirmed_g,
        walkin_guests=walkin_g,
        service_period=kitchen.default_service_period
    )

# Static Frontend SPA Serving (Cloud Run unified deployment)
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # Check if requesting a direct static file in static_dir (e.g. vite.svg, favicon)
        target_file = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        
        index_file = os.path.join(static_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build not found")



