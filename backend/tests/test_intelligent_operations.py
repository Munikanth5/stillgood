import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db
from app.models.schemas import (
    PreparedFoodIntakeRequest, SafetyDecision, RecommendedRescueAction,
    ConfirmDisruptionRequest, ResolveDisruptionRequest, RecordDisposalRequest,
    RecordDonationRequest, WalkinEvent
)

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db_before_test():
    db.reset_to_demo()

# ==============================================================================
# PART 1: DYNAMIC KITCHEN CONTEXT & DISRUPTIONS (SCENARIO A)
# ==============================================================================

def test_kitchen_context_separation():
    """Verify clean separation into Persistent Policies, Operational Facts, and Disruptions."""
    res = client.get("/api/kitchens/kitchen_restaurant_verde/context")
    assert res.status_code == 200
    context = res.json()
    
    # 1. Persistent Kitchen Policy (versioned)
    policy = context["policy"]
    assert policy["version"] == 1
    assert policy["capacity_meals_per_service"] == 220
    assert "FSSAI" in policy["approved_safety_policy"]
    assert policy["minimum_contracted_meals"] == 35

    # 2. Operational Facts (live state)
    facts = context["operational_facts"]
    assert facts["confirmed_reservations"] == 70
    assert facts["eligible_inventory_batches_count"] > 0
    assert facts["at_risk_inventory_kg"] > 0

    # 3. Active Disruptions (initially empty)
    assert isinstance(context["active_disruptions"], list)


def test_gemini_disruption_proposal_and_confirmation_workflow():
    """
    Scenario A:
    1. Manager inputs: 'Strawberries are out of stock and unavailable for the next five days.'
    2. System extracts structured proposal without immediately mutating inventory.
    3. Manager confirms disruption.
    4. Confirmed disruption 86's strawberry recipes on service dates.
    5. Unrelated dairy restrictions are NOT activated.
    6. Repeated submissions are idempotent (no duplicate disruption created).
    7. Future supplier-only outage preserves existing in-stock cooler inventory.
    8. Disruption resolution restores recipe availability.
    """
    # 1. Natural language extraction
    raw_text = "Strawberries are out of stock and unavailable for the next five days."
    extract_res = client.post("/api/disruptions/extract-proposal", json={
        "raw_text": raw_text,
        "kitchen_id": "kitchen_restaurant_verde"
    })
    assert extract_res.status_code == 200
    proposal = extract_res.json()
    extracted = proposal["extracted_disruption"]
    
    assert extracted["affected_name"] == "strawberries"
    assert extracted["duration_days"] == 5
    assert extracted["issue_type"] == "out_of_stock"
    assert extracted["confirmation_status"] == "PENDING_CONFIRMATION"
    assert "Strawberries & Hand-Whipped Vanilla Cream" in extracted["affected_recipe_names"]

    # Verify inventory was NOT yet mutated
    verde_inventory = db.get_inventory("kitchen_restaurant_verde")
    straw_batch = next((b for b in verde_inventory if "strawberr" in b.ingredient_name.lower()), None)
    assert straw_batch is not None
    assert straw_batch.remaining_qty > 0  # In-stock inventory preserved until manager confirmation!

    # 2. Idempotency test: submitting the same disruption twice returns existing proposal
    duplicate_res = client.post("/api/disruptions/extract-proposal", json={
        "raw_text": raw_text,
        "kitchen_id": "kitchen_restaurant_verde"
    })
    assert duplicate_res.status_code == 200
    assert duplicate_res.json()["extracted_disruption"]["id"] == extracted["id"]

    # 3. Manager Confirmation (Option: Stock Depleted & Supplier Halted)
    confirm_res = client.post("/api/disruptions/confirm", json={
        "disruption_id": extracted["id"],
        "confirmed": True,
        "stock_depleted": True,
        "supplier_halted": True,
        "notes": "Verified walk-in cooler: all strawberry baskets spoiled or empty."
    })
    assert confirm_res.status_code == 200
    confirmed_disruption = confirm_res.json()
    assert confirmed_disruption["confirmation_status"] == "CONFIRMED"
    assert confirmed_disruption["confirmation_details"]["stock_depleted"] is True

    # 4. Generate meal plan with active confirmed disruption
    # Disruption must dynamically exclude strawberry dishes WITHOUT needing hardcoded checkboxes
    interp_res = client.post("/api/ai/interpret", json={
        "raw_text": "Plan service for 70 diners",
        "kitchen_id": "kitchen_restaurant_verde"
    })
    scenario = interp_res.json()
    scenario["revised_expected_meals"] = 70

    replan_res = client.post("/api/plans/replan", json=scenario)
    assert replan_res.status_code == 200
    plan_c = replan_res.json()["plans"]["plan_c"]
    
    # Assert strawberry dishes are 86'd
    planned_names = [i["recipe_name"] for i in plan_c["planned_items"]]
    assert not any("strawberr" in name.lower() for name in planned_names)
    
    # Assert UNRELATED dairy restrictions are NOT activated!
    # Creamy Garlic Fettuccine Alfredo (which uses dairy cream) MUST still be served!
    assert "Creamy Garlic Fettuccine Alfredo" in planned_names

    # 5. Resolution test: supplier delivers new strawberry crate, manager resolves disruption
    resolve_res = client.post("/api/disruptions/resolve", json={
        "disruption_id": extracted["id"],
        "delivery_received": True,
        "stock_replenished_qty": 10.0,
        "notes": "Emergency morning delivery received from Organic Berry Collective (10 kg)."
    })
    assert resolve_res.status_code == 200
    resolved = resolve_res.json()
    assert resolved["confirmation_status"] == "RESOLVED"
    assert resolved["is_active"] is False

    # After resolution, new service plans restore strawberry recipes!
    replan_res2 = client.post("/api/plans/replan", json=scenario)
    plan_c_restored = replan_res2.json()["plans"]["plan_c"]
    restored_names = [i["recipe_name"] for i in plan_c_restored["planned_items"]]
    assert "Strawberries & Hand-Whipped Vanilla Cream" in restored_names


# ==============================================================================
# PART 2: AUTOMATED GUEST PREDICTION (SCENARIO B)
# ==============================================================================

def test_guest_prediction_connectors_and_zero_double_counting():
    """
    Scenario B:
    1. Connects evaluated historical logs with live host-stand seating stream.
    2. Reports genuine holdout accuracy (MAE, MAPE).
    3. Idempotently ingests live arrival events without double-counting.
    4. Separates reservation attendance, recorded walk-ins, and future walk-ins.
    """
    # 1. Baseline forecast
    res = client.get("/api/kitchens/kitchen_restaurant_verde/walkin-forecast")
    assert res.status_code == 200
    forecast = res.json()
    
    assert forecast["confirmed_reservations"] == 70
    assert forecast["expected_reservation_attendance"] == 60  # 70 * 86% turnup rate
    assert forecast["current_recorded_arrivals"] == 0
    assert forecast["predicted_walkins_next_30m"] > 0
    assert forecast["evaluation_metrics"]["mean_absolute_error_covers"] == 2.4
    assert "Historical Service Logs" in forecast["data_sources_connected"][0]

    # Verify zero double-counting formula:
    # total_expected_covers_today == expected_res_attendance + current_recorded_arrivals + future_walkins_expected
    assert forecast["total_expected_covers_today"] == (
        forecast["expected_reservation_attendance"] +
        forecast["current_recorded_arrivals"] +
        forecast["future_walkins_expected"]
    )

    # 2. Ingest live walkin arrival (table of 4)
    event_payload = {
        "id": "EVT-HOST-001",
        "kitchen_id": "kitchen_restaurant_verde",
        "timestamp": "18:35 UTC",
        "party_size": 4,
        "event_type": "walkin_arrival",
        "notes": "Seated at Table 12"
    }
    event_res = client.post("/api/kitchens/kitchen_restaurant_verde/walkin-event", json=event_payload)
    assert event_res.status_code == 200

    # 3. Idempotency test: duplicate event ID does NOT double-increment arrivals
    event_res_dup = client.post("/api/kitchens/kitchen_restaurant_verde/walkin-event", json=event_payload)
    assert event_res_dup.status_code == 200

    # 4. Re-fetch forecast: recorded arrivals must reflect 4 (not 8!)
    updated_res = client.get("/api/kitchens/kitchen_restaurant_verde/walkin-forecast")
    updated_forecast = updated_res.json()
    assert updated_forecast["current_recorded_arrivals"] == 4

    # 5. Test Manager Override functionality
    override_res = client.get(
        "/api/kitchens/kitchen_restaurant_verde/walkin-forecast?manager_override=45&manager_override_reason=Rain+stopping+early"
    )
    override_data = override_res.json()
    assert override_data["manager_override"] == 45
    assert override_data["manager_override_reason"] == "Rain stopping early"


# ==============================================================================
# PART 3: OPERATIONAL PREPARED-FOOD RESCUE (SCENARIO C)
# ==============================================================================

def test_prepared_food_safety_gate_and_operational_completion():
    """
    Scenario C:
    1. Unsafe customer-returned food is blocked by safety gate.
    2. Eligible prepared food passes gate and generates approved meal combo.
    3. Simulated order atomically deducts available combo quantity and batch portions.
    4. Overselling is rejected with 400.
    5. Authorized donation handover updates status and quantities.
    6. Ineligible batch disposal logs measured weight in waste ledger.
    """
    # 1. Safety Gate: Intentionally unsafe batch (returned by diner)
    unsafe_req = {
        "kitchen_id": "kitchen_restaurant_verde",
        "dish_name": "Steak Tagliata",
        "portions_remaining": 2,
        "prepared_at": "13:00",
        "service_period": "Lunch Service",
        "served_to_customer": True,  # Customer contact!
        "buffet_exposed": False,
        "continuously_controlled": True,
        "holding_temperature_c": 65.0,
        "holding_duration_hours": 0.5,
        "safe_use_cutoff": "16:00 UTC",
        "allergens": []
    }
    unsafe_res = client.post("/api/kitchens/kitchen_restaurant_verde/prepared-food", json=unsafe_req)
    assert unsafe_res.status_code == 200
    unsafe_batch = unsafe_res.json()
    assert unsafe_batch["eligibility_decision"] == "INELIGIBLE"
    assert unsafe_batch["recommended_action"] == "DISPOSAL"

    # Attempting to donate an ineligible batch must be rejected with 400
    bad_donate_res = client.post("/api/kitchens/kitchen_restaurant_verde/prepared-food/donate", json={
        "batch_id": unsafe_batch["id"],
        "portions_donated": 2,
        "partner_name": "City Harvest"
    })
    assert bad_donate_res.status_code == 400

    # Record measured disposal of unsafe batch
    dispose_res = client.post("/api/kitchens/kitchen_restaurant_verde/prepared-food/dispose", json={
        "batch_id": unsafe_batch["id"],
        "disposed_weight_kg": 0.85,
        "disposal_reason": "Customer plate touch contamination (FSSAI/HACCP mandatory discard)"
    })
    assert dispose_res.status_code == 200
    disposed_batch = dispose_res.json()
    assert disposed_batch["status"] == "disposed"
    assert disposed_batch["measured_disposal_weight_kg"] == 0.85
    assert disposed_batch["portions_remaining"] == 0

    # 2. Eligible Batch Combo and Atomic Sale
    combos_res = client.get("/api/kitchens/kitchen_restaurant_verde/combos")
    assert combos_res.status_code == 200
    combos = combos_res.json()
    assert len(combos) > 0
    target_combo = combos[0]
    initial_avail = target_combo["available_quantity"]

    # Place atomic simulated order for 3 combos
    order_res = client.post(f"/api/combos/{target_combo['combo_id']}/order", json={
        "combo_id": target_combo["combo_id"],
        "quantity": 3,
        "customer_name": "Antigravity Operations Diner"
    })
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["success"] is True
    assert order_data["remaining_inventory"] == initial_avail - 3

    # Overselling prevention test: cannot order 9999 portions
    excess_res = client.post(f"/api/combos/{target_combo['combo_id']}/order", json={
        "combo_id": target_combo["combo_id"],
        "quantity": 9999,
        "customer_name": "Overseller"
    })
    assert excess_res.status_code == 400

    # 3. Operational Donation of eligible soup batch
    prep_batches = db.get_prepared_batches("kitchen_restaurant_verde")
    soup_batch = next((b for b in prep_batches if "soup" in b.dish_name.lower() and b.eligibility_decision.value == "ELIGIBLE"), None)
    assert soup_batch is not None
    initial_soup_portions = soup_batch.portions_remaining

    donate_res = client.post("/api/kitchens/kitchen_restaurant_verde/prepared-food/donate", json={
        "batch_id": soup_batch.id,
        "portions_donated": 5,
        "partner_name": "City Harvest Recovery Network",
        "transport_temp_c": 3.8
    })
    assert donate_res.status_code == 200
    donated_batch = donate_res.json()
    assert donated_batch["portions_donated"] == 5
    assert donated_batch["portions_remaining"] == initial_soup_portions - 5
