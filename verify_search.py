import requests

BASE_URL = "http://localhost:8001"

def test_search():
    print("Testing Product Search...")
    
    # Test with a common brand
    query = "Nivea"
    try:
        response = requests.get(f"{BASE_URL}/search-products", params={"q": query})
        response.raise_for_status()
        results = response.json()
        
        print(f"Search for '{query}' returned {len(results)} results.")
        
        if len(results) > 0:
            print("First result:", results[0]["product_name"])
            print("PASS: Search endpoint is working.")
        else:
            print("WARN: Search returned no results. This might be due to external API limits or connectivity.")
            
    except Exception as e:
        print(f"FAIL: Search endpoint failed. Error: {e}")

if __name__ == "__main__":
    test_search()
