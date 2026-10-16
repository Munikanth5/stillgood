import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "STILLGOOD AI Kitchen Decision Twin"
    assert "ai_integration" in data

def test_list_kitchens():
    res = client.get("/api/kitchens")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    # Apex Tech Cafeteria should be present
    apex = next((k for k in data if k["id"] == "kitchen_corporate_apex"), None)
    assert apex is not None
    assert apex["type"] == "corporate_cafeteria"

def test_disruption_interpretation_and_replan_workflow():
    # 1. AI Disruption Alert
    payload = {
        "raw_text": "Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.",
        "kitchen_id": "kitchen_corporate_apex"
    }
    interp_res = client.post("/api/ai/interpret", json=payload)
    assert interp_res.status_code == 200
    scenario = interp_res.json()
    assert scenario["revised_expected_meals"] == 350
    assert scenario["original_expected_meals"] == 500
    assert len(scenario["supplier_disruptions"]) > 0

    # 2. Replan Execution
    replan_res = client.post("/api/plans/replan", json=scenario)
    assert replan_res.status_code == 200
    replan_data = replan_res.json()
    assert "plans" in replan_data
    assert "plan_c" in replan_data["plans"]
    assert replan_data["plans"]["plan_c"]["feasibility_status"] == "FEASIBLE"
    assert replan_data["plans"]["plan_c"]["is_recommended"] is True
    assert replan_data["plans"]["plan_a"]["feasibility_status"] == "INFEASIBLE"
    assert len(replan_data["plans"]["rejected_candidates"]) >= 2

    # 3. Evidence Receipt Retrieval
    receipt_id = replan_data["receipt_id"]
    rcpt_res = client.get(f"/api/plans/evidence/{receipt_id}")
    assert rcpt_res.status_code == 200
    receipt = rcpt_res.json()
    assert receipt["modeled_surplus_avoidance_meals"] > 0
    assert receipt["modeled_purchase_savings_cost"] > 0
    assert receipt["modeled_at_risk_rescued_kg"] >= 14.0

    # 4. Manager Approval
    approval_payload = {
        "plan_id": "plan_c_smart_rescue",
        "kitchen_id": "kitchen_corporate_apex",
        "approver_name": "Executive Head Chef",
        "action": "APPROVE",
        "notes": "Approved AMRITSARI CHANA + PALAK DAL rescue menu."
    }
    appr_res = client.post("/api/approvals", json=approval_payload)
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    assert appr_data["action"] == "APPROVE"

    # 5. Impact Dashboard
    impact_res = client.get("/api/impact/kitchen_corporate_apex")
    assert impact_res.status_code == 200
    impact = impact_res.json()
    assert impact["modeled_surplus_prevented_meals"] > 0
    assert impact["total_meals_served"] > 0
    assert impact["measured_waste_per_meal_kg"] > 0
