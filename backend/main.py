from fastapi import FastAPI
import os
from pydantic import BaseModel
from fetch_ingredients import get_ingredients_from_product
from toxicity_engine import predict_toxicity
from ingredient_cleaner import clean_ingredient_list
from skin_engine import check_skin_type_suitability, check_skin_tone_suitability
from product_scoring import calculate_product_toxicity
from wellness_engine import calculate_wellness_match

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS FIX
# CORS FIX
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"Global Exception: {exc}\n{traceback.format_exc()}"
    print(error_msg)
    with open("backend_error.log", "a") as f:
        f.write(error_msg + "\n" + "-"*20 + "\n")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "details": str(exc)},
    )


from typing import Optional, List
from fastapi import Depends, HTTPException
from firebase_admin import firestore
from fetch_ingredients import get_ingredients_from_product, search_products
from incidecoder_client import IncidecoderClient

def analyze_ingredients_with_graph(ingredients, category="general"):
    """
    Helper to analyze a list of ingredients and return full toxicity report.
    """
    # 1. Component Analysis
    toxicity_report = predict_toxicity(ingredients)
    
    # 2. Product Scoring
    final_score, status, detailed_scores = calculate_product_toxicity(
        toxicity_report, 
        product_category=category
    )
    
    return {
        "toxicity_score": final_score,
        "product_status": status,
        "detailed_score_breakdown": detailed_scores,
        "toxicity_report": toxicity_report
    }

# ... imports ...

class ProductRequest(BaseModel):
    product_name: str = ""
    skin_type: str = "Normal"
    skin_tone: str = "Medium"
    usage_frequency: str = "Daily"
    amount_applied: str = "Normal"
    ingredients_list: Optional[str] = None # For manual entry
    barcode: Optional[str] = None # For direct lookup
    category: Optional[str] = None # Product category (e.g. Moisturizer)
    age_group: Optional[str] = None
    skin_concerns: Optional[List[str]] = []
    allergies: Optional[List[str]] = []

@app.get("/search-products")
def search_products_endpoint(q: str):
    products = search_products(q)
    results = []
    for p in products:
        results.append({
            "product_name": p.get("product_name", "Unknown"),
            "brands": p.get("brands", "Unknown"),
            "image_url": p.get("image_small_url", ""),
            "id": p.get("_id", "")
        })
    return results

@app.get("/scan-barcode")
def scan_barcode_endpoint(barcode: str):
    from fetch_ingredients import get_product_by_barcode
    product = get_product_by_barcode(barcode)
    if not product:
        return {"error": "Product not found"}
    
    # If ingredients are found, we can return them directly or process them
    # For now, let's return the raw data so the frontend can populate the form
    return product

@app.post("/scan-product")
def scan_product(req: ProductRequest):
    ingredients = []
    
    if req.ingredients_list:
        # Manual Entry
        ingredients = [i.strip() for i in req.ingredients_list.split(",")]
    elif req.barcode:
        # Direct Lookup via Barcode/ID
        from fetch_ingredients import get_product_by_barcode
        product_data = get_product_by_barcode(req.barcode)
        if product_data and product_data.get("ingredients_text"):
             ingredients = [i.strip() for i in product_data["ingredients_text"].split(",")]
        else:
             # Fallback to name search if barcode lookup fails or has no ingredients
             ingredients = get_ingredients_from_product(req.product_name)
    else:
        # Auto Fetch by Name
        if not req.product_name or not req.product_name.strip():
             return {"error": "Please enter a product name or ingredients list."}
        ingredients = get_ingredients_from_product(req.product_name)

    if not ingredients:
        return {"error": "Ingredients not found. Please try entering them manually."}

    ingredients = clean_ingredient_list(ingredients)
    # ... rest of the logic ...
    # --- INGREDIENT MATCHING (DEEP TECH) ---
    # DISABLED: The matcher was incorrectly mapping ingredients (e.g., Retinyl Palmitate -> Retinol).
    # We want to show exactly what was scanned/fetched.
    """
    from ingredient_matcher import matcher
    
    canonical_ingredients = []
    # We keep a mapping to show the user what we found vs what they scanned if needed
    # For now, just replace with canonical names where possible
    
    for ing in ingredients:
        match_result = matcher.match(ing)
        if match_result:
            # Use the canonical name from our DB
            canonical_ingredients.append(match_result["match"]["name"])
        else:
            # Keep original if no match found
            canonical_ingredients.append(ing)
            
    # Use canonical list for analysis
    ingredients = canonical_ingredients
    """

    toxicity = predict_toxicity(ingredients)

    # Pass usage parameters AND category to the scoring engine
    product_score, product_status, detailed_score = calculate_product_toxicity(
        toxicity, 
        req.usage_frequency, 
        req.amount_applied,
        req.category or "general" # Default to general if None
    )

    bad_skin_type = check_skin_type_suitability(ingredients, req.skin_type)
    bad_skin_tone = check_skin_tone_suitability(ingredients, req.skin_tone)

    # --- WELLNESS MATCH ENGINE ---
    user_profile_data = {
        "skin_type": req.skin_type,
        "skin_concerns": req.skin_concerns,
        "age_group": req.age_group,
        "allergies": req.allergies
    }
    wellness_report = calculate_wellness_match(ingredients, user_profile_data)

    # --- EFFICACY ENGINE (PHASE 3) ---
    from efficacy_engine import calculate_efficacy
    
    efficacy_report = calculate_efficacy(ingredients, req.category or "general")

    try:
        db = get_db()
        if db:
            # --- SUSPICIOUS PRODUCT DETECTION ---
            from suspicious_detection import detect_suspicious_product
            
            is_suspicious = detect_suspicious_product(req.product_name, req.category)
            db_status = "flagged" if is_suspicious else "active"

            product_data = {
                "product_name": req.product_name,
                "ingredients": ingredients,
                "toxicity_score": product_score,
                "efficacy_score": efficacy_report["efficacy_score"], # NEW
                "product_status": product_status,
                "category": req.category,
                "timestamp": datetime.now(),
                "source": "user_scan",
                "db_status": db_status
            }
            
            # If we have a barcode, use it as the document ID for easy lookup
            if req.barcode:
                product_data["barcode"] = req.barcode
                db.collection("products").document(req.barcode).set(product_data, merge=True)
            else:
                # If no barcode, we can try to query by name to see if it exists, or just add it
                # For now, let's just add it to allow name-based search later
                # Use a composite key or just add? Let's use name as ID if unique enough, or just add.
                # To avoid duplicates, check if exists by name
                existing = db.collection("products").where("product_name", "==", req.product_name).limit(1).get()
                if not existing:
                     db.collection("products").add(product_data)
                else:
                     # Update existing? Maybe not if we don't trust user input 100%. 
                     # But for now, let's assume we want to update/crowdsource.
                     existing[0].reference.update(product_data)
            
            print(f"Saved product '{req.product_name}' to global DB.")
    except Exception as e:
        print(f"Failed to save to global DB: {e}")
        # Don't fail the request just because saving failed

    return {
        "product_name": req.product_name,
        "ingredients": ingredients,
        "toxicity_report": toxicity,
        "product_toxicity_score": product_score,
        "product_status": product_status,
        "detailed_score_breakdown": detailed_score,
        "not_suitable_for_skin_type": bad_skin_type,
        "not_suitable_for_skin_tone": bad_skin_tone,
        "category": req.category,
        "wellness_match": wellness_report,
        "efficacy_report": efficacy_report # NEW
    }

@app.get("/test-db")
def test_db():
    with open("debug.log", "a") as f:
        f.write("Entering /test-db\n")
    try:
        from firebase_config import get_db
        db = get_db()
        if db:
            with open("debug.log", "a") as f:
                f.write("DB initialized successfully\n")
            return {"status": "ok", "message": "DB connected"}
        else:
            with open("debug.log", "a") as f:
                f.write("DB failed to initialize\n")
            return {"status": "error", "message": "DB failed"}
    except Exception as e:
        with open("debug.log", "a") as f:
            f.write(f"DB Exception: {e}\n")
        return {"status": "error", "message": str(e)}


# --- NEW ENDPOINTS FOR USER ACCOUNTS ---
from auth import get_current_user_uid
from firebase_config import get_db
from models import UserProfile, ScanHistoryItem, FavoriteItem, IngredientRequest
from ai_explainer import explain_ingredient_with_ai, analyze_routine_with_ai
from datetime import datetime

@app.post("/users/profile")
def update_user_profile(profile: UserProfile, uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Ensure the uid matches the token
    if profile.uid != uid:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    doc_ref = db.collection("users").document(uid)
    doc_ref.set(profile.dict(), merge=True)
    return {"status": "success", "message": "Profile updated"}

@app.get("/users/profile")
def get_user_profile(uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    else:
        return {"uid": uid, "skin_type": None, "skin_tone": None}

@app.post("/history")
def add_history(item: ScanHistoryItem, uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    item.user_id = uid
    item.timestamp = datetime.now()
    
    # Add to 'history' subcollection of the user or root collection?
    # Root collection with user_id index is often better for querying across users if needed,
    # but subcollection is cleaner for privacy rules. Let's use root 'scan_history'.
    db.collection("scan_history").add(item.dict())
    return {"status": "success"}

@app.get("/history")
def get_history(uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        docs = db.collection("scan_history").where("user_id", "==", uid).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(50).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"Error fetching history: {e}")
        # If it's an index error, it will be printed to the console
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/history")
def clear_history(uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        # Batch delete
        batch = db.batch()
        docs = db.collection("scan_history").where("user_id", "==", uid).stream()
        count = 0
        for doc in docs:
            batch.delete(doc.reference)
            count += 1
            # Commit every 400 items (limit is 500)
            if count >= 400:
                batch.commit()
                batch = db.batch()
                count = 0
        
        if count > 0:
            batch.commit()
            
        return {"status": "success", "message": "History cleared"}
    except Exception as e:
        print(f"Error clearing history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/favorites")
def add_favorite(item: FavoriteItem, uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    item.user_id = uid
    # Check if already exists
    existing = db.collection("favorites").where("user_id", "==", uid).where("product_name", "==", item.product_name).get()
    if existing:
        return {"status": "exists", "message": "Already in favorites"}
    
    db.collection("favorites").add(item.dict())
    return {"status": "success"}

@app.get("/favorites")
def get_favorites(uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    docs = db.collection("favorites").where("user_id", "==", uid).stream()
    return [doc.to_dict() for doc in docs]

@app.delete("/favorites/{product_name}")
def remove_favorite(product_name: str, uid: str = Depends(get_current_user_uid)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    docs = db.collection("favorites").where("user_id", "==", uid).where("product_name", "==", product_name).stream()
    for doc in docs:
        doc.reference.delete()
    return {"status": "success"}

@app.post("/explain-ingredient")
def explain_ingredient_endpoint(req: IngredientRequest):
    explanation = explain_ingredient_with_ai(req.ingredient_name, req.risk_context)
    return explanation

class RecommendationRequest(BaseModel):
    category: str
    current_score: float

@app.post("/recommend-alternatives")
def recommend_alternatives(req: RecommendationRequest):
    db = get_db()
    if not db:
        return []
    
    try:
        # Query for products in same category with lower toxicity score (safer)
        # Limit to 5 results
        docs = db.collection("products")\
            .where("category", "==", req.category)\
            .where("toxicity_score", "<", req.current_score)\
            .order_by("toxicity_score", direction=firestore.Query.ASCENDING)\
            .limit(5)\
            .stream()
            
        results = []
        for doc in docs:
            data = doc.to_dict()
            results.append({
                "product_name": data.get("product_name"),
                "brand": data.get("brand"),
                "toxicity_score": data.get("toxicity_score"),
                "image_url": data.get("image_url")
            })
        return results
    except Exception as e:
        print(f"Recommendation error: {e}")
        return []

class RoutineProduct(BaseModel):
    name: str
    ingredients: List[str]

class RoutineRequest(BaseModel):
    products: List[RoutineProduct]

@app.post("/analyze-routine")
def analyze_routine_endpoint(req: RoutineRequest):
    # 1. Run deterministic rule-based check
    from routine_engine import check_routine_compatibility
    
    products_data = [{"name": p.name, "ingredients": p.ingredients} for p in req.products]
    
    all_conflicts = []
    seen_pairs = set()
    
    for i, p1 in enumerate(products_data):
        # Check against all other products
        others = products_data[:i] + products_data[i+1:]
        
        # We can reuse the engine logic: treat p1 as "new product" and others as "current routine"
        report = check_routine_compatibility(p1['ingredients'], others)
        
        for conflict in report['conflicts']:
            # Avoid duplicates (A vs B and B vs A)
            p2_name = conflict['with_product']
            pair = tuple(sorted([p1['name'], p2_name]))
            if pair not in seen_pairs:
                seen_pairs.add(pair)
                all_conflicts.append(conflict)

    # 2. Pass known conflicts to AI for summary and explanation
    return analyze_routine_with_ai(products_data, rule_based_conflicts=all_conflicts)


# --- AI VISION ENDPOINT ---
import google.generativeai as genai
from fastapi import UploadFile, File
from PIL import Image
import io
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

@app.post("/analyze-image")
async def analyze_image(files: List[UploadFile] = File(...)):
    if not GOOGLE_API_KEY:
        return {"error": "Google API Key not configured on server."}
    
    try:
        image_parts = []
        for file in files:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
            image_parts.append(image)
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = """
        Analyze these product images (Front and/or Back).
        1. Identify the Product Name and Brand from the Front image (usually the one with the logo).
        2. Extract the Ingredient List from the Back image (or whichever image contains it).
        3. Return a single JSON object:
        {
            "product_name": "The full product name",
            "brand": "The brand name",
            "category": "Product Category (e.g. Moisturizer, Cleanser, Serum, Sunscreen)",
            "ingredients": ["Ingredient 1", "Ingredient 2", ...]
        }
        Return ONLY the JSON object. Do not include markdown formatting.
        """
        
        response = model.generate_content([prompt, *image_parts])
        text_response = response.text.strip()
        
        # Clean up markdown code blocks if present
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        import json
        try:
            data = json.loads(text_response.strip())
            return data
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {"ingredients": [text_response], "product_name": "", "brand": "", "category": "Unknown"}
    except Exception as e:
        print(f"AI Analysis failed: {e}")
        return {"error": f"Failed to analyze image: {str(e)}"}

@app.post("/scan-barcode-image")
async def scan_barcode_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # 1. Extract barcode using AI
        from ai_explainer import extract_barcode_with_ai
        barcode = extract_barcode_with_ai(contents)
        
        if not barcode:
            return JSONResponse(content={"error": "Could not detect a barcode in the image. Please try again or enter manually."}, status_code=400)
            
        # 2. Look up product by barcode (reuse existing logic)
        # First check local DB
        db = get_db()
        product_data = None
        
        if db:
            products_ref = db.collection("products")
            # Check for exact barcode match
            query = products_ref.where("barcode", "==", barcode).limit(1).stream()
            for doc in query:
                product_data = doc.to_dict()
                product_data['id'] = doc.id
                break
        
        # If not in local DB, try external API
        if not product_data:
            from fetch_ingredients import get_product_by_barcode
            product_data = get_product_by_barcode(barcode)
            
        if product_data:
            # Normalize data for frontend
            if "ingredients" in product_data and isinstance(product_data["ingredients"], list):
                product_data["ingredients_text"] = ", ".join(product_data["ingredients"])
            
            return {
                "barcode": barcode,
                "found": True,
                "product": product_data
            }
        else:
            return {
                "barcode": barcode,
                "found": False,
                "message": f"Product not found for barcode {barcode}"
            }

    except Exception as e:
        print(f"Error processing barcode image: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


# --- SKIN ANALYSIS V2 ENDPOINTS ---
from skin_engine import analyze_skin_with_ai, get_category_recommendations

@app.post("/analyze-face")
async def analyze_face_endpoint(file: UploadFile = File(...), uid: str = Depends(get_current_user_uid)):
    """
    Analyzes a face image and saves the report to the user's profile.
    """
    try:
        contents = await file.read()
        
        # Analyze with AI
        report = analyze_skin_with_ai(contents)
        
        if "error" in report:
             return JSONResponse(content={"error": report["error"]}, status_code=500)

        # Save to Firestore
        db = get_db()
        if db and uid:
             # Save to subcollection for history
             db.collection("users").document(uid).collection("skin_reports").add({
                 "timestamp": datetime.now(),
                 "report": report
             })
             # Update 'latest' for easy access
             # Inject timestamp into report for frontend
             report["timestamp"] = datetime.now().isoformat()
             
             db.collection("users").document(uid).set({
                 "latest_skin_report": report,
                 "last_skin_analysis": datetime.now()
             }, merge=True)
             
        return report
        
    except Exception as e:
        print(f"Face Analysis Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

class SkinReportRequest(BaseModel):
    skin_report: dict

@app.post("/recommend-categories")
def recommend_categories_endpoint(req: SkinReportRequest):
    return get_category_recommendations(req.skin_report)

class ProductSuggestionRequest(BaseModel):
    category: str
    skin_report: dict

@app.post("/suggest-products")
def suggest_products_endpoint(req: ProductSuggestionRequest):
    """
    Suggests SAFE products from the DB based on category and skin report.
    """
    db = get_db()
    if not db:
        return {"error": "Database unavailable"}
        
    try:
        # 1. Query products by category (filter toxicity in Python to avoid index requirement)
        # 1. Query products by category with Case Robustness and Score Relaxation
        candidates = []
        
        def fetch_candidates(category_name, max_score=100):
            # 1. Exact Category Match
            docs = db.collection("products")\
                .where("category", "==", category_name)\
                .limit(50)\
                .stream()
            
            candidates = []
            for doc in docs:
                p = doc.to_dict()
                if p.get("toxicity_score", 100) < max_score:
                    candidates.append(p)

            if candidates:
                return candidates

            # 2. Case-insensitive / Keyword Fallback
            # Map specific ingredients to their parent categories and keywords
            # Format: "SearchTerm": ("ParentCategory", "KeywordInName")
            FALLBACK_MAP = {
                "Retinol": ("Serum", "Retinol"),
                "Vitamin C": ("Serum", "Vitamin C"),
                "Niacinamide": ("Serum", "Niacinamide"),
                "Exfoliant": ("Toner", "Exfoliant"), # Or Cleanser, but Toner is common for BHA
                "Bha": ("Toner", "BHA"),
                "Salicylic Acid": ("Cleanser", "Salicylic")
            }
            
            mapping = FALLBACK_MAP.get(category_name) or FALLBACK_MAP.get(category_name.title()) 
            
            if mapping:
                parent_cat, keyword = mapping
                # Query parent category
                parent_docs = db.collection("products")\
                    .where("category", "==", parent_cat)\
                    .limit(50)\
                    .stream()
                    
                for doc in parent_docs:
                    p = doc.to_dict()
                    name = p.get("product_name", "").lower()
                    # Filter by toxicity AND keyword in name
                    if p.get("toxicity_score", 100) < max_score and keyword.lower() in name:
                        candidates.append(p)
                        
            return candidates

        # Attempt 1: Strict Score (<40), Exact Category
        candidates = fetch_candidates(req.category, 40)
        
        # Attempt 2: Strict Score (<40), Title Category
        if not candidates:
             candidates = fetch_candidates(req.category.title(), 40)
             
        # Attempt 3: Relaxed Score (<60), Exact Category (If curated products have moderate scores)
        if not candidates:
             candidates = fetch_candidates(req.category, 60)
             
        # Attempt 4: Relaxed Score (<60), Title Category
        if not candidates:
             candidates = fetch_candidates(req.category.title(), 60)
             
        # Attempt 5: Relaxed Score (<60), Capitalized Category
        if not candidates:
             candidates = fetch_candidates(req.category.capitalize(), 60)

        # Fallback: Live scraping is disabled per user request to ensure quality.
        # if len(candidates) < 3:
        #     # ... logic removed ...
            
        # 2. Filter by skin suitability (using existing logic + extra checks)
        suitable_products = []
        skin_type = req.skin_report.get("skin_type", "Normal")
        
        for p in candidates:
            # Check against skin type logic
            bad_for_skin = check_skin_type_suitability(p.get("ingredients", []), skin_type)
            
            # Use specific heuristics from the new V2 logic if needed
            # For now, just ensure 'bad_for_skin' is empty or manageable
            if not bad_for_skin:
                suitable_products.append({
                    "product_name": p.get("product_name"),
                    "brand": p.get("brand"),
                    "toxicity_score": p.get("toxicity_score"),
                    "image_url": p.get("image_url", ""),
                    "reason": "Safe and suitable for your skin type."
                })
                
        # Fallback: If strict skin check excludes everything, return top safe products with a disclaimer
        if not suitable_products and candidates:
             candidates.sort(key=lambda x: x.get("toxicity_score", 100))
             for p in candidates[:3]:
                 suitable_products.append({
                    "product_name": p.get("product_name"),
                    "brand": p.get("brand"),
                    "toxicity_score": p.get("toxicity_score"),
                    "image_url": p.get("image_url", ""),
                    "reason": "Top rated in this category."
                 })
        
        return suitable_products[:5]
        
    except Exception as e:
        print(f"Product Suggestion Error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

from incidecoder_client import IncidecoderClient

@app.get("/ingredient-details/{ingredient_name}")
async def get_ingredient_details(ingredient_name: str):
    """
    Fetches detailed ingredient information from Incidecoder.
    """
    # Check cache or DB first (future optimization)
    # For now, fetch directly
    details = IncidecoderClient.fetch_ingredient_details(ingredient_name)
    if not details:
        raise HTTPException(status_code=404, detail="Ingredient details not found")
    return details
