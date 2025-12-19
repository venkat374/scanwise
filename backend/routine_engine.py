import json
import os

def load_rules():
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_path, "data", "routine_rules.json")
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading routine rules: {e}")
        return {"conflict_rules": {}, "ingredient_categories": {}}

RULES = load_rules()
CONFLICT_RULES = RULES.get("conflict_rules", {})
INGREDIENT_CATEGORIES = RULES.get("ingredient_categories", {})

def get_ingredient_category(ingredient_name):
    """
    Returns the category of an ingredient if it's a known active.
    """
    norm_name = ingredient_name.lower().strip()
    for key, category in INGREDIENT_CATEGORIES.items():
        if key in norm_name:
            return category
    return None

def check_routine_compatibility(new_product_ingredients, current_routine_products):
    """
    Checks if the new product conflicts with any product in the current routine.
    
    Args:
        new_product_ingredients (list): List of ingredients in the new product.
        current_routine_products (list): List of dicts representing current routine products.
                                         Each dict should have 'product_name' and 'ingredients'.
                                         
    Returns:
        dict: Report containing 'conflicts' (list of warnings) and 'compatible' (bool).
    """
    conflicts = []
    
    # 1. Identify actives in the new product
    new_actives = set()
    for ing in new_product_ingredients:
        cat = get_ingredient_category(ing)
        if cat:
            new_actives.add(cat)
            
    if not new_actives:
        return {"compatible": True, "conflicts": []}
        
    # 2. Check against each product in the routine
    for product in current_routine_products:
        routine_ingredients = product.get('ingredients', [])
        product_name = product.get('product_name', 'Unknown Product')
        
        routine_actives = set()
        for ing in routine_ingredients:
            cat = get_ingredient_category(ing)
            if cat:
                routine_actives.add(cat)
        
        # Check for conflicts between new_actives and routine_actives
        for new_active in new_actives:
            if new_active in CONFLICT_RULES:
                incompatible_list = CONFLICT_RULES[new_active]
                for routine_active in routine_actives:
                    if routine_active in incompatible_list:
                        conflicts.append({
                            "conflict": f"{new_active} vs {routine_active}",
                            "with_product": product_name,
                            "description": f"Avoid using {new_active} (in this product) with {routine_active} (in {product_name}) at the same time to prevent irritation."
                        })
                        
    return {
        "compatible": len(conflicts) == 0,
        "conflicts": conflicts
    }
