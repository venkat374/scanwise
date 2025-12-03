def calculate_product_toxicity(toxicity_report, usage_frequency="daily", amount_applied="normal"):
    if len(toxicity_report) == 0:
        return 0, "SAFE", {}

    # 1. Define Multipliers
    freq_mult = {"daily": 1.0, "weekly": 0.5, "occasional": 0.2}.get(usage_frequency.lower(), 1.0)
    amount_mult = {"pea": 0.5, "normal": 1.0, "generous": 1.5}.get(amount_applied.lower(), 1.0)
    
    usage_factor = freq_mult * amount_mult

    # 2. Weighted Scoring Logic
    # Assumption: Ingredients are listed in descending order of concentration.
    # We apply a decay factor to the weight of each ingredient.
    
    total_weight = 0
    weighted_sum = 0
    
    # Decay factor: 1st ingredient has weight 1.0, 2nd 0.85, 3rd 0.72... (approx)
    # Using a simpler linear decay or exponential decay? Let's use harmonic-like decay for robustness
    # or just a simple step down to avoid over-penalizing the tail.
    
    # Let's use a standard exponential decay: weight = 0.9 ^ index
    decay_rate = 0.9
    
    for idx, item in enumerate(toxicity_report):
        weight = (decay_rate ** idx)
        score = item["score"]
        
        weighted_sum += score * weight
        total_weight += weight

    base_score = weighted_sum / total_weight if total_weight > 0 else 0
    
    # 3. Apply Usage Factor
    # If usage is high, we amplify the toxicity score, but cap it at 1.0
    # If usage is low, we dampen it.
    
    # However, we shouldn't just multiply linearly because a safe product (score 0) shouldn't become toxic just by using it more.
    # But a slightly toxic product (score 0.4) might become dangerous (score 0.8) if used generously daily.
    
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
