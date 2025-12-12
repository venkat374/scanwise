from ingredient_matcher import matcher

def normalize_ingredient(name):
    return name.lower().strip()

def calculate_wellness_match(ingredients, user_profile):
    """
    Calculates a personalized wellness match score (0-100).
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

    # 2. Check Ingredients against Knowledge Base (via Matcher)
    for ing in ingredients:
        # We assume 'ingredients' list passed here might already be canonical, 
        # but let's match again to be sure we get the DB entry
        match_result = matcher.match(ing)
        
        if match_result:
            db_entry = match_result["match"]
            
            # Get attributes from DB entry, default to empty lists
            good_for = db_entry.get("functions", []) # Map functions to good_for logic? 
            # Actually, the DB schema in implementation plan had "functions". 
            # But the hardcoded one had "good_for" / "bad_for".
            # We should probably update the DB schema or map "functions" to "good_for".
            # For now, let's assume the DB has "good_for" and "bad_for" added to it, 
            # or we infer it. 
            # Let's check the DB content I wrote.
            # It has "functions" and "safety_rating".
            # It DOES NOT have "good_for" / "bad_for" lists yet.
            # I need to update the DB content to include these or map them.
            
            # Let's map "functions" to "good_for" for now as a heuristic
            # e.g. "Anti-Acne" -> good for "Acne"
            
            functions = db_entry.get("functions", [])
            
            # Positive Matches
            for concern in skin_concerns:
                # Simple substring match: if concern is "Acne" and function is "Anti-Acne"
                for func in functions:
                    if concern.lower() in func.lower():
                        score += 5
                        positive_matches.append(f"{ing} ({func}) is good for {concern}")
            
            # Skin Type Logic (Heuristic based on functions)
            if skin_type == "Oily" and "Oil Control" in functions:
                 score += 3
                 positive_matches.append(f"{ing} helps with oil control")
            if skin_type == "Dry" and ("Hydration" in functions or "Moisturizer" in functions):
                 score += 3
                 positive_matches.append(f"{ing} is hydrating for Dry skin")
                 
            # Negative Matches (Safety Rating)
            if db_entry.get("safety_rating") == "Caution":
                if skin_type == "Sensitive":
                    score -= 10
                    negative_matches.append(f"{ing} can be irritating for Sensitive skin")
            
            if db_entry.get("safety_rating") == "Risk":
                 score -= 10
                 negative_matches.append(f"{ing} is a potential risk")


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
