import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from wellness_engine import calculate_wellness_match

def test_wellness(ingredients, profile, description):
    print(f"Testing: {description}")
    print(f"Ingredients: {ingredients}")
    print(f"Profile: {profile}")
    
    result = calculate_wellness_match(ingredients, profile)
    
    print(f"Score: {result['score']} ({result['match_level']})")
    print("Positive Matches:", result['positive_matches'])
    print("Negative Matches:", result['negative_matches'])
    print("-" * 30)

if __name__ == "__main__":
    print("=== Verifying DB-Backed Wellness Engine ===\n")

    # 1. Acne Concern + Niacinamide (Should be Good)
    # Niacinamide in DB has "Anti-Acne" function.
    test_wellness(
        ["Water", "Niacinamide", "Glycerin"],
        {"skin_concerns": ["Acne"], "skin_type": "Oily"},
        "Acne Concern + Niacinamide"
    )

    # 2. Sensitive Skin + Retinol (Should be Bad)
    # Retinol in DB has safety_rating "Caution".
    test_wellness(
        ["Water", "Retinol", "Glycerin"],
        {"skin_type": "Sensitive"},
        "Sensitive Skin + Retinol"
    )

    # 3. Dry Skin + Hyaluronic Acid (Should be Good)
    # Hyaluronic Acid in DB has "Hydration" function.
    test_wellness(
        ["Water", "Hyaluronic Acid", "Phenoxyethanol"],
        {"skin_type": "Dry"},
        "Dry Skin + Hyaluronic Acid"
    )
