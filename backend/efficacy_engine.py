# Common Active Ingredients Whitelist (The "Hero" list)
# We match these by string presence (case-insensitive) to be robust.
HERO_INGREDIENTS_DB = {
    "retinol": "Anti-aging, Cell turnover",
    "retinyl palmitate": "Milder Retinoid, Anti-aging",
    "vitamin c": "Brightening, Antioxidant",
    "ascorbic acid": "Brightening, Antioxidant",
    "niacinamide": "Brightening, Barrier repair, Oil control",
    "hyaluronic acid": "Hydration, Plumping",
    "sodium hyaluronate": "Hydration",
    "salicylic acid": "Exfoliating, Acne-fighting",
    "glycolic acid": "Exfoliating, Brightening",
    "lactic acid": "Exfoliating, Hydrating",
    "azelaic acid": "Redness reduction, Acne-fighting",
    "benzoyl peroxide": "Acne-fighting",
    "ceramide": "Barrier repair",
    "peptide": "Anti-aging, Plumping",
    "panthenol": "Soothing, Hydrating",
    "allantoin": "Soothing",
    "centella asiatica": "Soothing, Healing",
    "madecassoside": "Soothing, Healing",
    "snail secretion filtrate": "Hydration, Repair",
    "bakuchiol": "Natural Retinol alternative",
    "tranexamic acid": "Brightening, Redness reduction",
    "kojic acid": "Brightening",
    "arbutin": "Brightening",
    "vitamin e": "Antioxidant",
    "tocopherol": "Antioxidant",
    "squalane": "Moisturizing, Barrier repair",
    "glycerin": "Hydration (superstar)"
}

def calculate_efficacy(ingredients_list, product_category="general"):
    """
    Analyzes the efficacy of a product based on ingredient presence.
    Uses a whitelist of known 'Hero' ingredients.
    """
    if not ingredients_list:
        return {"efficacy_score": 0, "angel_dusting_flags": [], "hero_ingredients": [], "analysis_summary": "No ingredients found."}

    hero_ingredients = []
    
    # Analyze ingredients
    for ing in ingredients_list:
        ing_lower = ing.lower()
        
        # Check against our whitelist
        for key, benefit in HERO_INGREDIENTS_DB.items():
            if key in ing_lower:
                # Deduplicate if we already have this key concept
                # (e.g. don't list Retinol twice if they have Retinol and Retinyl Palmitate, or maybe do? match strictly)
                
                # Check if we already added this exact hero name
                if not any(h['name'] == key.title() for h in hero_ingredients):
                    hero_ingredients.append({
                        "name": key.title(), # Capitalize for display
                        "concentration_estimate": "Effective", # Simplified
                        "reason": benefit
                    })
    
    # Calculate Score
    # Base score 50 (Hydrating/Basic)
    # Add points for heroes
    score = 50 + (len(hero_ingredients) * 10)
    
    # Cap at 100
    score = min(100, score)
    
    # Summary
    if hero_ingredients:
        names = [h['name'] for h in hero_ingredients[:3]]
        summary = f"Contains active ingredients: {', '.join(names)}."
    else:
        summary = "Basic formulation. Good for maintenance/hydration but relies on basics."

    return {
        "efficacy_score": score,
        "angel_dusting_flags": [], # Disabled as it was unreliable
        "hero_ingredients": hero_ingredients,
        "analysis_summary": summary
    }
