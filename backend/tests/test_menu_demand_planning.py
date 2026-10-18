import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db
from app.models.schemas import ServiceModel, CreateCustomerOrderRequest, CustomerOrderItem

client = TestClient(app)

def test_service_model_recognition():
    """Verify each kitchen profile recognizes its proper service model without daily setup screens."""
    verde = db.get_kitchen("kitchen_restaurant_verde")
    assert verde.effective_service_model == ServiceModel.A_LA_CARTE

    apex = db.get_kitchen("kitchen_corporate_apex")
    assert apex.effective_service_model == ServiceModel.FIXED_MENU

    hotel = db.get_kitchen("kitchen_hotel_grand")
    assert hotel.effective_service_model == ServiceModel.BUFFET

    factory = db.get_kitchen("kitchen_factory_industrial")
    assert factory.effective_service_model == ServiceModel.QUICK_SERVICE

def test_menu_demand_prediction_a_la_carte():
    """Verify menu-based demand separates expected, confirmed, already-prepared, and remaining demand."""
    db.reset_to_demo()
    response = client.get("/api/kitchens/kitchen_restaurant_verde/menu-plan?expected_guests=70")
    assert response.status_code == 200
    data = response.json()

    assert data["kitchen_id"] == "kitchen_restaurant_verde"
    assert data["service_model"] == "a_la_carte"
    assert "À La Carte" in data["service_model_label"]
    assert data["expected_guests"] == 70

    # Total forecast dishes across menu items disproves the 1-guest = 1-meal fallacy
    assert data["total_dishes_ordered_count"] > 0
    menu_items = {item["recipe_id"]: item for item in data["menu_items"]}

    # Pomodoro: 5 confirmed orders on tickets, but 15 portions held safe in well PREP-VRD-001
    pomodoro = menu_items["recipe_verde_pomodoro"]
    assert pomodoro["confirmed_order_portions"] == 5
    assert pomodoro["already_prepared_portions"] >= 15
    # Chef should NOT cook any more Pomodoro right now because 15 in well > 5 ordered!
    assert pomodoro["cook_now_portions"] == 0
    assert "DO NOT COOK" in pomodoro["operational_action_advice"] or "HOLDING SAFE" in pomodoro["operational_action_advice"]

    # Alfredo: 2 confirmed orders on tickets, 0 in holding
    alfredo = menu_items["recipe_verde_alfredo"]
    assert alfredo["confirmed_order_portions"] == 2
    assert alfredo["already_prepared_portions"] == 0
    # Chef MUST fire the 2 confirmed orders on the saute station now!
    assert alfredo["cook_now_portions"] == 2
    assert "FIRE 2 PORTIONS NOW" in alfredo["operational_action_advice"]

    # Check shared dishes (Salad & Dessert have sharing factors > 1.0)
    salad = menu_items["recipe_verde_salad"]
    assert salad["is_shared_dish"] is True
    assert salad["sharing_factor"] > 1.0

    dessert = menu_items["recipe_verde_dessert"]
    assert dessert["is_shared_dish"] is True
    assert dessert["sharing_factor"] > 1.0

    # Recommended next action mentions firing Alfredo and serving Pomodoro
    assert "Alfredo" in data["recommended_next_action"]
    assert "holding" in data["recommended_next_action"].lower() or "sauté station" in data["recommended_next_action"].lower()

    # Why this works explains attach rates and waste prevention
    assert "À La Carte" in data["why_this_works_explanation"]
    assert len(data["assumptions_breakdown"]) >= 3

def test_live_staff_order_entry_and_cancellation():
    """Verify adding an order dynamically updates confirmed orders and cook-now decisions."""
    db.reset_to_demo()
    
    # 1. Fetch baseline
    res1 = client.get("/api/kitchens/kitchen_restaurant_verde/menu-plan?expected_guests=70")
    assert res1.status_code == 200
    alfredo_before = next(i for i in res1.json()["menu_items"] if i["recipe_id"] == "recipe_verde_alfredo")
    assert alfredo_before["cook_now_portions"] == 2

    # 2. Staff enters a new order for Table 9: 2 Alfredo + 1 Dessert
    order_req = {
        "table_number": "Table 9",
        "party_size": 2,
        "items": [
            {"recipe_id": "recipe_verde_alfredo", "recipe_name": "Creamy Garlic Fettuccine Alfredo", "quantity": 2},
            {"recipe_id": "recipe_verde_dessert", "recipe_name": "Strawberries & Hand-Whipped Vanilla Cream", "quantity": 1}
        ],
        "server_name": "Marco"
    }
    create_res = client.post("/api/kitchens/kitchen_restaurant_verde/orders", json=order_req)
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]
    assert order_id.startswith("ORD-")

    # 3. Check updated menu plan: cook_now for Alfredo should increase from 2 to 4!
    res2 = client.get("/api/kitchens/kitchen_restaurant_verde/menu-plan?expected_guests=70")
    assert res2.status_code == 200
    alfredo_after = next(i for i in res2.json()["menu_items"] if i["recipe_id"] == "recipe_verde_alfredo")
    assert alfredo_after["confirmed_order_portions"] == 4
    assert alfredo_after["cook_now_portions"] == 4
    assert "FIRE 4 PORTIONS NOW" in alfredo_after["operational_action_advice"]

    # 4. Cancel the order
    cancel_res = client.post(f"/api/kitchens/kitchen_restaurant_verde/orders/{order_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # 5. Plan reverts back
    res3 = client.get("/api/kitchens/kitchen_restaurant_verde/menu-plan?expected_guests=70")
    assert res3.status_code == 200
    alfredo_revert = next(i for i in res3.json()["menu_items"] if i["recipe_id"] == "recipe_verde_alfredo")
    assert alfredo_revert["cook_now_portions"] == 2

def test_plan_c_includes_menu_preparation_plan():
    """Verify /api/plans/replan response includes menu_preparation_plan in Plan C."""
    db.reset_to_demo()
    scenario_input = {
        "kitchen_id": "kitchen_restaurant_verde",
        "raw_text": "Rainstorm tonight. 40 cancellations expected, 70 diners total."
    }
    interp_res = client.post("/api/ai/interpret", json=scenario_input)
    assert interp_res.status_code == 200

    replan_res = client.post(
        "/api/plans/replan?kitchen_id=kitchen_restaurant_verde",
        json=interp_res.json()
    )
    assert replan_res.status_code == 200
    res_data = replan_res.json()
    assert "plans" in res_data
    assert "plan_c" in res_data["plans"]
    plan_c = res_data["plans"]["plan_c"]
    assert "menu_preparation_plan" in plan_c
    menu_plan = plan_c["menu_preparation_plan"]
    assert menu_plan is not None
    assert menu_plan["service_model"] == "a_la_carte"
    assert len(menu_plan["menu_items"]) > 0
    assert len(menu_plan["cook_now_summary"]) > 0
    assert menu_plan["recommended_next_action"] != ""
