import json
import os

def load_rules():
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_path, "data", "skin_rules.json")
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading skin rules: {e}")
        return {"skin_type_rules": {}, "skin_tone_rules": {}}

RULES = load_rules()

def check_skin_type_suitability(ingredients, skin_type):
    bad_for_skin = []
    skin_type = skin_type.lower()
    
    rules = RULES.get("skin_type_rules", {})
    bad_list = rules.get(skin_type, [])

    for ing in ingredients:
        ing_l = ing.lower()
        if any(x in ing_l for x in bad_list):
            bad_for_skin.append(ing)

    return list(set(bad_for_skin))


def check_skin_tone_suitability(ingredients, skin_tone):
    bad_for_tone = []
    skin_tone = skin_tone.lower()
    
    rules = RULES.get("skin_tone_rules", {})
    bad_list = rules.get(skin_tone, [])

    for ing in ingredients:
        ing_l = ing.lower()
        if any(x in ing_l for x in bad_list):
            bad_for_tone.append(ing)

    return list(set(bad_for_tone))

# --- NEW V2 FEATURES ---
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def analyze_skin_with_ai(image_data, extra_context=""):
    """
    Analyzes a face image using Gemini Vision to detect skin conditions.
    """
    if not GOOGLE_API_KEY:
        return {"error": "Google API Key not configured."}
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_data
        }

        prompt = f"""
        Analyze this face image for skin health and conditions. {extra_context}
        Assess the following ONLY based on visual evidence:
        1. Skin Type (Oily, Dry, Combination, Normal)
        2. Key Concerns (Acne, Redness, Wrinkles/Fine Lines, Pigmentation, Dehydration, Dullness)
        3. Severity estimates (0-100) for identified issues.
        
        Return a single JSON object:
        {{
            "skin_type": "Dry/Oily/etc",
            "skin_conditions": ["Condition1", "Condition2", ...],
            "severity_scores": {{
                "dryness": 0-100,
                "acne": 0-100,
                "wrinkles": 0-100,
                "redness": 0-100,
                "pigmentation": 0-100
            }},
            "summary": "A polite, constructive summary of the skin's condition, focusing on health and barrier support. Use beginner-friendly language."
        }}
        Return ONLY the JSON.
        """

        response = model.generate_content([prompt, image_part])
        text_response = response.text.strip()
        
        # Clean up markdown
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        return json.loads(text_response.strip())

    except Exception as e:
        print(f"Skin Analysis failed: {e}")
        return {
            "error": str(e),
            "skin_type": "Unknown",
            "skin_conditions": [],
            "severity_scores": {},
            "summary": "Could not analyze image."
        }

def get_category_recommendations(skin_report):
    """
    Maps skin conditions to product category recommendations based on heuristics.
    """
    recommendations = []
    
    # 1. Extract data
    conditions = [c.lower() for c in skin_report.get("skin_conditions", [])]
    scores = skin_report.get("severity_scores", {})
    skin_type = skin_report.get("skin_type", "Normal").lower()
    
    # 2. Logic Rules (Heuristic map)
    # 2. Logic Rules (Heuristic map)
    # Dryness
    if "dryness" in conditions or "dehydration" in conditions or scores.get("dryness", 0) > 40 or skin_type == "dry":
        recommendations.append({
            "category": "Moisturizer",
            "search_term": "Moisturizer",
            "reason": "Your skin shows signs of dryness. A good moisturizer with ceramides will help repair the barrier."
        })
        recommendations.append({
            "category": "Gentle Cleanser",
            "search_term": "Cleanser",
            "reason": "Avoid stripping natural oils. Use a non-foaming, gentle cleanser."
        })

    # Wrinkles / Anti-Aging
    if "wrinkles" in conditions or "fine lines" in conditions or scores.get("wrinkles", 0) > 40:
        recommendations.append({
            "category": "Retinol",
            "search_term": "Retinol", 
            "reason": "Detected fine lines. Retinol is the gold standard for long-term anti-aging, but start slowly."
        })
        recommendations.append({
            "category": "Sunscreen",
            "search_term": "Sunscreen",
            "reason": "UV damage is the #1 cause of aging. Daily SPF is non-negotiable."
        })

    # Acne
    if "acne" in conditions or scores.get("acne", 0) > 30:
        recommendations.append({
            "category": "Exfoliant (BHA)",
            "search_term": "Exfoliant",
            "reason": "Salicylic acid (BHA) helps unclog pores and reduce active breakouts."
        })
        recommendations.append({
            "category": "Niacinamide Serum",
            "search_term": "Niacinamide",
            "reason": "Helps control oil production and reduce redness from breakouts."
        })

    # Sensitivity / Redness
    if "redness" in conditions or "sensitivity" in conditions or scores.get("redness", 0) > 40 or scores.get("sensitivity", 0) > 40:
        recommendations.append({
            "category": "Barrier Repair",
            "search_term": "Moisturizer",
            "reason": "Your skin appears irritated. Look for soothing ingredients like Centella Asiatica or Panthenol."
        })
        recommendations.append({
            "category": "Fragrance-Free Moisturizer",
            "search_term": "Moisturizer",
            "reason": "Fragrance can trigger more irritation. Stick to simple, hypoallergenic formulas."
        })

    # Pigmentation
    if "pigmentation" in conditions or "uneven tone" in conditions or scores.get("pigmentation", 0) > 40:
        recommendations.append({
            "category": "Vitamin C Serum",
            "search_term": "Vitamin C",
            "reason": "Brightens uneven skin tone and protects against free radical damage."
        })
        recommendations.append({
            "category": "Sunscreen",
            "search_term": "Sunscreen",
            "reason": "Sun exposure darkens pigmentation. High protection SPF is essential."
        })
        
    # Baseline for everyone if list is empty
    if not recommendations:
        recommendations.append({
            "category": "Moisturizer",
            "search_term": "Moisturizer",
            "reason": "Every skin type needs hydration to stay healthy."
        })
        recommendations.append({
            "category": "Sunscreen",
            "search_term": "Sunscreen",
            "reason": "Daily protection is the best thing you can do for your skin."
        })

    # Deduplicate by category
    unique_recs = {}
    for rec in recommendations:
        if rec["category"] not in unique_recs:
            unique_recs[rec["category"]] = rec
            
    return list(unique_recs.values())

