import requests
import sys
import os
from datetime import datetime

# Mocking the admin addition by writing directly to Firestore (simulating what the app does)
# We need to use the firebase_admin setup from backend
sys.path.append(os.path.join(os.getcwd(), "backend"))

def test_admin_barcode_flow():
    print("Testing Admin Barcode Flow...")
    
    try:
        from firebase_config import get_db
        db = get_db()
        if not db:
            print("❌ DB Connection Failed")
            return
            
        # 1. Simulate Admin Adding a Product
        test_barcode = "TEST_BARCODE_999"
        test_product = {
            "product_name": "Admin Verified Test Shampoo",
            "brand": "TestBrand",
            "category": "Hair Care",
            "ingredients": ["Water", "Aloe Vera", "Mild Cleanser"],
            "toxicity_score": 1.5,
            "product_status": "analyzed",
            "db_status": "active",
            "source": "admin_manual",
            "timestamp": datetime.now()
        }
        
        print(f"Adding product {test_barcode} to DB...")
        db.collection("products").document(test_barcode).set(test_product)
        print("✅ Product added to DB.")
        
        # 2. Simulate User Scanning this Barcode
        # We'll call the `get_product_by_barcode` function directly to verify logic
        from fetch_ingredients import get_product_by_barcode
        
        print(f"Simulating scan for {test_barcode}...")
        result = get_product_by_barcode(test_barcode)
        
        if result and result.get("product_name") == "Admin Verified Test Shampoo":
            print("✅ Scan successful! Retrieved admin-added product.")
            print(f"   Name: {result['product_name']}")
            print(f"   Ingredients: {result['ingredients_text']}")
        else:
            print("❌ Scan failed. Could not retrieve product or got wrong data.")
            print(f"   Result: {result}")
            
        # Cleanup
        print("Cleaning up test data...")
        db.collection("products").document(test_barcode).delete()
        print("✅ Cleanup done.")
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")

if __name__ == "__main__":
    test_admin_barcode_flow()
