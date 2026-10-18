import re
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.models.schemas import (
    ParsedScenario, TemporaryDisruption, DisruptionProposalResponse,
    DisruptionStatus
)
from app.ai.gemini_client import gemini_service

logger = logging.getLogger("stillgood.ai.disruption")

def get_ingredient_stems(word: str) -> List[str]:
    """Generates singular, plural, and base root forms for matching ingredient and recipe names."""
    w = word.lower().strip()
    stems = {w}
    cleaned = re.sub(r'[^a-z0-9]', '', w)
    if cleaned:
        stems.add(cleaned)
    if w.endswith('ies') and len(w) > 4:
        stems.add(w[:-3] + 'y')
        stems.add(w[:-3])
    elif w.endswith('es') and len(w) > 3:
        stems.add(w[:-2])
        stems.add(w[:-1])
    elif w.endswith('s') and len(w) > 3:
        stems.add(w[:-1])
    if "tomato" in w:
        stems.update(["tomato", "tomatoes", "pomodoro"])
    if "fettuccine" in w or "pasta" in w or "penne" in w:
        stems.update(["pasta", "fettuccine", "penne"])
    if "cream" in w or "dairy" in w:
        stems.update(["cream", "dairy", "milk", "butter"])
    if "strawberry" in w or "strawberries" in w:
        stems.update(["strawberr", "strawberry", "strawberries"])
    if "basil" in w:
        stems.update(["basil", "pesto"])
    if "garlic" in w:
        stems.update(["garlic", "aglio"])
    if "paneer" in w:
        stems.update(["paneer", "cottage cheese"])
    if "spinach" in w or "palak" in w:
        stems.update(["spinach", "palak"])
    return [s for s in stems if len(s) >= 3]

class DisruptionInterpreter:
    """
    Parses unstructured kitchen disruption alerts into typed operational parameters.
    Supports live Gemini 2.5 Flash via official GenAI SDK, with deterministic fallback.
    """

    SYSTEM_PROMPT = """You are the Kitchen Disruption Intelligence specialist for STILLGOOD.
Your job is to extract exact operational parameters from kitchen manager voice/text alerts into strict JSON:
{
  "original_expected_meals": int,
  "revised_expected_meals": int,
  "service_buffer_percentage": float,
  "supplier_disruptions": [{"supplier_name": str, "ingredient": str, "status": str}],
  "dietary_constraints": [{"tag": str, "min_meals": int}],
  "inventory_priorities": [str],
  "excluded_ingredients": [str],
  "explanation": str
}
Rules:
- Never hallucinate ingredients not mentioned.
- If attendance drops from X to Y, record both.
- Return ONLY valid raw JSON."""

    @classmethod
    def interpret(cls, text: str, kitchen_id: str = "kitchen_corporate_apex") -> ParsedScenario:
        scenario_id = f"SCEN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        # 1. Attempt Live Gemini invocation if client is configured
        if gemini_service.is_live:
            prompt = f"Analyze this kitchen disruption notice and extract parameters:\n\n{text}"
            try:
                response_text = gemini_service.generate_content(
                    prompt=prompt,
                    system_instruction=cls.SYSTEM_PROMPT
                )
                if response_text:
                    # Clean markdown fence if present
                    clean_json = response_text.strip()
                    if clean_json.startswith("```"):
                        clean_json = re.sub(r"^```(?:json)?\n", "", clean_json)
                        clean_json = re.sub(r"\n```$", "", clean_json)
                    data = json.loads(clean_json)
                    return ParsedScenario(
                        scenario_id=scenario_id,
                        kitchen_id=kitchen_id,
                        original_expected_meals=data.get("original_expected_meals", 500),
                        revised_expected_meals=data.get("revised_expected_meals", 350),
                        service_buffer_percentage=data.get("service_buffer_percentage", 5.0),
                        supplier_disruptions=data.get("supplier_disruptions", []),
                        dietary_constraints=data.get("dietary_constraints", [{"tag": "vegetarian", "min_meals": 120}]),
                        inventory_priorities=data.get("inventory_priorities", []),
                        excluded_ingredients=data.get("excluded_ingredients", []),
                        raw_explanation=data.get("explanation", text),
                        confidence=0.98,
                        extraction_source="Gemini 2.5 Flash (Live Vertex AI/GenAI SDK)"
                    )
            except Exception as e:
                logger.warning(f"Live Gemini extraction encountered error: {e}. Switching to deterministic parser.")

        # 2. Robust Deterministic Parser (Always works offline & testable)
        is_restaurant = "verde" in kitchen_id or "restaurant" in kitchen_id
        revised_meals = 70 if is_restaurant else 350
        original_meals = 120 if is_restaurant else 500
        default_veg = 35 if is_restaurant else 120

        # Extract number patterns: e.g. "from 500 to 350" or "dropped to 350"
        from_to_match = re.search(r"from\s+(\d+)\s+to\s+(\d+)", text, re.IGNORECASE)
        if from_to_match:
            original_meals = int(from_to_match.group(1))
            revised_meals = int(from_to_match.group(2))
        else:
            to_match = re.search(r"(?:to|attendance|dropped)\s+(?:only\s+)?(\d+)", text, re.IGNORECASE)
            if to_match:
                revised_meals = int(to_match.group(1))

        # Dietary constraints
        dietary_constraints = []
        veg_match = re.search(r"(\d+)\s+(?:vegetarian|veg)", text, re.IGNORECASE)
        if veg_match:
            dietary_constraints.append({
                "tag": "vegetarian",
                "min_meals": int(veg_match.group(1))
            })
        else:
            dietary_constraints.append({
                "tag": "vegetarian",
                "min_meals": default_veg
            })

        # Supplier disruptions & Excluded ingredients (Dynamic across ALL ingredients)
        supplier_disruptions = []
        excluded_ingredients = []
        lowered_txt = text.lower()

        KNOWN_ING_LIST = [
            ("strawberr", "strawberries", "Organic Berry Collective"),
            ("cream", "cream", "Country Fresh Dairy"),
            ("dairy", "cream", "Country Fresh Dairy"),
            ("paneer", "paneer", "Fresh Dairy Farms Co."),
            ("tomato", "tomatoes", "Valley Fresh Produce"),
            ("basil", "basil", "Metro Herb Growers"),
            ("garlic", "garlic", "Valley Fresh Produce"),
            ("spinach", "spinach", "Valley Fresh Produce"),
            ("mushroom", "mushrooms", "Organic Woodland Collective"),
            ("pasta", "fettuccine", "Artisan Pasta Works"),
            ("fettuccine", "fettuccine", "Artisan Pasta Works"),
            ("penne", "penne", "Artisan Pasta Works"),
            ("rice", "basmati rice", "Golden Harvest Grains"),
            ("lentil", "lentils", "Golden Harvest Grains"),
            ("dal", "lentils", "Golden Harvest Grains"),
            ("potato", "potatoes", "Valley Fresh Produce"),
            ("flour", "flour", "Golden Harvest Grains"),
            ("parmigiano", "parmigiano", "Country Fresh Dairy"),
            ("parmesan", "parmigiano", "Country Fresh Dairy"),
        ]

        found_any = False
        is_disrupted = any(term in lowered_txt for term in [
            "out of stock", "unavailable", "not available", "shortage", "missing",
            "delay", "delayed", "late", "no ", "spoil", "depleted", "halt",
            "cannot deliver", "unable to deliver", "can't deliver", "delivery issue", "disrupt"
        ])
        for kw, canonical, supp_name in KNOWN_ING_LIST:
            if kw in lowered_txt:
                is_prioritized = re.search(rf"(?:prioritize|rescue|utilize|use|feature|save)\s+(?:eligible\s+|at-risk\s+|fresh\s+)?{kw}", lowered_txt) is not None
                kw_disrupted = (
                    re.search(rf"\b{kw}[a-z]*\b[^\.\,\;]*?(?:cannot deliver|out of stock|unavailable|not available|delayed|late|spoiled|missing|shortage|cannot|halt)", lowered_txt) is not None or
                    re.search(rf"(?:cannot deliver|out of stock|unavailable|not available|delayed|late|spoiled|missing|shortage|no more|no\s+)[^\.\,\;]*?\b{kw}[a-z]*\b", lowered_txt) is not None or
                    any(term in lowered_txt for term in [f"{kw} out of stock", f"{kw} unavailable", f"no {kw}", f"no {canonical}"])
                )
                if (kw_disrupted or is_disrupted) and not is_prioritized:
                    if canonical not in excluded_ingredients:
                        excluded_ingredients.append(canonical)
                        supplier_disruptions.append({
                            "supplier_name": supp_name,
                            "ingredient": canonical,
                            "status": "out_of_stock" if any(t in lowered_txt for t in ["out of stock", "unavailable", "missing", "depleted"]) else "delayed_after_lunch",
                            "detail": f"{canonical.capitalize()} disrupted for service."
                        })
                        found_any = True

        if not found_any and is_disrupted:
            # Generic pattern extractor for novel ingredients
            p_match = re.search(r"([a-zA-Z\s]{2,20})\s+(?:is|are|has been|were)\s+(?:out of stock|unavailable|delayed|spoiled|missing|short|depleted)", lowered_txt)
            if not p_match:
                p_match = re.search(r"(?:out of stock|unavailable|missing|delayed|shortage of|shortage in|spoiled|spoilage in|no more|ran out of)\s+(?:of\s+)?([a-zA-Z\s]{2,20})", lowered_txt)
            if p_match:
                cand = p_match.group(1).strip()
                cand = re.sub(r"^(?:the|our|fresh|all|organic)\s+", "", cand).strip()
                cand = re.split(r"\s+(?:for|in|due|because|and|on|at)\b", cand)[0].strip()
                if cand and cand not in {"days", "hours", "service"}:
                    excluded_ingredients.append(cand)
                    supplier_disruptions.append({
                        "supplier_name": "Direct Supplier",
                        "ingredient": cand,
                        "status": "out_of_stock",
                        "detail": f"{cand.capitalize()} reported out of stock."
                    })

        # Inventory priorities
        inventory_priorities = []
        if "spinach" in text.lower():
            inventory_priorities.append("spinach")
        if "strawberr" in text.lower() and "strawberries" not in excluded_ingredients:
            inventory_priorities.append("strawberries")

        exp_parts = []
        if original_meals != revised_meals:
            exp_parts.append(f"Detected attendance shift from {original_meals} to {revised_meals} meals.")
        else:
            exp_parts.append(f"Targeting {revised_meals} meals for service.")

        for excl in excluded_ingredients:
            exp_parts.append(f"Identified {excl} outage/delay (excluding affected {excl} recipes).")

        if inventory_priorities:
            exp_parts.append(f"Prioritizing eligible at-risk {', '.join(inventory_priorities)}.")

        exp_parts.append(f"Enforced minimum {dietary_constraints[0]['min_meals']} vegetarian meals.")
        explanation = " ".join(exp_parts)

        return ParsedScenario(
            scenario_id=scenario_id,
            kitchen_id=kitchen_id,
            original_expected_meals=original_meals,
            revised_expected_meals=revised_meals,
            service_buffer_percentage=5.0,
            supplier_disruptions=supplier_disruptions,
            dietary_constraints=dietary_constraints,
            inventory_priorities=inventory_priorities,
            excluded_ingredients=excluded_ingredients,
            raw_explanation=explanation,
            confidence=0.95,
            extraction_source="STILLGOOD Deterministic NLP Parser"
        )

    @classmethod
    def extract_disruption_proposal(
        cls,
        text: str,
        kitchen_id: str = "kitchen_restaurant_verde"
    ) -> DisruptionProposalResponse:
        """
        Part 1: Gemini Disruption Extraction & Confirmation Proposal.
        Extracts structured fields (ingredient, issue, duration, confirmation needed).
        Does NOT immediately mutate inventory; stages disruption in PENDING_CONFIRMATION state.
        """
        from app.core.database import db
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        lowered = text.lower()

        # 1. Parse entity and issue (Dynamic for ANY ingredient)
        affected_entity = "ingredient"
        affected_name = "strawberries"
        issue_type = "out_of_stock"

        # Check known kitchen ingredient keywords
        KNOWN_ING_LIST = [
            ("strawberr", "strawberries", "ingredient"),
            ("cream", "cream", "ingredient"),
            ("dairy", "cream", "ingredient"),
            ("paneer", "paneer", "ingredient"),
            ("tomato", "tomatoes", "ingredient"),
            ("basil", "basil", "ingredient"),
            ("garlic", "garlic", "ingredient"),
            ("spinach", "spinach", "ingredient"),
            ("mushroom", "mushrooms", "ingredient"),
            ("pasta", "fettuccine", "ingredient"),
            ("fettuccine", "fettuccine", "ingredient"),
            ("penne", "penne", "ingredient"),
            ("rice", "basmati rice", "ingredient"),
            ("lentil", "lentils", "ingredient"),
            ("dal", "lentils", "ingredient"),
            ("potato", "potatoes", "ingredient"),
            ("flour", "flour", "ingredient"),
            ("parmigiano", "parmigiano", "ingredient"),
            ("parmesan", "parmigiano", "ingredient"),
            ("oven", "combi_oven", "equipment"),
            ("steamer", "steamer", "equipment"),
        ]

        found_known = False
        for kw, canonical, entity_type in KNOWN_ING_LIST:
            if kw in lowered:
                affected_name = canonical
                affected_entity = entity_type
                found_known = True
                break

        if not found_known:
            # Try natural language pattern matching:
            # e.g. "X is out of stock", "X are unavailable", "out of stock of X"
            match = re.search(r"([a-zA-Z\s]{2,20})\s+(?:is|are|has been|were)\s+(?:out of stock|unavailable|delayed|spoiled|missing|short|depleted)", lowered)
            if not match:
                match = re.search(r"(?:out of stock|unavailable|missing|delayed|shortage of|shortage in|spoiled|spoilage in|no more|ran out of)\s+(?:of\s+)?([a-zA-Z\s]{2,20})", lowered)
            if match:
                candidate = match.group(1).strip()
                candidate = re.sub(r"^(?:the|our|fresh|all|organic)\s+", "", candidate).strip()
                candidate = re.split(r"\s+(?:for|in|due|because|and|on|at)\b", candidate)[0].strip()
                if candidate and candidate not in {"days", "hours", "service"}:
                    affected_name = candidate
                    affected_entity = "ingredient"
                    found_known = True

        if not found_known:
            words = [w for w in re.findall(r"[a-zA-Z]{3,}", text) if w.lower() not in {"the", "and", "are", "out", "for", "next", "days", "stock", "not", "have"}]
            affected_name = words[0].lower() if words else "ingredient"

        # Parse issue type
        if any(term in lowered for term in ["out of stock", "unavailable", "not available", "missing", "depleted", "ran out", "shortage"]):
            issue_type = "out_of_stock"
        elif any(term in lowered for term in ["delay", "delayed", "late", "traffic", "truck"]):
            issue_type = "delayed"
        elif any(term in lowered for term in ["spoil", "rotten", "bad", "expired", "temperature breach"]):
            issue_type = "spoilage"
        elif any(term in lowered for term in ["break", "broken", "offline", "fault", "repair"]):
            issue_type = "breakdown"
        else:
            issue_type = "out_of_stock" 

        # 2. Parse duration (e.g. "five days", "5 days", "3 days")
        duration_days = None
        duration_match = re.search(r"(\d+)\s+days?", lowered)
        if duration_match:
            duration_days = int(duration_match.group(1))
        elif "five days" in lowered or "5 days" in lowered:
            duration_days = 5
        elif "three days" in lowered or "3 days" in lowered:
            duration_days = 3
        elif "one week" in lowered or "1 week" in lowered or "week" in lowered:
            duration_days = 7
        elif "tomorrow" in lowered:
            duration_days = 1

        missing_info = duration_days is None
        if missing_info:
            duration_days = 1
            clarification_message = f"Disruption detected for '{affected_name}', but duration was not specified. Defaulting to 1 service day. Please clarify or edit expected duration."
        else:
            clarification_message = f"Extracted {duration_days}-day {issue_type.replace('_', ' ')} disruption for {affected_name}."

        end_date = (now + timedelta(days=duration_days)).strftime("%Y-%m-%d")

        # 3. Look up affected recipes from database (Dynamic stem and word matching)
        kitchen_recipes = db.get_recipes(kitchen_id)
        affected_recipes = []
        target_stems = get_ingredient_stems(affected_name)
        for r in kitchen_recipes:
            r_lower = r.name.lower()
            if any(s in r_lower for s in target_stems):
                affected_recipes.append(r)
                continue
            for ing in r.ingredients:
                ing_lower = ing.ingredient_name.lower()
                ing_id_lower = ing.ingredient_id.lower()
                if any(s in ing_lower or s in ing_id_lower for s in target_stems):
                    affected_recipes.append(r)
                    break

        recipe_ids = [r.id for r in affected_recipes]
        recipe_names = [r.name for r in affected_recipes]

        disruption_id = f"DISR-{kitchen_id[:3].upper()}-{now.strftime('%Y%m%d%H%M%S')}"
        confirmation_needed = (
            f"Please confirm operational impact: Is existing on-hand cooler stock of {affected_name} already depleted, "
            f"or is only incoming supplier delivery halted for the next {duration_days} days?"
        )

        disruption = TemporaryDisruption(
            id=disruption_id,
            kitchen_id=kitchen_id,
            affected_entity_type=affected_entity,
            affected_name=affected_name,
            issue_type=issue_type,
            start_date=today_str,
            end_date=end_date,
            duration_days=duration_days,
            actual_resolution_time=None,
            source_and_evidence=text,
            confirmation_status=DisruptionStatus.PENDING_CONFIRMATION,
            confirmation_needed=confirmation_needed,
            confirmation_details=None,
            created_by="Kitchen Operations Manager",
            created_at=now.strftime("%Y-%m-%d %H:%M UTC"),
            last_updated=now.strftime("%Y-%m-%d %H:%M UTC"),
            affected_recipe_ids=recipe_ids,
            affected_recipe_names=recipe_names,
            is_active=True
        )

        options = [
            {
                "action": "confirm_all_depleted",
                "label": f"Confirm: Both Existing Stock Depleted & Supplier Halted (86 all {len(recipe_names)} recipes)",
                "stock_depleted": True,
                "supplier_halted": True
            },
            {
                "action": "confirm_supplier_only",
                "label": f"Confirm: Future Supplier Halted Only (Keep remaining verified cooler stock active today)",
                "stock_depleted": False,
                "supplier_halted": True
            },
            {
                "action": "reject",
                "label": "Reject / Cancel this Alert (No recipes changed)",
                "stock_depleted": False,
                "supplier_halted": False
            }
        ]

        # Stage proposal in DB idempotently
        staged = db.stage_disruption(disruption)

        return DisruptionProposalResponse(
            extracted_disruption=staged,
            clarification_message=clarification_message,
            confirmation_prompt=confirmation_needed,
            options=options
        )
