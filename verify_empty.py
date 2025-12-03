import requests

BASE_URL = "http://localhost:8001"

def test_empty_search():
    print("Testing Empty Search...")
    try:
        # Test empty query
        response = requests.get(f"{BASE_URL}/search-products", params={"q": ""})
        response.raise_for_status()
        results = response.json()
        
        if len(results) == 0:
            print("PASS: Empty search returned no results.")
        else:
            print(f"FAIL: Empty search returned {len(results)} results.")
            
    except Exception as e:
        print(f"FAIL: Search endpoint failed. Error: {e}")

def test_empty_scan():
    print("\nTesting Empty Scan...")
    payload = {
        "product_name": "",
        "skin_type": "Normal",
        "skin_tone": "Medium",
        "usage_frequency": "daily",
        "amount_applied": "normal",
        "ingredients_list": None
    }
    
    try:
        response = requests.post(f"{BASE_URL}/scan-product", json=payload)
        data = response.json()
        
        if "error" in data:
            print(f"PASS: Empty scan returned error: {data['error']}")
        else:
            print("FAIL: Empty scan did NOT return error.")
            print(data)
            
    except Exception as e:
        print(f"FAIL: Scan endpoint failed. Error: {e}")

if __name__ == "__main__":
    test_empty_search()
    test_empty_scan()
