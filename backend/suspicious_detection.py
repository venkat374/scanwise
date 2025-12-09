
import re

SUSPICIOUS_KEYWORDS = [
    "car", "cars", "automotive", "tire", "tires", "engine", "engines", "motor", "motors", 
    "fuel", "motor oil", "engine oil", "detergent", "detergents", "household", "cleaner", "cleaners", 
    "bleach", "disinfectant", "disinfectants", "toilet", "toilets", "kitchen", "floor", "floors", 
    "glass cleaner", "wax", "waxes", "polish", "polishes", "paint", "paints", "glue", "glues", 
    "adhesive", "adhesives", "insecticide", "insecticides", "pesticide", "pesticides"
]

def detect_suspicious_product(name: str, category: str = None) -> bool:
    """
    Detects if a product is likely non-cosmetic based on its name and category.
    Returns True if suspicious, False otherwise.
    """
    text = (name + " " + (category or "")).lower()
    for kw in SUSPICIOUS_KEYWORDS:
        # Use regex for whole word matching to avoid "Carrot" matching "car"
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, text):
            return True
    return False
