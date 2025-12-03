from ai_explainer import explain_ingredient_with_ai, analyze_routine_with_ai
import os
from dotenv import load_dotenv

load_dotenv()

def test_explain_ingredient():
    print("Testing explain_ingredient_with_ai...")
    ingredient = "Retinol"
    result = explain_ingredient_with_ai(ingredient)
    print(f"Input: {ingredient}")
    print(f"Output: {result}")
    
    if "description" in result and result["risk_level"] != "Unknown":
        print("SUCCESS: Got valid explanation.")
    else:
        print("FAILURE: Could not get valid explanation.")

def test_analyze_routine():
    print("\nTesting analyze_routine_with_ai...")
    products = [
        {"name": "Retinol Serum", "ingredients": ["Retinol", "Water", "Glycerin"]},
        {"name": "Vitamin C Serum", "ingredients": ["Ascorbic Acid", "Water", "Propylene Glycol"]}
    ]
    result = analyze_routine_with_ai(products)
    print(f"Input: {products}")
    print(f"Output: {result}")
    
    if "conflicts" in result and "analysis" in result:
        print("SUCCESS: Got valid routine analysis.")
    else:
        print("FAILURE: Could not get valid routine analysis.")

if __name__ == "__main__":
    if not os.getenv("GOOGLE_API_KEY"):
        print("WARNING: GOOGLE_API_KEY not found. Skipping AI test.")
    else:
        test_explain_ingredient()
        test_analyze_routine()
