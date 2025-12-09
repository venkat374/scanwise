import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def explain_ingredient_with_ai(ingredient_name: str, risk_context: str = None):
    if not GOOGLE_API_KEY:
        return {"error": "Google API Key not configured."}
    
    genai.configure(api_key=GOOGLE_API_KEY)

    model = genai.GenerativeModel('gemini-flash-latest')
    
    context_str = ""
    if risk_context:
        context_str = f'IMPORTANT: This ingredient was flagged as "{risk_context}" by our toxicity scanner. You MUST explain why it could be considered this risk level (e.g. specific allergens, concentration limits, or cumulative effects). Do not contradict this risk level unless it is factually impossible.'

    prompt = f"""
    Explain the skincare ingredient "{ingredient_name}" in simple terms for a consumer.
    {context_str}
    Return a single JSON object with these keys:
    {{
        "description": "A 1-2 sentence simple explanation of what it is and what it does.",
        "risk_level": "Low, Moderate, or High (based on general safety)",
        "common_uses": "What products is it usually found in?",
        "side_effects": "Potential side effects or warnings (if any)."
    }}
    Return ONLY the JSON.
    """
    
    try:
        response = model.generate_content(prompt)
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
        print(f"AI Explanation failed: {e}")
        with open("backend_error.log", "a") as f:
            f.write(f"AI Explanation failed: {e}\n")
        return {
            "description": "Could not fetch explanation.",
            "risk_level": "Unknown",
            "common_uses": "Unknown",
            "side_effects": "Unknown"
        }

def analyze_routine_with_ai(products: list):
    if not GOOGLE_API_KEY:
        return {"error": "Google API Key not configured."}

    genai.configure(api_key=GOOGLE_API_KEY)

    product_list_str = ""
    for p in products:
        product_list_str += f"- {p.get('name', 'Unknown')}: {', '.join(p.get('ingredients', []))}\n"

    model = genai.GenerativeModel('gemini-flash-latest')
    prompt = f"""
    Analyze this skincare routine for ingredient conflicts (e.g. Retinol + Vitamin C, AHAs + Retinol, etc.).
    
    Products:
    {product_list_str}

    Return a single JSON object with:
    {{
        "conflicts": [
            {{
                "product1": "Name of first product",
                "product2": "Name of second product",
                "reason": "Why they conflict (e.g. Both contain strong actives...)"
            }}
        ],
        "analysis": "A brief summary of the routine's safety and effectiveness. Write in plain text. DO NOT use markdown formatting like bold (**text**) or italics. Keep it concise and clear."
    }}
    If no conflicts, return empty list for "conflicts".
    Return ONLY the JSON.
    """
    
    try:
        response = model.generate_content(prompt)
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
        print(f"AI Routine Analysis failed: {e}")
        with open("backend_error.log", "a") as f:
            f.write(f"AI Routine Analysis failed: {e}\n")
        return {
            "conflicts": [],
            "analysis": "Could not analyze routine."
        }
def extract_barcode_with_ai(image_data):
    """
    Uses Gemini Vision to identify a barcode number from an image.
    Returns the digits as a string, or None if not found.
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_data
        }

        prompt = """
        Analyze this image and identify the barcode number (EAN-13, UPC, etc.).
        Return ONLY the digits of the barcode. 
        If there are multiple barcodes, return the most prominent one.
        If no barcode is clearly visible or legible, return exactly "NOT_FOUND".
        Do not include any other text, explanation, or markdown. Just the digits.
        """

        response = model.generate_content([prompt, image_part])
        text = response.text.strip()
        
        if "NOT_FOUND" in text or not text:
            return None
            
        # Clean up any non-digit characters just in case
        digits = "".join(filter(str.isdigit, text))
        return digits if digits else None

    except Exception as e:
        print(f"Error extracting barcode with AI: {e}")
        return None
