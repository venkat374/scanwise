import requests

def search_products(query):
    if not query or not query.strip():
        return []
    
    results = []
    
    # 1. Search Local DB
    try:
        from firebase_config import get_db
        db = get_db()
        if db:
            # Simple prefix search (case-sensitive unfortunately, but better than nothing)
            # We search for products starting with the query
            docs = db.collection("products").where("product_name", ">=", query).where("product_name", "<=", query + '\uf8ff').limit(5).stream()
            for doc in docs:
                data = doc.to_dict()
                results.append({
                    "product_name": data.get("product_name", "Unknown"),
                    "brands": data.get("brand", "Local"),
                    "image_small_url": "", # Placeholder
                    "_id": doc.id,
                    "id": doc.id
                })
    except Exception as e:
        print(f"Local search failed: {e}")

    # 2. Search External API
    url = "https://world.openbeautyfacts.org/cgi/search.pl"
    params = {
        "search_terms": query,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 10  # Limit results
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        external_products = data.get("products", [])
        results.extend(external_products)
    except Exception as e:
        print(f"Error fetching products: {e}")
        
    return results

def get_product_by_barcode(barcode):
    """
    Fetch product details from OpenBeautyFacts by barcode.
    Checks local Firestore DB first.
    """
    # 1. Check Local DB First
    try:
        from firebase_config import get_db
        db = get_db()
        if db:
            doc = db.collection("products").document(barcode).get()
            if doc.exists:
                data = doc.to_dict()
                print(f"Found product {barcode} in local DB")
                return {
                    "product_name": data.get("product_name"),
                    "ingredients_text": ", ".join(data.get("ingredients", [])) if isinstance(data.get("ingredients"), list) else data.get("ingredients", ""),
                    "image_url": data.get("image_url", ""),
                    "brands": data.get("brands", "")
                }
    except Exception as e:
        print(f"Local DB lookup failed: {e}")

    # 2. Fallback to External API
    url = f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == 1:
                product = data.get("product", {})
                return {
                    "product_name": product.get("product_name", "Unknown Product"),
                    "ingredients_text": product.get("ingredients_text", ""),
                    "image_url": product.get("image_url", ""),
                    "brands": product.get("brands", "")
                }
    except Exception as e:
        print(f"Error fetching barcode: {e}")
    return None

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
