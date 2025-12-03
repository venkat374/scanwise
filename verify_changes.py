import requests
import json

BASE_URL = "http://localhost:8000"

def test_scoring():
    print("Testing Scoring Logic...")
    
    # Scenario 1: High Usage, High Concentration of Toxic Ingredient
    # Assuming 'paraben' is toxic and 'water' is safe.
    payload_1 = {
        "product_name": "Test Product High Risk",
        "skin_type": "Normal",
        "skin_tone": "Medium",
        "usage_frequency": "Daily",
        "amount_applied": "Generous"
    }
    # We need to mock the ingredients or use a product name that returns known ingredients.
    # Since I can't easily mock the scraper without changing code, I'll rely on the fact that the scraper might fail or return empty if not found.
    # Wait, I should check if I can mock the `get_ingredients_from_product` function or just use a dummy product name if the scraper uses a real API/site.
    # Looking at `fetch_ingredients.py` (I haven't seen it fully but assuming it hits an endpoint).
    
    # Actually, let's just test the scoring function directly by importing it, 
    # that avoids the network dependency and scraper flakiness.
    
    from backend.product_scoring import calculate_product_toxicity
    
    # Mock Toxicity Report
    mock_report_toxic_first = [
        {"ingredient": "Toxic Stuff", "score": 0.9, "label": "HIGH RISK"},
        {"ingredient": "Water", "score": 0.0, "label": "SAFE"},
        {"ingredient": "Aloe", "score": 0.0, "label": "SAFE"}
    ]
    
    score_1, status_1, details_1 = calculate_product_toxicity(mock_report_toxic_first, "Daily", "Generous")
    print(f"Scenario 1 (Toxic First, High Usage): Score={score_1}, Status={status_1}")
    
    # Scenario 2: Low Usage, Toxic Ingredient Last
    mock_report_toxic_last = [
        {"ingredient": "Water", "score": 0.0, "label": "SAFE"},
        {"ingredient": "Aloe", "score": 0.0, "label": "SAFE"},
        {"ingredient": "Toxic Stuff", "score": 0.9, "label": "HIGH RISK"}
    ]
    
    score_2, status_2, details_2 = calculate_product_toxicity(mock_report_toxic_last, "Occasional", "Pea")
    print(f"Scenario 2 (Toxic Last, Low Usage): Score={score_2}, Status={status_2}")
    
    if score_1 > score_2:
        print("PASS: Weighted scoring and usage factors are working.")
    else:
        print("FAIL: Logic check failed.")

if __name__ == "__main__":
    # Add backend directory to sys.path to allow imports
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    
    test_scoring()
