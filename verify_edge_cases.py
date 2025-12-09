import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from suspicious_detection import detect_suspicious_product

def test_detection():
    print("Testing Suspicious Product Detection...")
    
    test_cases = [
        ("Gentle Face Cleanser", "Skincare", False),
        ("Ultra Shine Car Shampoo", "Automotive", True),
        ("Tire Shine", "Car Care", True),
        ("Kitchen Floor Cleaner", "Household", True),
        ("Organic Moisturizer", "Skincare", False),
        ("Engine Degreaser", "Automotive", True),
        ("Bleach", "Cleaning", True),
        ("Carrot Seed Oil", "Skincare", False), # Potential false positive check
    ]
    
    passed = 0
    for name, cat, expected in test_cases:
        result = detect_suspicious_product(name, cat)
        status = "PASS" if result == expected else "FAIL"
        if result == expected:
            passed += 1
        print(f"[{status}] Product: '{name}', Category: '{cat}' -> Detected: {result} (Expected: {expected})")
        
    print(f"\nPassed {passed}/{len(test_cases)} tests.")
    
    if passed == len(test_cases):
        print("✅ All detection tests passed.")
    else:
        print("❌ Some tests failed.")

if __name__ == "__main__":
    test_detection()
