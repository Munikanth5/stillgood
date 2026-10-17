import json
import logging
from typing import List, Dict, Any, Optional
from app.models.schemas import PreparedFoodBatch, MealComboProposal
from app.ai.gemini_client import gemini_service
from app.engine.combo_validator import DeterministicComboValidator

logger = logging.getLogger("stillgood.combos")

class GeminiMealComboGenerator:
    """
    Combines verified, eligible prepared surplus dishes into appetizing customer offers.
    Gemini generates creative culinary pairings and transparent descriptions.
    DeterministicComboValidator independently audits food safety, allergens, and margins.
    """

    @classmethod
    def generate_combos(
        cls,
        kitchen_id: str,
        eligible_batches: List[PreparedFoodBatch]
    ) -> List[MealComboProposal]:
        if not eligible_batches:
            return []

        # If we have at least 2 batches, pair them!
        proposals: List[MealComboProposal] = []

        # System prompt for Gemini
        system_instruction = (
            "You are an executive restaurant chef and hospitality pricing expert. "
            "Given a list of verified, safe prepared surplus dishes, create customer-friendly meal combinations. "
            "NEVER invent ingredients or dishes not listed. "
            "Ensure dishes are culinary complements (e.g., pasta + soup or entrée + dessert). "
            "Return valid JSON with: title, customer_description, why_paired."
        )

        # Batch summary for Gemini
        dishes_summary = [
            f"- {b.dish_name} ({b.portions_remaining} portions, allergens: {b.allergens}, dietary: {b.dietary_tags})"
            for b in eligible_batches
        ]
        prompt = (
            f"Kitchen: {kitchen_id}\n"
            f"Available safe surplus dishes:\n" + "\n".join(dishes_summary) + "\n\n"
            f"Propose 1 or 2 attractive meal combinations. Return JSON format:\n"
            f"[{{\"title\": \"...\", \"dishes\": [\"...\"], \"customer_description\": \"...\", \"why_paired\": \"...\"}}]"
        )

        gemini_text = gemini_service.generate_content(prompt=prompt, system_instruction=system_instruction)
        parsed_gemini = None
        if gemini_text:
            try:
                clean_json = gemini_text.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                parsed_gemini = json.loads(clean_json.strip())
            except Exception as e:
                logger.warning(f"Could not parse Gemini combo response: {e}")

        # If Gemini returned valid pairs, use them; otherwise use our verified culinary pairing logic
        if parsed_gemini and isinstance(parsed_gemini, list):
            for idx, item in enumerate(parsed_gemini):
                matched_batches = [
                    b for b in eligible_batches
                    if any(d.lower() in b.dish_name.lower() or b.dish_name.lower() in d.lower() for d in item.get("dishes", []))
                ]
                if not matched_batches:
                    matched_batches = eligible_batches[:2]

                proposal = DeterministicComboValidator.validate_and_price_combo(
                    combo_id=f"COMBO-{kitchen_id}-{idx+1}",
                    kitchen_id=kitchen_id,
                    title=item.get("title", "Chef's Daily Surplus Duet"),
                    customer_description=item.get("customer_description", "Freshly prepared fixed-menu dishes packaged in eco-friendly containers."),
                    selected_batches=matched_batches,
                    why_gemini_paired=item.get("why_paired", "Culinary pairing of rich pasta with light seasonal sides.")
                )
                proposals.append(proposal)
        else:
            # Deterministic verified pairing
            if len(eligible_batches) >= 2:
                pair = eligible_batches[:2]
                title = f"Bistro Chef's Pair: {pair[0].dish_name.split()[0]} & {pair[1].dish_name.split()[0]}"
                desc = (
                    f"Enjoy a delicious pairing of our {pair[0].dish_name} with {pair[1].dish_name}. "
                    f"Freshly prepared during dinner service, safely held at optimal temperature, and packaged for immediate takeaway."
                )
                why = (
                    f"Balances the savory richness of {pair[0].dish_name} with the fresh texture of {pair[1].dish_name}. "
                    f"Recovers 100% of ingredient value while offering guests an affordable 35% discount."
                )
                proposal = DeterministicComboValidator.validate_and_price_combo(
                    combo_id=f"COMBO-{kitchen_id}-01",
                    kitchen_id=kitchen_id,
                    title=title,
                    customer_description=desc,
                    selected_batches=pair,
                    why_gemini_paired=why
                )
                proposals.append(proposal)

            # Single item rescue combo (e.g. dessert special or individual meal deal)
            if len(eligible_batches) >= 1:
                single = eligible_batches[0]
                title = f"Chef's Quick-Recovery: {single.dish_name}"
                desc = f"Fresh portion of {single.dish_name} from today's service. Packaged hot and ready for pickup."
                why = f"Direct value recovery of remaining {single.portions_remaining} portions before evening service close."
                proposal = DeterministicComboValidator.validate_and_price_combo(
                    combo_id=f"COMBO-{kitchen_id}-02",
                    kitchen_id=kitchen_id,
                    title=title,
                    customer_description=desc,
                    selected_batches=[single],
                    why_gemini_paired=why
                )
                proposals.append(proposal)

        return proposals
