import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import PreparedFoodIntakeRequest, SafetyDecision, RecommendedRescueAction
from app.engine.safety_gate import DeterministicSafetyGate
from app.engine.walkin_forecaster import WalkinDemandForecaster
from app.engine.combo_validator import DeterministicComboValidator
from app.data.seed_data import KITCHEN_PROFILES

client = TestClient(app)

def test_deterministic_safety_gate_rules():
    # 1. Valid Hot-Holding Batch
    valid_hot = PreparedFoodIntakeRequest(
        kitchen_id="kitchen_restaurant_verde",
        dish_name="Rustic Pomodoro Penne",
        portions_remaining=10,
        prepared_at="12:30",
        service_period="Lunch Service",
        served_to_customer=False,
        buffet_exposed=False,
        continuously_controlled=True,
        holding_temperature_c=68.0,
        holding_duration_hours=1.5,
        safe_use_cutoff="22:00 UTC",
        allergens=["gluten"],
        dietary_tags=["vegetarian"]
    )
    decision, reason, action, checks = DeterministicSafetyGate.evaluate_prepared_batch(valid_hot)
    assert decision == SafetyDecision.ELIGIBLE
    assert action == RecommendedRescueAction.DISCOUNTED_COMBO

    # 2. Customer Returned Item (Must be immediately rejected)
    returned_item = PreparedFoodIntakeRequest(
        kitchen_id="kitchen_restaurant_verde",
        dish_name="Steak Frites",
        portions_remaining=1,
        prepared_at="13:00",
        service_period="Lunch Service",
        served_to_customer=True, # Touch by customer!
        buffet_exposed=False,
        continuously_controlled=True,
        holding_temperature_c=65.0,
        holding_duration_hours=0.5,
        safe_use_cutoff="16:00 UTC",
        allergens=[]
    )
    decision, reason, action, checks = DeterministicSafetyGate.evaluate_prepared_batch(returned_item)
    assert decision == SafetyDecision.INELIGIBLE
    assert action == RecommendedRescueAction.DISPOSAL
    assert any("customer" in c.rule_name.lower() and not c.passed for c in checks)

    # 3. Buffet Exposed beyond 2 hours
    buffet_item = PreparedFoodIntakeRequest(
        kitchen_id="kitchen_hotel_grand",
        dish_name="Buffet Carvery Roast",
        portions_remaining=8,
        prepared_at="11:00",
        service_period="Brunch Buffet",
        served_to_customer=False,
        buffet_exposed=True,
        continuously_controlled=True,
        holding_temperature_c=58.0, # Danger zone!
        holding_duration_hours=3.0, # > 2h!
        safe_use_cutoff="14:00 UTC",
        allergens=[]
    )
    decision, reason, action, checks = DeterministicSafetyGate.evaluate_prepared_batch(buffet_item)
    assert decision == SafetyDecision.INELIGIBLE
    assert action == RecommendedRescueAction.DISPOSAL

def test_walkin_forecasting_model():
    kitchen = KITCHEN_PROFILES["kitchen_restaurant_verde"]
    forecast = WalkinDemandForecaster.generate_forecast(
        kitchen=kitchen,
        service_period="Dinner Service",
        current_walkin_count=5,
        cancellations_count=0
    )
    assert forecast.kitchen_id == "kitchen_restaurant_verde"
    assert forecast.predicted_walkins_next_30m > 0
    assert len(forecast.walkin_prediction_interval) == 2
    assert forecast.walkin_prediction_interval[0] <= forecast.predicted_walkins_next_30m <= forecast.walkin_prediction_interval[1]
    assert forecast.total_expected_covers_today >= forecast.expected_reservation_attendance
    assert len(forecast.intervals) == 10
    assert forecast.model_confidence == "HIGH"
    assert "evaluated" in forecast.model_name.lower()

def test_companion_summary_endpoint():
    res = client.get("/api/kitchens/kitchen_restaurant_verde/companion-summary")
    assert res.status_code == 200
    data = res.json()
    assert "Good afternoon" in data["greeting"]
    assert len(data["attention_items"]) <= 3 # Non-negotiable max 3
    assert data["quick_stats"]["expected_guests"] > 0
    assert "active_recommendation" in data
    assert "what_to_do" in data["active_recommendation"]

def test_prepared_food_intake_api():
    payload = {
        "kitchen_id": "kitchen_restaurant_verde",
        "dish_name": "Test Baked Lasagna",
        "portions_remaining": 6,
        "prepared_at": "13:00",
        "service_period": "Lunch Service",
        "served_to_customer": False,
        "buffet_exposed": False,
        "continuously_controlled": True,
        "holding_temperature_c": 69.5,
        "holding_duration_hours": 1.0,
        "safe_use_cutoff": "22:00 UTC",
        "allergens": ["dairy", "gluten"],
        "dietary_tags": ["vegetarian"],
        "notes": "Test batch for v3 verification."
    }
    res = client.post("/api/kitchens/kitchen_restaurant_verde/prepared-food", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["eligibility_decision"] == "ELIGIBLE"
    assert data["portions_remaining"] == 6

def test_atomic_combo_order_and_overselling_protection():
    # 1. Fetch existing combos
    res = client.get("/api/kitchens/kitchen_restaurant_verde/combos")
    assert res.status_code == 200
    combos = res.json()
    assert len(combos) > 0
    target_combo = combos[0]
    initial_qty = target_combo["available_quantity"]

    # 2. Place valid simulated order
    order_res = client.post(f"/api/combos/{target_combo['combo_id']}/order", json={
        "combo_id": target_combo["combo_id"],
        "quantity": 2,
        "customer_name": "Antigravity Test Customer"
    })
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["success"] is True
    assert order_data["remaining_inventory"] == initial_qty - 2

    # 3. Place order exceeding remaining quantity (Overselling prevention)
    excess_res = client.post(f"/api/combos/{target_combo['combo_id']}/order", json={
        "combo_id": target_combo["combo_id"],
        "quantity": 99999,
        "customer_name": "Overseller"
    })
    assert excess_res.status_code == 400
