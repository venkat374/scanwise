import re

# Knowledge Base: Ingredient Attributes
# Keys should be lowercase for matching.
INGREDIENT_ATTRIBUTES = {
    "salicylic acid": {
        "good_for": ["Acne", "Oily", "Pores"],
        "bad_for": ["Dry", "Sensitive"],
        "age_warning": ["Under 18"] # Use with caution
    },
    "retinol": {
        "good_for": ["Aging", "Acne", "Texture"],
        "bad_for": ["Sensitive", "Pregnancy"],
        "age_warning": ["Under 18", "18-24"] # Generally for 25+
    },
    "tretinoin": {
        "good_for": ["Aging", "Acne"],
        "bad_for": ["Sensitive", "Pregnancy"],
        "age_warning": ["Under 18"]
    },
    "vitamin c": {
        "good_for": ["Dark Spots", "Aging", "Dullness"],
        "bad_for": ["Sensitive"] # High concentrations can irritate
    },
    "ascorbic acid": { # Vitamin C
        "good_for": ["Dark Spots", "Aging", "Dullness"],
        "bad_for": ["Sensitive"]
    },
    "niacinamide": {
        "good_for": ["Acne", "Pores", "Redness", "Oily", "Dark Spots"],
        "bad_for": [] # Generally well tolerated
    },
    "hyaluronic acid": {
        "good_for": ["Dry", "Aging", "Dehydration"],
        "bad_for": []
    },
    "glycerin": {
        "good_for": ["Dry", "Sensitive"],
        "bad_for": []
    },
    "ceramides": {
        "good_for": ["Dry", "Sensitive", "Aging"],
        "bad_for": []
    },
    "benzoyl peroxide": {
        "good_for": ["Acne"],
        "bad_for": ["Dry", "Sensitive"]
    },
    "glycolic acid": { # AHA
        "good_for": ["Aging", "Texture", "Dark Spots"],
        "bad_for": ["Sensitive", "Dry"]
    },
    "lactic acid": { # AHA
        "good_for": ["Dry", "Aging", "Texture"],
        "bad_for": ["Sensitive"]
    },
    "fragrance": {
        "good_for": [],
        "bad_for": ["Sensitive"]
    },
    "parfum": {
        "good_for": [],
        "bad_for": ["Sensitive"]
    },
    "alcohol denat": {
        "good_for": ["Oily"], # Astringent
        "bad_for": ["Dry", "Sensitive"]
    },
    "essential oil": {
        "good_for": [],
        "bad_for": ["Sensitive"]
    },
    "mineral oil": {
        "good_for": ["Dry"],
        "bad_for": ["Acne", "Oily"] # Comedogenic risk
    },
    "coconut oil": {
        "good_for": ["Dry"],
        "bad_for": ["Acne", "Oily"] # Highly comedogenic
    },
    "shea butter": {
        "good_for": ["Dry"],
        "bad_for": ["Acne"] # Can be heavy
    }
}

def normalize_ingredient(name):
    return name.lower().strip()

def calculate_wellness_match(ingredients, user_profile):
    """
    Calculates a personalized wellness match score (0-100).
    
    Args:
        ingredients (list): List of ingredient strings.
        user_profile (dict): User profile containing skin_type, skin_concerns, age_group, allergies.
        
    Returns:
        dict: {
            "score": float,
            "match_level": str,
            "positive_matches": list,
            "negative_matches": list,
            "allergy_matches": list
        }
    """
    if not user_profile:
        return {
            "score": None,
            "match_level": "Unknown",
            "positive_matches": [],
            "negative_matches": [],
            "allergy_matches": []
        }

    skin_type = user_profile.get("skin_type", "Normal")
    skin_concerns = user_profile.get("skin_concerns", []) or []
    age_group = user_profile.get("age_group", "")
    allergies = user_profile.get("allergies", []) or []
    
    # Base Score
    score = 80.0
    
    positive_matches = []
    negative_matches = []
    allergy_matches = []
    
    # 1. Check Allergies (Critical)
    for ing in ingredients:
        ing_norm = normalize_ingredient(ing)
        for allergy in allergies:
            if allergy.lower() in ing_norm:
                score = 0 # Immediate fail
                allergy_matches.append(f"Contains allergen: {ing}")
    
    if allergy_matches:
        return {
            "score": 0,
            "match_level": "Unsafe (Allergy)",
            "positive_matches": [],
            "negative_matches": [],
            "allergy_matches": allergy_matches
        }

    # 2. Check Ingredients against Knowledge Base
    for ing in ingredients:
        ing_norm = normalize_ingredient(ing)
        
        # Simple partial match to find key in KB
        matched_key = None
        for key in INGREDIENT_ATTRIBUTES:
            if key in ing_norm:
                matched_key = key
                break
        
        if matched_key:
            attrs = INGREDIENT_ATTRIBUTES[matched_key]
            
            # Positive Matches (Concerns & Skin Type)
            # If ingredient is good for a user's concern
            for concern in skin_concerns:
                if concern in attrs["good_for"]:
                    score += 5
                    positive_matches.append(f"{ing} is good for {concern}")
            
            # If ingredient is good for user's skin type
            if skin_type in attrs["good_for"]:
                score += 3
                positive_matches.append(f"{ing} is good for {skin_type} skin")
                
            # Negative Matches (Skin Type & Age)
            if skin_type in attrs["bad_for"]:
                score -= 10
                negative_matches.append(f"{ing} is not recommended for {skin_type} skin")
                
            # Age Warnings
            if "age_warning" in attrs and age_group in attrs["age_warning"]:
                score -= 5
                negative_matches.append(f"{ing} may be too harsh for your age group ({age_group})")

    # Clamp Score
    score = max(0, min(100, score))
    
    # Determine Level
    if score >= 90:
        match_level = "Perfect Match"
    elif score >= 75:
        match_level = "Good Match"
    elif score >= 50:
        match_level = "Fair Match"
    else:
        match_level = "Poor Match"
        
    return {
        "score": round(score, 1),
        "match_level": match_level,
        "positive_matches": list(set(positive_matches)), # Dedupe
        "negative_matches": list(set(negative_matches)),
        "allergy_matches": []
    }
