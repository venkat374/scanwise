import requests

from incidecoder_client import IncidecoderClient

from firebase_admin import firestore
from firebase_config import get_db

def save_to_firestore(product):
    """
    Saves a product found from Incidecoder to Firestore.
    """
    try:
        db = get_db()
        if not db: return
        
        # Check if exists by product name + brand or incidecoder link
        # Use link as unique ID reference if possible
        products_ref = db.collection("products")
        
        # Try to match by incidecoder URL first
        existing = []
        if product.get("link"):
            existing = products_ref.where("incidecoder_url", "==", product["link"]).limit(1).get()
        
        # If not found by link, try name
        if not existing:
             existing = products_ref.where("product_name", "==", product["name"]).limit(1).get()

        data = {
            "product_name": product["name"],
            "brand": product["brand"],
            "incidecoder_url": product.get("link", ""),
            "image_url": product.get("image", ""),
            "ingredients": product["ingredients"],
            "ingredients_text": ", ".join(product["ingredients"]),
            "source": "incidecoder",
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        
        if existing:
            print(f"DEBUG: Updating Firestore for {product['name']}")
            existing[0].reference.set(data, merge=True)
        else:
            print(f"DEBUG: Adding to Firestore: {product['name']}")
            products_ref.add(data)
            
    except Exception as e:
        print(f"Error saving to Firestore: {e}")

def search_products(query):
    if not query or not query.strip():
        return []
    
    results = []
    seen_urls = set() # To avoid duplicates across sources
    
    # 1. Search Firestore (Shared DB - High Priority)
    print(f"DEBUG: Searching Firestore for '{query}'...")
    try:
        db = get_db()
        if db:
            # Simple prefix search for name
            # Note: Firestore doesn't support full-text search natively without extensions (like Algolia/Typesense)
            # We use >= query and <= query + \uf8ff logic for prefix matching
            # Capitalize first letter to match common capitalization
            query_cap = query.capitalize()
            
            # Search by prefix (case sensitive usually, but manageable)
            docs = db.collection("products")\
                .where("product_name", ">=", query_cap)\
                .where("product_name", "<=", query_cap + '\uf8ff')\
                .limit(5)\
                .stream()
            
            for doc in docs:
                data = doc.to_dict()
                product_url = data.get("incidecoder_url", data.get("id", ""))
                
                results.append({
                    "product_name": data.get("product_name", "Unknown"),
                    "brands": data.get("brand", "Unknown"),
                    "image_small_url": data.get("image_url", ""), 
                    "ingredients_text": ", ".join(data.get("ingredients", [])) if isinstance(data.get("ingredients"), list) else data.get("ingredients", ""),
                    "ingredients": data.get("ingredients", []),
                    "id": product_url,
                    "source": "firestore"
                })
                seen_urls.add(product_url)
                
            print(f"DEBUG: Found {len(results)} Firestore results.")
    except Exception as e:
        print(f"Firestore search failed: {e}")

    # 2. Search Local Incidecoder DB (Local JSON - Medium Priority/Fallback)
    if not results:
        print(f"DEBUG: Searching local JSON for '{query}'...")
        local_products = IncidecoderClient.search_local_products(query)
        print(f"DEBUG: Found {len(local_products)} local JSON results.")
        
        for p in local_products:
            if p.get("link") in seen_urls: continue
            
            results.append({
                "product_name": p.get("name"),
                "brands": p.get("brand"),
                "image_small_url": p.get("image"),
                "ingredients_text": ", ".join(p.get("ingredients", [])),
                "ingredients": p.get("ingredients", []),
                "id": p.get("link"),
                "source": "incidecoder_local"
            })
            seen_urls.add(p.get("link"))

    # 3. Live Search & Cache (Fallback)
    if not results:
        print(f"DEBUG: Miss for '{query}'. Searching online...")
        online_products = IncidecoderClient.search_online(query)
        for p in online_products:
            if p.get("link") in seen_urls: continue
            
            # Cache immediately
            # We ONLY cache to local JSON for speed/fallback.
            # We DO NOT save to Firestore here to avoid polluting the global DB with unselected products.
            IncidecoderClient.cache_product(p) # Local JSON
            # save_to_firestore(p) # DISABLED per user request
            
            print(f"DEBUG: Live Result: {p.get('name')}")
            results.append({
                "product_name": p.get("name"),
                "brands": p.get("brand"),
                "image_small_url": p.get("image"),
                "ingredients_text": ", ".join(p.get("ingredients", [])),
                "ingredients": p.get("ingredients", []),
                "id": p.get("link"),
                "source": "incidecoder_live"
            })
            seen_urls.add(p.get("link"))

    return results

def get_product_by_barcode(barcode):
    """
    Fetch product details from OpenBeautyFacts by barcode.
    Checks local Firestore DB first.
    """
    product_data = None

    # 1. Check Local DB First
    try:
        from firebase_config import get_db
        db = get_db()
        if db:
            doc = db.collection("products").document(barcode).get()
            if doc.exists:
                data = doc.to_dict()
                print(f"Found product {barcode} in local DB")
                product_data = {
                    "product_name": data.get("product_name"),
                    "ingredients_text": ", ".join(data.get("ingredients", [])) if isinstance(data.get("ingredients"), list) else data.get("ingredients", ""),
                    "image_url": data.get("image_url", ""),
                    "brands": data.get("brands", "")
                }
    except Exception as e:
        print(f"Local DB lookup failed: {e}")

    # 2. Fallback to External API
    if not product_data:
        url = f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1:
                    product = data.get("product", {})
                    product_data = {
                        "product_name": product.get("product_name", "Unknown Product"),
                        "ingredients_text": product.get("ingredients_text", ""),
                        "image_url": product.get("image_url", ""),
                        "brands": product.get("brands", "")
                    }
        except Exception as e:
            print(f"Error fetching barcode: {e}")

    # 3. Enrich with Incidecoder Data (CRITICAL STEP)
    if product_data and product_data.get("product_name"):
        print(f"Enriching '{product_data['product_name']}' with Incidecoder data...")
        incidecoder_results = search_products(product_data["product_name"])
        if incidecoder_results:
            # Use the best match from Incidecoder
            best_match = incidecoder_results[0]
            print(f"Found Incidecoder match: {best_match.get('product_name')}")
            product_data["ingredients_text"] = best_match.get("ingredients_text")
            product_data["ingredients"] = best_match.get("ingredients") # Explicit list
            product_data["incidecoder_url"] = best_match.get("id")
        else:
            print("No Incidecoder match found. Using original data.")

    return product_data

def get_ingredients_from_product(product_name):
    products = search_products(product_name)

    if not products:
        return None

    # Try to find the first product with ingredients
    for product in products:
        ingredients_text = product.get("ingredients_text")
        if ingredients_text:
             return [i.strip() for i in ingredients_text.split(",")]
    
    return None
