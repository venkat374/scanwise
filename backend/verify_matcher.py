import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ingredient_matcher import matcher

def test_match(query, expected_name, description):
    print(f"Testing: {description} ('{query}')")
    result = matcher.match(query)
    
    if result:
        matched_name = result['match']['name']
        score = result['score']
        print(f"  -> Matched: '{matched_name}' (Score: {score:.2f})")
        
        if matched_name == expected_name:
            print("  [PASS]")
        else:
            print(f"  [FAIL] Expected '{expected_name}', got '{matched_name}'")
    else:
        print("  -> No match found")
        if expected_name is None:
            print("  [PASS]")
        else:
            print(f"  [FAIL] Expected '{expected_name}'")
    print("-" * 30)

if __name__ == "__main__":
    print("=== Verifying Ingredient Matcher ===\n")

    # 1. Exact Match
    test_match("Niacinamide", "Niacinamide", "Exact Match")

    # 2. Case Insensitivity
    test_match("niacinamide", "Niacinamide", "Case Insensitivity")

    # 3. Synonym Match
    test_match("Vitamin B3", "Niacinamide", "Synonym Match")

    # 4. Fuzzy Match (Typo)
    test_match("Niacinmide", "Niacinamide", "Typo Tolerance (Missing 'a')")
    
    # 5. Fuzzy Match (Variation)
    test_match("L-Ascorbic Acid", "Ascorbic Acid", "Variation Match")
    
    # 6. No Match
    test_match("RandomGibberish123", None, "No Match Expected")
    
    # 7. Partial Match
    test_match("Pure Vitamin C", "Ascorbic Acid", "Partial Synonym Match")
