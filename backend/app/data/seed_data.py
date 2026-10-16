from typing import Dict, List, Any
from app.models.schemas import (
    KitchenProfile, KitchenType, Ingredient, InventoryBatch,
    BatchStorageStatus, BatchEligibility, StorageType, Recipe, RecipeIngredient,
    DietaryTag, Supplier, ActualOutcomeLog
)

# 8 Realistic Kitchen Profiles
KITCHEN_PROFILES: Dict[str, KitchenProfile] = {
    "kitchen_corporate_apex": KitchenProfile(
        id="kitchen_corporate_apex",
        name="Apex Tech Corporate Cafeteria",
        type=KitchenType.CORPORATE_CAFETERIA,
        tagline="Corporate Campus Dining — Building 4",
        capacity_meals_per_service=650,
        default_service_period="Lunch (11:30 AM – 2:00 PM)",
        currency="USD",
        timezone="America/New_York",
        description="High-volume corporate dining serving tech employees with diverse dietary requirements (Vegetarian, Halal, Vegan, Gluten-Free).",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="Badge Swipes & Office Attendance Forecast"
    ),
    "kitchen_hospital_stjude": KitchenProfile(
        id="kitchen_hospital_stjude",
        name="St. Jude Healthcare Food Service",
        type=KitchenType.HOSPITAL_HEALTHCARE,
        tagline="Clinical Patient & Staff Nutrition Wing",
        capacity_meals_per_service=400,
        default_service_period="Lunch & Clinical Rounds",
        currency="USD",
        timezone="America/Chicago",
        description="Healthcare dining strictly adhering to physician-prescribed clinical diets (Low-Sodium, Diabetic, Renal). Automatic substitution is prohibited.",
        is_sample=True,
        dietary_strictness="clinical_strict",
        primary_demand_driver="Inpatient Census & Dietary Orders"
    ),
    "kitchen_hotel_grand": KitchenProfile(
        id="kitchen_hotel_grand",
        name="Grand Azure Hotel & Convention",
        type=KitchenType.HOTEL_BUFFET,
        tagline="Luxury Buffet & Banquet Operations",
        capacity_meals_per_service=800,
        default_service_period="Dinner Buffet (6:00 PM – 10:00 PM)",
        currency="USD",
        timezone="America/Los_Angeles",
        description="Prestige hotel buffet balancing premium seafood and carving stations with high-variance guest occupancy.",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="Room Occupancy & Banquet Bookings"
    ),
    "kitchen_college_oxford": KitchenProfile(
        id="kitchen_college_oxford",
        name="Beacon College Student Commons",
        type=KitchenType.SCHOOL_CANTEEN,
        tagline="University Residential Dining Hall",
        capacity_meals_per_service=1200,
        default_service_period="Lunch Rush (11:00 AM – 2:30 PM)",
        currency="USD",
        timezone="America/New_York",
        description="Budget-conscious, high-throughput student dining with active meal plans and sudden exam-week fluctuations.",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="Semester Enrollments & Class Timetables"
    ),
    "kitchen_restaurant_verde": KitchenProfile(
        id="kitchen_restaurant_verde",
        name="Osteria Verde Bistro",
        type=KitchenType.RESTAURANT_CAFE,
        tagline="Farm-to-Table Neighborhood Trattoria",
        capacity_meals_per_service=220,
        default_service_period="Dinner Service (5:00 PM – 11:00 PM)",
        currency="USD",
        timezone="Europe/London",
        description="Artisanal scratch kitchen relying on fresh daily market deliveries and reservation book trends.",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="OpenTable Reservations & Weather Forecast"
    ),
    "kitchen_factory_industrial": KitchenProfile(
        id="kitchen_factory_industrial",
        name="Sterling Automotive Shift Canteen",
        type=KitchenType.FACTORY_INDUSTRIAL,
        tagline="24/7 Manufacturing Assembly Dining",
        capacity_meals_per_service=550,
        default_service_period="Day Shift Lunch (12:00 PM – 1:00 PM)",
        currency="USD",
        timezone="America/Detroit",
        description="High-calorie, wholesome meal preparation aligned strictly with plant shift bells and assembly schedules.",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="Shift Rosters & Active Clock-ins"
    ),
    "kitchen_catering_summit": KitchenProfile(
        id="kitchen_catering_summit",
        name="Summit Banquet & Event Caterers",
        type=KitchenType.CATERING_EVENT,
        tagline="Off-Premise & Gala Production",
        capacity_meals_per_service=450,
        default_service_period="Evening Gala Banquet",
        currency="USD",
        timezone="America/Chicago",
        description="Event catering vulnerable to last-minute host headcount revisions and strict contract menus.",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="Contracted Headcounts & RSVP Revisions"
    ),
    "kitchen_ngo_hope": KitchenProfile(
        id="kitchen_ngo_hope",
        name="Hope Community Kitchen & Pantry",
        type=KitchenType.COMMUNITY_NGO,
        tagline="Surplus Food Relief & Dignified Dining",
        capacity_meals_per_service=350,
        default_service_period="Community Noon Meal",
        currency="USD",
        timezone="America/New_York",
        description="Non-profit kitchen transforming donated farm surplus into nutritious meals with zero waste tolerance.",
        is_sample=True,
        dietary_strictness="standard",
        primary_demand_driver="Community Need & Partner Food Inflow"
    )
}

# Master Ingredients for Apex Tech Cafeteria
APEX_INGREDIENTS: List[Ingredient] = [
    Ingredient(id="ing_paneer", name="Fresh Malai Paneer", category="dairy", unit="kg", cost_per_unit=8.50, min_order_qty=10.0, pack_size=5.0, storage_type=StorageType.COLD),
    Ingredient(id="ing_spinach", name="Fresh Baby Spinach", category="produce", unit="kg", cost_per_unit=3.20, min_order_qty=5.0, pack_size=2.5, storage_type=StorageType.COLD),
    Ingredient(id="ing_chickpeas", name="Kabuli Chickpeas (Dried)", category="grains", unit="kg", cost_per_unit=2.10, min_order_qty=10.0, pack_size=5.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_chicken_breast", name="Boneless Chicken Breast (Halal)", category="protein", unit="kg", cost_per_unit=7.00, min_order_qty=15.0, pack_size=5.0, storage_type=StorageType.COLD),
    Ingredient(id="ing_yellow_lentils", name="Toor Dal (Yellow Split Peas)", category="grains", unit="kg", cost_per_unit=2.40, min_order_qty=10.0, pack_size=5.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_basmati_rice", name="Aged Basmati Rice", category="grains", unit="kg", cost_per_unit=2.00, min_order_qty=25.0, pack_size=25.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_onions", name="Red Onions", category="produce", unit="kg", cost_per_unit=1.20, min_order_qty=10.0, pack_size=10.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_tomatoes", name="Vine Ripe Tomatoes", category="produce", unit="kg", cost_per_unit=2.00, min_order_qty=10.0, pack_size=5.0, storage_type=StorageType.COLD),
    Ingredient(id="ing_cream", name="Heavy Dairy Cream", category="dairy", unit="l", cost_per_unit=4.50, min_order_qty=4.0, pack_size=2.0, storage_type=StorageType.COLD),
    Ingredient(id="ing_spices", name="Garam Masala & Indian Spices Blend", category="spices", unit="kg", cost_per_unit=14.00, min_order_qty=1.0, pack_size=1.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_cooking_oil", name="Sunflower Cooking Oil", category="pantry", unit="l", cost_per_unit=2.80, min_order_qty=15.0, pack_size=15.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_cucumbers", name="English Cucumbers", category="produce", unit="kg", cost_per_unit=1.80, min_order_qty=5.0, pack_size=5.0, storage_type=StorageType.COLD),
    Ingredient(id="ing_carrots", name="Fresh Orange Carrots", category="produce", unit="kg", cost_per_unit=1.50, min_order_qty=5.0, pack_size=5.0, storage_type=StorageType.COLD),
    Ingredient(id="ing_wheat_flour", name="Chakki Atta (Whole Wheat Flour)", category="grains", unit="kg", cost_per_unit=1.60, min_order_qty=20.0, pack_size=20.0, storage_type=StorageType.DRY),
    Ingredient(id="ing_quarantined_milk", name="Whole Cow Milk (Quarantined)", category="dairy", unit="l", cost_per_unit=1.50, min_order_qty=10.0, pack_size=10.0, storage_type=StorageType.COLD),
]

# Inventory Batches for Apex Tech Cafeteria
APEX_INVENTORY: List[InventoryBatch] = [
    # 1. Spinach — High Priority AT_RISK Batch (Expires in 28 hours!)
    InventoryBatch(
        id="batch_spn_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_spinach",
        ingredient_name="Fresh Baby Spinach",
        batch_code="LOT-SPN-2026-1014",
        received_date="2026-10-14",
        expiry_date="2026-10-17",  # Tomorrow!
        initial_qty=28.0,
        remaining_qty=24.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=3.20,
        storage_status=BatchStorageStatus.NEAR_EXPIRY,
        eligibility_status=BatchEligibility.AT_RISK,
        notes="High quality baby spinach harvested locally. Approaching 48h use-by threshold; optimal for Palak Dal or Saag."
    ),
    # 2. Paneer — Severely Depleted (Only 5 kg on hand, needed 35 kg in 500-meal plan)
    InventoryBatch(
        id="batch_pan_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_paneer",
        ingredient_name="Fresh Malai Paneer",
        batch_code="LOT-PAN-2026-1015",
        received_date="2026-10-15",
        expiry_date="2026-10-20",
        initial_qty=15.0,
        remaining_qty=5.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=8.50,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Small remaining stock from yesterday's service. Morning delivery supplier delayed until after lunch."
    ),
    # 3. Chickpeas — Abundant, dry, approved alternative
    InventoryBatch(
        id="batch_chn_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_chickpeas",
        ingredient_name="Kabuli Chickpeas (Dried)",
        batch_code="LOT-CHN-2026-0920",
        received_date="2026-09-20",
        expiry_date="2027-03-20",
        initial_qty=50.0,
        remaining_qty=42.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=2.10,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Pantry staple. Excellent protein for Chana Masala alternative."
    ),
    # 4. Yellow Lentils
    InventoryBatch(
        id="batch_len_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_yellow_lentils",
        ingredient_name="Toor Dal (Yellow Split Peas)",
        batch_code="LOT-LEN-2026-0915",
        received_date="2026-09-15",
        expiry_date="2027-04-15",
        initial_qty=40.0,
        remaining_qty=35.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=2.40,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Ample stock for Dal recipes."
    ),
    # 5. Boneless Chicken Breast
    InventoryBatch(
        id="batch_chk_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_chicken_breast",
        ingredient_name="Boneless Chicken Breast (Halal)",
        batch_code="LOT-CHK-2026-1015",
        received_date="2026-10-15",
        expiry_date="2026-10-19",
        initial_qty=30.0,
        remaining_qty=28.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=7.00,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Halal certified chilled poultry."
    ),
    # 6. Basmati Rice
    InventoryBatch(
        id="batch_rc_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_basmati_rice",
        ingredient_name="Aged Basmati Rice",
        batch_code="LOT-RCE-2026-0801",
        received_date="2026-08-01",
        expiry_date="2027-08-01",
        initial_qty=100.0,
        remaining_qty=75.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=2.00,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Long-grain premium basmati."
    ),
    # 7. Red Onions
    InventoryBatch(
        id="batch_on_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_onions",
        ingredient_name="Red Onions",
        batch_code="LOT-ONI-2026-1010",
        received_date="2026-10-10",
        expiry_date="2026-10-30",
        initial_qty=50.0,
        remaining_qty=38.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=1.20,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Dry onion bin."
    ),
    # 8. Tomatoes
    InventoryBatch(
        id="batch_tom_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_tomatoes",
        ingredient_name="Vine Ripe Tomatoes",
        batch_code="LOT-TOM-2026-1013",
        received_date="2026-10-13",
        expiry_date="2026-10-21",
        initial_qty=40.0,
        remaining_qty=26.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=2.00,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Chilled walk-in produce."
    ),
    # 9. Heavy Cream
    InventoryBatch(
        id="batch_crm_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_cream",
        ingredient_name="Heavy Dairy Cream",
        batch_code="LOT-CRM-2026-1014",
        received_date="2026-10-14",
        expiry_date="2026-10-23",
        initial_qty=12.0,
        remaining_qty=8.0,
        reserved_qty=0.0,
        unit="l",
        unit_cost=4.50,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Dairy cold storage."
    ),
    # 10. Atta Flour
    InventoryBatch(
        id="batch_flr_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_wheat_flour",
        ingredient_name="Chakki Atta (Whole Wheat Flour)",
        batch_code="LOT-FLR-2026-0925",
        received_date="2026-09-25",
        expiry_date="2027-01-25",
        initial_qty=60.0,
        remaining_qty=45.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=1.60,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Roti station bulk."
    ),
    # 11. Salad Veggies (Cucumbers & Carrots)
    InventoryBatch(
        id="batch_cuc_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_cucumbers",
        ingredient_name="English Cucumbers",
        batch_code="LOT-CUC-2026-1014",
        received_date="2026-10-14",
        expiry_date="2026-10-22",
        initial_qty=20.0,
        remaining_qty=16.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=1.80,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Crisp salad produce."
    ),
    InventoryBatch(
        id="batch_car_001",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_carrots",
        ingredient_name="Fresh Orange Carrots",
        batch_code="LOT-CAR-2026-1012",
        received_date="2026-10-12",
        expiry_date="2026-10-25",
        initial_qty=20.0,
        remaining_qty=15.0,
        reserved_qty=0.0,
        unit="kg",
        unit_cost=1.50,
        storage_status=BatchStorageStatus.OPTIMAL,
        eligibility_status=BatchEligibility.ELIGIBLE,
        notes="Crisp salad produce."
    ),
    # 12. EXPLICIT QUARANTINED BATCH — Safety Guarantee Demonstration!
    InventoryBatch(
        id="batch_bad_milk",
        kitchen_id="kitchen_corporate_apex",
        ingredient_id="ing_quarantined_milk",
        ingredient_name="Whole Cow Milk (Quarantined)",
        batch_code="LOT-BAD-MILK-99",
        received_date="2026-10-15",
        expiry_date="2026-10-22",
        initial_qty=25.0,
        remaining_qty=25.0,
        reserved_qty=0.0,
        unit="l",
        unit_cost=1.50,
        storage_status=BatchStorageStatus.QUARANTINED,
        eligibility_status=BatchEligibility.INELIGIBLE,
        notes="BLOCKED BY FOOD SAFETY AUDIT: Temperature recorder logged +12°C during transit. Unsafe for food prep."
    )
]

# Approved Recipes for Apex Tech Cafeteria
APEX_RECIPES: List[Recipe] = [
    # 1. Shahi Paneer (Original Plan Dish — Requires 100g Paneer per portion)
    Recipe(
        id="recipe_shahi_paneer",
        kitchen_id="kitchen_corporate_apex",
        name="Shahi Paneer Royale",
        category="main",
        dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.GLUTEN_FREE],
        portion_size_grams=260,
        base_prep_time_minutes=45,
        allergens=["Dairy"],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_paneer", ingredient_name="Fresh Malai Paneer", qty_per_portion=0.10, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_tomatoes", ingredient_name="Vine Ripe Tomatoes", qty_per_portion=0.08, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_onions", ingredient_name="Red Onions", qty_per_portion=0.05, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_cream", ingredient_name="Heavy Dairy Cream", qty_per_portion=0.03, unit="l", is_core=False),
        ],
        cost_per_portion=1.35,
        approved=True,
        version=2
    ),
    # 2. Chana Masala (Rescue Alternative — High protein, vegan, approved, uses in-stock chickpeas!)
    Recipe(
        id="recipe_chana_masala",
        kitchen_id="kitchen_corporate_apex",
        name="Amritsari Chana Masala",
        category="main",
        dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE, DietaryTag.DAIRY_FREE],
        portion_size_grams=280,
        base_prep_time_minutes=40,
        allergens=[],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_chickpeas", ingredient_name="Kabuli Chickpeas (Dried)", qty_per_portion=0.08, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_tomatoes", ingredient_name="Vine Ripe Tomatoes", qty_per_portion=0.07, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_onions", ingredient_name="Red Onions", qty_per_portion=0.06, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_cooking_oil", ingredient_name="Sunflower Cooking Oil", qty_per_portion=0.015, unit="l", is_core=False),
        ],
        cost_per_portion=0.65,
        approved=True,
        version=3
    ),
    # 3. Palak Dal (Rescue Alternative — Uses 100g of at-risk Spinach + Yellow Lentils!)
    Recipe(
        id="recipe_palak_dal",
        kitchen_id="kitchen_corporate_apex",
        name="Homestyle Palak Dal Tadka",
        category="main",
        dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE, DietaryTag.DAIRY_FREE],
        portion_size_grams=250,
        base_prep_time_minutes=35,
        allergens=[],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_spinach", ingredient_name="Fresh Baby Spinach", qty_per_portion=0.10, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_yellow_lentils", ingredient_name="Toor Dal (Yellow Split Peas)", qty_per_portion=0.07, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_tomatoes", ingredient_name="Vine Ripe Tomatoes", qty_per_portion=0.04, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_onions", ingredient_name="Red Onions", qty_per_portion=0.03, unit="kg", is_core=False),
        ],
        cost_per_portion=0.62,
        approved=True,
        version=1
    ),
    # 4. Chicken Tikka Masala (Original Non-Veg Main)
    Recipe(
        id="recipe_chicken_tikka",
        kitchen_id="kitchen_corporate_apex",
        name="Murgh Tikka Masala",
        category="main",
        dietary_tags=[DietaryTag.HALAL, DietaryTag.GLUTEN_FREE],
        portion_size_grams=280,
        base_prep_time_minutes=50,
        allergens=["Dairy"],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_chicken_breast", ingredient_name="Boneless Chicken Breast (Halal)", qty_per_portion=0.14, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_tomatoes", ingredient_name="Vine Ripe Tomatoes", qty_per_portion=0.08, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_onions", ingredient_name="Red Onions", qty_per_portion=0.05, unit="kg", is_core=False),
            RecipeIngredient(ingredient_id="ing_cream", ingredient_name="Heavy Dairy Cream", qty_per_portion=0.02, unit="l", is_core=False),
        ],
        cost_per_portion=1.52,
        approved=True,
        version=4
    ),
    # 5. Fragrant Jeera Rice (Side)
    Recipe(
        id="recipe_jeera_rice",
        kitchen_id="kitchen_corporate_apex",
        name="Fragrant Jeera Basmati Rice",
        category="side",
        dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE, DietaryTag.DAIRY_FREE, DietaryTag.HALAL],
        portion_size_grams=200,
        base_prep_time_minutes=25,
        allergens=[],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_basmati_rice", ingredient_name="Aged Basmati Rice", qty_per_portion=0.08, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_cooking_oil", ingredient_name="Sunflower Cooking Oil", qty_per_portion=0.01, unit="l", is_core=False),
        ],
        cost_per_portion=0.22,
        approved=True,
        version=1
    ),
    # 6. Tandoori Roti (Bread)
    Recipe(
        id="recipe_tandoori_roti",
        kitchen_id="kitchen_corporate_apex",
        name="Artisan Tandoori Roti",
        category="side",
        dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.DAIRY_FREE, DietaryTag.HALAL],
        portion_size_grams=90,
        base_prep_time_minutes=20,
        allergens=["Gluten"],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_wheat_flour", ingredient_name="Chakki Atta (Whole Wheat Flour)", qty_per_portion=0.06, unit="kg", is_core=True),
        ],
        cost_per_portion=0.12,
        approved=True,
        version=2
    ),
    # 7. Garden Salad (Salad)
    Recipe(
        id="recipe_garden_salad",
        kitchen_id="kitchen_corporate_apex",
        name="Rainbow Garden Salad",
        category="salad",
        dietary_tags=[DietaryTag.VEGETARIAN, DietaryTag.VEGAN, DietaryTag.GLUTEN_FREE, DietaryTag.DAIRY_FREE, DietaryTag.HALAL],
        portion_size_grams=120,
        base_prep_time_minutes=15,
        allergens=[],
        ingredients=[
            RecipeIngredient(ingredient_id="ing_cucumbers", ingredient_name="English Cucumbers", qty_per_portion=0.05, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_carrots", ingredient_name="Fresh Orange Carrots", qty_per_portion=0.04, unit="kg", is_core=True),
            RecipeIngredient(ingredient_id="ing_tomatoes", ingredient_name="Vine Ripe Tomatoes", qty_per_portion=0.03, unit="kg", is_core=True),
        ],
        cost_per_portion=0.24,
        approved=True,
        version=1
    )
]

# Suppliers
APEX_SUPPLIERS: List[Supplier] = [
    Supplier(
        id="sup_fresh_dairy",
        name="Fresh Dairy Farms Co.",
        contact="orders@freshdairyfarms.com | (555) 382-9011",
        lead_time_hours=12,
        cutoff_time="07:00 AM",
        minimum_order_value=75.0,
        supplies_ingredients=["ing_paneer", "ing_cream", "ing_quarantined_milk"],
        status="delayed",
        delay_notes="Refrigerated truck mechanical delay. Cannot deliver before 2:30 PM (lunch service finishes at 2:00 PM)."
    ),
    Supplier(
        id="sup_green_valley",
        name="Green Valley Organic Produce",
        contact="dispatch@greenvalleyproduce.com",
        lead_time_hours=8,
        cutoff_time="08:30 AM",
        minimum_order_value=50.0,
        supplies_ingredients=["ing_spinach", "ing_tomatoes", "ing_onions", "ing_cucumbers", "ing_carrots"],
        status="active"
    ),
    Supplier(
        id="sup_metro_poultry",
        name="Metro Halal Meats & Poultry",
        contact="supply@metromeats.com",
        lead_time_hours=14,
        cutoff_time="06:00 AM",
        minimum_order_value=120.0,
        supplies_ingredients=["ing_chicken_breast"],
        status="active"
    ),
    Supplier(
        id="sup_pantry_staples",
        name="National Foodservice Commodities",
        contact="support@nationalcommodities.com",
        lead_time_hours=24,
        cutoff_time="05:00 PM",
        minimum_order_value=150.0,
        supplies_ingredients=["ing_chickpeas", "ing_yellow_lentils", "ing_basmati_rice", "ing_wheat_flour", "ing_cooking_oil", "ing_spices"],
        status="active"
    )
]

# Historical Actual Outcome Records for Impact Dashboard
SAMPLE_OUTCOME_LOGS: List[ActualOutcomeLog] = [
    ActualOutcomeLog(
        id="log_20261010",
        kitchen_id="kitchen_corporate_apex",
        plan_id="plan_prev_1010",
        service_date="2026-10-10",
        service_period="Lunch",
        meals_planned=520,
        meals_prepared=510,
        meals_served=485,
        unserved_portions=25,
        discarded_weight_kg=8.4,
        ingredient_spoilage_kg=2.1,
        prep_waste_kg=3.5,
        plate_waste_kg=2.8,
        stockouts_count=0,
        notes="Standard Friday lunch service. Slight surplus in cooked rice.",
        is_sample=True
    ),
    ActualOutcomeLog(
        id="log_20261011",
        kitchen_id="kitchen_corporate_apex",
        plan_id="plan_prev_1011",
        service_date="2026-10-11",
        service_period="Lunch",
        meals_planned=490,
        meals_prepared=480,
        meals_served=468,
        unserved_portions=12,
        discarded_weight_kg=4.2,
        ingredient_spoilage_kg=0.8,
        prep_waste_kg=1.9,
        plate_waste_kg=1.5,
        stockouts_count=0,
        notes="STILLGOOD batch optimization applied. Prep waste reduced by 30%.",
        is_sample=True
    ),
    ActualOutcomeLog(
        id="log_20261012",
        kitchen_id="kitchen_corporate_apex",
        plan_id="plan_prev_1012",
        service_date="2026-10-12",
        service_period="Lunch",
        meals_planned=510,
        meals_prepared=505,
        meals_served=492,
        unserved_portions=13,
        discarded_weight_kg=4.8,
        ingredient_spoilage_kg=1.2,
        prep_waste_kg=2.1,
        plate_waste_kg=1.5,
        stockouts_count=0,
        notes="Monday service. High adoption of rescued produce soup.",
        is_sample=True
    ),
    ActualOutcomeLog(
        id="log_20261013",
        kitchen_id="kitchen_corporate_apex",
        plan_id="plan_prev_1013",
        service_date="2026-10-13",
        service_period="Lunch",
        meals_planned=500,
        meals_prepared=495,
        meals_served=480,
        unserved_portions=15,
        discarded_weight_kg=5.1,
        ingredient_spoilage_kg=0.9,
        prep_waste_kg=2.4,
        plate_waste_kg=1.8,
        stockouts_count=0,
        notes="Tuesday taco counter. Accurate batching.",
        is_sample=True
    ),
    ActualOutcomeLog(
        id="log_20261014",
        kitchen_id="kitchen_corporate_apex",
        plan_id="plan_prev_1014",
        service_date="2026-10-14",
        service_period="Lunch",
        meals_planned=530,
        meals_prepared=520,
        meals_served=505,
        unserved_portions=15,
        discarded_weight_kg=5.6,
        ingredient_spoilage_kg=1.1,
        prep_waste_kg=2.7,
        plate_waste_kg=1.8,
        stockouts_count=0,
        notes="Wednesday executive meeting day.",
        is_sample=True
    ),
    ActualOutcomeLog(
        id="log_20261015",
        kitchen_id="kitchen_corporate_apex",
        plan_id="plan_prev_1015",
        service_date="2026-10-15",
        service_period="Lunch",
        meals_planned=490,
        meals_prepared=485,
        meals_served=472,
        unserved_portions=13,
        discarded_weight_kg=4.5,
        ingredient_spoilage_kg=0.7,
        prep_waste_kg=2.2,
        plate_waste_kg=1.6,
        stockouts_count=0,
        notes="Yesterday's service. Rescued pumpkin curry fully sold out.",
        is_sample=True
    )
]
