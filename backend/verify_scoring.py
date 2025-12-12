import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from product_scoring import calculate_dynamic_concentration

def test_concentration(ingredients, category, description):
    print(f"Testing: {description} (Category: {category})")
    print(f"Ingredients: {ingredients}")
    
    weights = calculate_dynamic_concentration(ingredients, category)
    
    print("Weights:")
    for ing, w in zip(ingredients, weights):
        print(f"  - {ing}: {w:.4f}")
        
    print("-" * 30)

if __name__ == "__main__":
    print("=== Verifying Advanced Concentration Logic ===\n")

    # 1. Phenoxyethanol Rule
    ing_list_1 = ["Water", "Glycerin", "Niacinamide", "Phenoxyethanol", "Retinol", "Fragrance"]
    test_concentration(ing_list_1, "general", "Phenoxyethanol Rule (Retinol should be low)")

    # 2. Serum Curve (High Actives)
    ing_list_2 = ["Water", "Ascorbic Acid", "Glycerin", "Ferulic Acid", "Phenoxyethanol"]
    test_concentration(ing_list_2, "serum", "Serum Curve (Top ingredients should stay high)")

    # 3. Cleanser Curve (Steep Drop)
    ing_list_3 = ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Glycerin", "Phenoxyethanol"]
    test_concentration(ing_list_3, "cleanser", "Cleanser Curve (Should drop fast)")
    
    # 4. No Marker
    ing_list_4 = ["Water", "Glycerin", "Niacinamide", "Ceramides"]
    test_concentration(ing_list_4, "moisturizer", "No Marker (Standard Decay)")
