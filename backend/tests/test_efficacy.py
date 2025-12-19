import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from efficacy_engine import calculate_efficacy

def test_efficacy_structure():
    # Mock ingredients that should trigger hero ingredients
    ingredients = ["Retinol", "Water", "Glycerin"]
    
    # We need to ensure 'Retinol' is in the DB or mocked.
    # Assuming it is in the matcher DB.
    
    result = calculate_efficacy(ingredients, "serum")
    
    print("Result keys:", result.keys())
    print("Hero Ingredients:", result["hero_ingredients"])
    
    # Check structure
    for hero in result["hero_ingredients"]:
        if not isinstance(hero, dict):
            print("FAIL: Hero ingredient is not a dict")
            return
        if "name" not in hero or "concentration_estimate" not in hero:
            print("FAIL: Missing keys in hero ingredient")
            return
            
    print("PASS: Structure is correct")

if __name__ == "__main__":
    test_efficacy_structure()
