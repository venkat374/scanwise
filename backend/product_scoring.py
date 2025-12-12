def calculate_dynamic_concentration(ingredients_list, product_category="general"):
    """
    Estimates the concentration of each ingredient based on its position and the '1% Line'.
    
    Args:
        ingredients_list (list): List of ingredient names.
        product_category (str): 'cleanser', 'serum', 'moisturizer', etc.
        
    Returns:
        list: List of weights (0.0 to 1.0) corresponding to each ingredient.
    """
    total_ingredients = len(ingredients_list)
    weights = []
    
    # 1. Find the "1% Line" Marker
    # Common markers: Phenoxyethanol, Parfum, Fragrance, Xanthan Gum, Carbomer
    markers = ["phenoxyethanol", "parfum", "fragrance", "xanthan gum", "carbomer", "disodium edta"]
    cutoff_index = total_ingredients # Default to end
    
    for idx, ing in enumerate(ingredients_list):
        if any(m in ing.lower() for m in markers):
            cutoff_index = idx
            break
            
    # 2. Define Curves based on Category
    # 'serum': High actives at top, steep drop.
    # 'cleanser': High water/surfactant at top, very low actives.
    # 'moisturizer': Balanced.
    
    if product_category == "serum":
        # Steep curve: Top 3 are 80%, rest drop fast
        decay_rate = 0.8
    elif product_category == "cleanser":
        # Very steep: Top 2 are 90%
        decay_rate = 0.7
    else:
        # Standard (Moisturizer/General)
        decay_rate = 0.9
        
    # 3. Calculate Weights
    for i in range(total_ingredients):
        if i < cutoff_index:
            # Above 1% line: Exponential Decay
            weight = decay_rate ** i
        else:
            # Below 1% line: Flatline (Trace amounts)
            # Usually < 1%, so we give it a low fixed weight
            weight = 0.05 
            
        weights.append(weight)
        
    return weights

def calculate_product_toxicity(toxicity_report, usage_frequency="daily", amount_applied="normal", product_category="general"):
    if len(toxicity_report) == 0:
        return 0, "SAFE", {}

    # 1. Define Multipliers
    freq_mult = {"daily": 1.0, "weekly": 0.5, "occasional": 0.2}.get(usage_frequency.lower(), 1.0)
    amount_mult = {"pea": 0.5, "normal": 1.0, "generous": 1.5}.get(amount_applied.lower(), 1.0)
    
    usage_factor = freq_mult * amount_mult

    # 2. Advanced Concentration Logic
    ingredient_names = [item["ingredient"] for item in toxicity_report]
    weights = calculate_dynamic_concentration(ingredient_names, product_category)
    
    total_weight = 0
    weighted_sum = 0
    
    for idx, item in enumerate(toxicity_report):
        weight = weights[idx]
        score = item["score"]
        
        weighted_sum += score * weight
        total_weight += weight

    base_score = weighted_sum / total_weight if total_weight > 0 else 0
    
    # 3. Apply Usage Factor
    final_score = base_score * usage_factor
    
    # Cap at 1.0
    final_score = min(final_score, 1.0)

    # 4. Determine Status
    if final_score >= 0.60:
        status = "TOXIC"
    elif final_score >= 0.30:
        status = "MODERATE"
    else:
        status = "SAFE"

    return final_score, status, {
        "base_score": round(base_score, 3),
        "usage_factor": round(usage_factor, 2),
        "final_score": round(final_score, 3)
    }
