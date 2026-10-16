from typing import List, Dict, Any
from app.models.schemas import Recipe, PlanItem, DietaryTag

class RecipeCalculator:
    """Deterministic recipe scaling, portion cost, and aggregate ingredient demand calculation."""

    @staticmethod
    def scale_recipe_ingredients(recipe: Recipe, portions: int) -> List[Dict[str, Any]]:
        """Scales recipe ingredients linearly based on portion count."""
        scaled_ingredients = []
        for ing in recipe.ingredients:
            total_qty = round(ing.qty_per_portion * portions, 3)
            scaled_ingredients.append({
                "ingredient_id": ing.ingredient_id,
                "ingredient_name": ing.ingredient_name,
                "qty_per_portion": ing.qty_per_portion,
                "unit": ing.unit,
                "total_qty_needed": total_qty,
                "is_core": ing.is_core,
                "allowed_substitutions": ing.allowed_substitutions
            })
        return scaled_ingredients

    @staticmethod
    def calculate_total_ingredient_demands(
        recipes_by_id: Dict[str, Recipe],
        planned_items: List[PlanItem]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Aggregates ingredient requirements across all planned dishes in a menu.
        Returns a dict keyed by ingredient_id with total quantities needed and unit.
        """
        aggregated: Dict[str, Dict[str, Any]] = {}
        for item in planned_items:
            recipe = recipes_by_id.get(item.recipe_id)
            if not recipe:
                continue
            scaled = RecipeCalculator.scale_recipe_ingredients(recipe, item.portions)
            for ing in scaled:
                ing_id = ing["ingredient_id"]
                if ing_id not in aggregated:
                    aggregated[ing_id] = {
                        "ingredient_id": ing_id,
                        "ingredient_name": ing["ingredient_name"],
                        "total_qty_needed": 0.0,
                        "unit": ing["unit"],
                        "used_in_recipes": []
                    }
                aggregated[ing_id]["total_qty_needed"] = round(
                    aggregated[ing_id]["total_qty_needed"] + ing["total_qty_needed"], 3
                )
                if item.recipe_name not in aggregated[ing_id]["used_in_recipes"]:
                    aggregated[ing_id]["used_in_recipes"].append(item.recipe_name)
        return aggregated

    @staticmethod
    def calculate_dietary_counts(
        recipes_by_id: Dict[str, Recipe],
        planned_items: List[PlanItem]
    ) -> Dict[str, int]:
        """Calculates total portions fulfilling each dietary requirement."""
        counts = {
            "vegetarian": 0,
            "vegan": 0,
            "halal": 0,
            "gluten_free": 0,
            "dairy_free": 0,
            "total_mains": 0,
        }
        for item in planned_items:
            recipe = recipes_by_id.get(item.recipe_id)
            if not recipe:
                continue
            if recipe.category == "main":
                counts["total_mains"] += item.portions
                for tag in recipe.dietary_tags:
                    tag_str = tag.value if hasattr(tag, "value") else str(tag)
                    if tag_str in counts:
                        counts[tag_str] += item.portions
        return counts
