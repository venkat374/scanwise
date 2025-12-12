from wellness_engine import calculate_wellness_match

def test_wellness_engine():
    print("--- Testing Wellness Match Engine ---")

    # Case 1: Perfect Match (Acne User + Salicylic Acid)
    print("\nCase 1: Acne User + Salicylic Acid")
    profile_acne = {
        "skin_type": "Oily",
        "skin_concerns": ["Acne", "Pores"],
        "age_group": "25-34",
        "allergies": []
    }
    ingredients_acne = ["Water", "Salicylic Acid", "Glycerin"]
    result = calculate_wellness_match(ingredients_acne, profile_acne)
    print(f"Score: {result['score']}, Level: {result['match_level']}")
    print(f"Positives: {result['positive_matches']}")
    
    assert result['score'] > 85, "Should be a high match for Acne/Oily"
    assert "Salicylic Acid is good for Acne" in result['positive_matches'][0] or "Salicylic Acid is good for Acne" in result['positive_matches'][1]

    # Case 2: Mismatch (Dry User + Salicylic Acid)
    print("\nCase 2: Dry User + Salicylic Acid")
    profile_dry = {
        "skin_type": "Dry",
        "skin_concerns": ["Aging"],
        "age_group": "35-44",
        "allergies": []
    }
    result = calculate_wellness_match(ingredients_acne, profile_dry)
    print(f"Score: {result['score']}, Level: {result['match_level']}")
    print(f"Negatives: {result['negative_matches']}")
    
    assert result['score'] < 80, "Should be penalized for Dry skin"
    assert any("not recommended for Dry skin" in m for m in result['negative_matches'])

    # Case 3: Allergy (Peanut)
    print("\nCase 3: Peanut Allergy")
    profile_allergy = {
        "skin_type": "Normal",
        "allergies": ["Peanut"]
    }
    ingredients_allergy = ["Water", "Peanut Oil", "Fragrance"]
    result = calculate_wellness_match(ingredients_allergy, profile_allergy)
    print(f"Score: {result['score']}, Level: {result['match_level']}")
    
    assert result['score'] == 0, "Should be 0 for allergy"
    assert "Unsafe (Allergy)" in result['match_level']

    # Case 4: Age Warning (Child + Retinol)
    print("\nCase 4: Child + Retinol")
    profile_child = {
        "skin_type": "Normal",
        "age_group": "Under 18"
    }
    ingredients_retinol = ["Water", "Retinol"]
    result = calculate_wellness_match(ingredients_retinol, profile_child)
    print(f"Score: {result['score']}, Level: {result['match_level']}")
    print(f"Negatives: {result['negative_matches']}")
    
    assert result['score'] < 80, "Should be penalized for age"
    assert any("too harsh for your age group" in m for m in result['negative_matches'])

    print("\nSUCCESS: All wellness engine tests passed!")

if __name__ == "__main__":
    test_wellness_engine()
