from ingredient_matcher import matcher
from product_scoring import calculate_dynamic_concentration

def calculate_efficacy(ingredients_list, product_category="general"):
    """
    Analyzes the efficacy of a product based on ingredient concentration and active thresholds.
    
    Args:
        ingredients_list (list): List of ingredient strings.
        product_category (str): Product category.
        
    Returns:
        dict: {
            "efficacy_score": float (0-100),
            "angel_dusting_flags": list of strings,
            "hero_ingredients": list of strings,
            "analysis_summary": str
        }
    """
    if not ingredients_list:
        return {"efficacy_score": 0, "angel_dusting_flags": [], "hero_ingredients": [], "analysis_summary": "No ingredients found."}

    # 1. Get Dynamic Weights (Concentration Estimates)
    weights = calculate_dynamic_concentration(ingredients_list, product_category)
    
    # 2. Identify Ingredients & Check Thresholds
    hero_ingredients = []
    angel_dusting_flags = []
    total_efficacy_points = 0
    max_possible_points = 0
    
    # Base score starts at 50 (Average)
    score = 50.0
    
    found_actives = False
    
    for idx, ing_name in enumerate(ingredients_list):
        weight = weights[idx]
        
        # Match to DB
        match_result = matcher.match(ing_name)
        if not match_result:
            continue
            
        db_entry = match_result["match"]
        active_threshold = db_entry.get("active_threshold") # e.g., 2.0 (%) or 0.1 (%)
        
        # Is this an "Active" ingredient? (Has a threshold defined)
        if active_threshold is not None:
            found_actives = True
            max_possible_points += 20
            
            # Heuristic: 
            # High Weight (>0.5) ~= High Concentration (>1%)
            # Low Weight (<=0.1) ~= Low Concentration (<1%)
            
            is_high_concentration = weight > 0.4
            is_low_concentration = weight <= 0.1
            
            # Logic:
            # If threshold > 1.0 (needs high %) AND is_low_concentration -> ANGEL DUSTING
            # If threshold <= 1.0 (potent at low %) AND is_low_concentration -> OK
            
            if active_threshold > 1.0 and is_low_concentration:
                # ANGEL DUSTING DETECTED
                angel_dusting_flags.append(f"⚠️ {db_entry['name']}: Likely ineffective (Low concentration detected)")
                score -= 10
                # No points added
            elif is_high_concentration:
                # Good concentration
                hero_ingredients.append(f"✅ {db_entry['name']} (High Concentration)")
                score += 20
                total_efficacy_points += 20
            else:
                # Middle ground or Potent Low-Conc ingredient
                hero_ingredients.append(f"{db_entry['name']}")
                score += 10
                total_efficacy_points += 10

    # 3. Normalize Score
    # If no actives found, score remains 50 (Basic moisturizer)
    # If actives found, we scale based on how many were effective
    
    if found_actives:
        # Cap at 100, Min at 0
        score = max(0, min(100, score))
    else:
        score = 50 # Neutral/Basic
        
    # Generate Summary
    if score >= 80:
        summary = "High Efficacy: Contains effective concentrations of key actives."
    elif score >= 50:
        summary = "Moderate Efficacy: Standard formulation."
    else:
        summary = "Low Efficacy: Key ingredients may be in ineffective concentrations."
        
    if angel_dusting_flags:
        summary += " Warning: Potential 'Angel Dusting' detected."

    return {
        "efficacy_score": round(score, 1),
        "angel_dusting_flags": angel_dusting_flags,
        "hero_ingredients": hero_ingredients,
        "analysis_summary": summary
    }
