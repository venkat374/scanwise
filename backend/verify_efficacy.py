import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from efficacy_engine import calculate_efficacy

def test_efficacy(ingredients, category, description):
    print(f"Testing: {description} (Category: {category})")
    print(f"Ingredients: {ingredients}")
    
    result = calculate_efficacy(ingredients, category)
    
    print(f"Score: {result['efficacy_score']}")
    print("Hero Ingredients:", result['hero_ingredients'])
    print("Angel Dusting Flags:", result['angel_dusting_flags'])
    print("Summary:", result['analysis_summary'])
    print("-" * 30)

if __name__ == "__main__":
    print("=== Verifying Efficacy Engine ===\n")

    # 1. Angel Dusting Case
    # Retinol is after Phenoxyethanol (Low concentration)
    # Retinol threshold is 0.1%. Wait, my DB says 0.1%. 
    # If weight is <= 0.1, is it Angel Dusting?
    # In my logic: if threshold > 1.0 AND low_conc -> Flag.
    # Retinol threshold is 0.1. So it should NOT flag if it's low.
    # Wait, let's check Niacinamide (Threshold 2.0).
    
    ing_list_1 = ["Water", "Glycerin", "Phenoxyethanol", "Niacinamide", "Fragrance"]
    test_efficacy(ing_list_1, "serum", "Angel Dusting (Low Niacinamide)")

    # 2. High Efficacy Case
    # Ascorbic Acid (Vit C) at top (High concentration)
    ing_list_2 = ["Water", "Ascorbic Acid", "Glycerin", "Phenoxyethanol"]
    test_efficacy(ing_list_2, "serum", "High Efficacy (High Vit C)")

    # 3. Basic Product
    ing_list_3 = ["Water", "Glycerin", "Dimethicone", "Phenoxyethanol"]
    test_efficacy(ing_list_3, "moisturizer", "Basic Product (No Actives)")
    
    # 4. Retinol Case (Low is OK)
    ing_list_4 = ["Water", "Glycerin", "Phenoxyethanol", "Retinol"]
    test_efficacy(ing_list_4, "serum", "Retinol (Low is OK)")
