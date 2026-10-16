import math
from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    InventoryBatch, Ingredient, BatchEligibility, BatchStorageStatus
)

class InventoryAllocator:
    """
    Deterministic inventory allocation adhering to food safety standards:
    1. FEFO (First Expired First Out) allocation prioritizing AT_RISK batches first.
    2. Strict exclusion of INELIGIBLE, QUARANTINED, or EXPIRED stock.
    3. Calculates real shortages, pack-size rounded purchase orders, and at-risk utilization.
    """

    @staticmethod
    def allocate_stock(
        ingredient_demands: Dict[str, Dict[str, Any]],
        inventory_batches: List[InventoryBatch],
        ingredients_by_id: Dict[str, Ingredient]
    ) -> Dict[str, Any]:
        """
        Allocates inventory to fulfill ingredient demands using FEFO.
        """
        # Filter strictly food-safe eligible batches
        eligible_batches: List[InventoryBatch] = []
        ineligible_batches_rejected: List[Dict[str, Any]] = []

        for b in inventory_batches:
            if b.eligibility_status == BatchEligibility.INELIGIBLE or \
               b.storage_status in (BatchStorageStatus.EXPIRED, BatchStorageStatus.QUARANTINED):
                ineligible_batches_rejected.append({
                    "batch_id": b.id,
                    "ingredient_id": b.ingredient_id,
                    "batch_code": b.batch_code,
                    "reason": f"Food safety constraint: batch is {b.storage_status.value} / {b.eligibility_status.value}"
                })
            else:
                eligible_batches.append(b)

        # Sort eligible batches by expiry date (FEFO)
        # Batches marked AT_RISK naturally have earlier expiry dates
        sorted_batches = sorted(eligible_batches, key=lambda b: (b.expiry_date, b.received_date))

        # Track remaining available quantity per batch for this simulation
        batch_availabilities = {
            b.id: max(0.0, b.remaining_qty - b.reserved_qty) for b in sorted_batches
        }

        allocations: List[Dict[str, Any]] = []
        shortages: List[Dict[str, Any]] = []
        purchases_required: List[Dict[str, Any]] = []

        total_purchase_cost = 0.0
        at_risk_utilized_kg = 0.0
        at_risk_utilized_value = 0.0

        for ing_id, demand_info in ingredient_demands.items():
            qty_needed = demand_info["total_qty_needed"]
            unit = demand_info["unit"]
            ing_obj = ingredients_by_id.get(ing_id)
            unit_cost = ing_obj.cost_per_unit if ing_obj else 2.00

            fulfilled_qty = 0.0
            batches_for_ing = [b for b in sorted_batches if b.ingredient_id == ing_id]

            for b in batches_for_ing:
                if fulfilled_qty >= qty_needed:
                    break
                avail = batch_availabilities[b.id]
                if avail <= 0:
                    continue

                needed_from_batch = min(avail, round(qty_needed - fulfilled_qty, 3))
                if needed_from_batch > 0:
                    batch_availabilities[b.id] = round(batch_availabilities[b.id] - needed_from_batch, 3)
                    fulfilled_qty = round(fulfilled_qty + needed_from_batch, 3)

                    is_at_risk = (b.eligibility_status == BatchEligibility.AT_RISK)
                    if is_at_risk:
                        at_risk_utilized_kg += needed_from_batch
                        at_risk_utilized_value += round(needed_from_batch * b.unit_cost, 2)

                    allocations.append({
                        "ingredient_id": ing_id,
                        "ingredient_name": b.ingredient_name,
                        "batch_id": b.id,
                        "batch_code": b.batch_code,
                        "expiry_date": b.expiry_date,
                        "allocated_qty": needed_from_batch,
                        "unit": unit,
                        "was_at_risk": is_at_risk,
                        "batch_cost": round(needed_from_batch * b.unit_cost, 2)
                    })

            shortage_qty = max(0.0, round(qty_needed - fulfilled_qty, 3))
            if shortage_qty > 0.001:
                # Calculate purchase quantity applying minimum order qty and pack size
                min_order = ing_obj.min_order_qty if ing_obj else 1.0
                pack_size = ing_obj.pack_size if ing_obj else 1.0
                
                # Round up to whole packs
                packs_needed = math.ceil(shortage_qty / pack_size)
                calc_order_qty = max(min_order, packs_needed * pack_size)
                purchase_cost = round(calc_order_qty * unit_cost, 2)
                total_purchase_cost += purchase_cost

                shortages.append({
                    "ingredient_id": ing_id,
                    "ingredient_name": demand_info["ingredient_name"],
                    "shortage_qty": shortage_qty,
                    "unit": unit,
                    "used_in_recipes": demand_info["used_in_recipes"]
                })

                purchases_required.append({
                    "ingredient_id": ing_id,
                    "ingredient_name": demand_info["ingredient_name"],
                    "shortage_qty": shortage_qty,
                    "order_qty": calc_order_qty,
                    "pack_size": pack_size,
                    "unit": unit,
                    "unit_cost": unit_cost,
                    "purchase_cost": purchase_cost
                })

        return {
            "allocations": allocations,
            "shortages": shortages,
            "purchases_required": purchases_required,
            "total_purchase_cost": round(total_purchase_cost, 2),
            "at_risk_utilized_kg": round(at_risk_utilized_kg, 2),
            "at_risk_utilized_value": round(at_risk_utilized_value, 2),
            "ineligible_batches_rejected": ineligible_batches_rejected
        }
