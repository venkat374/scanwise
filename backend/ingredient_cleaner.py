import re

def clean_ingredient(ing):
    ing = ing.strip()

    # Truncate at common non-ingredient keywords
    for keyword in ["DIRECTIONS", "USAGE", "CAUTION", "WARNING", "HOW TO USE", "INGREDIENTS:"]:
        if keyword in ing.upper():
            ing = ing.split(keyword, 1)[0] # Keep everything before the keyword
            ing = ing.split(keyword.title(), 1)[0] # Try title case too just in case

    # Remove sentences with instruction verbs
    instruction_verbs = ["apply", "rinse", "massage", "avoid", "contact", "use", "store", "keep", "consult", "patch test"]
    if any(verb in ing.lower() for verb in instruction_verbs):
        # If it's a long sentence with these verbs, it's likely an instruction
        if len(ing.split()) > 3: 
            return ""

    # Remove URLs
    ing = re.sub(r"http\S+", "", ing)

    # Remove lot numbers / random codes
    ing = re.sub(r"\b\d+[A-Za-z]+\b", "", ing)

    # Remove temperature storage instructions
    ing = re.sub(r"Store.*?Aqua", "Aqua", ing, flags=re.IGNORECASE)

    # Remove manufacturer addresses
    if any(x in ing.lower() for x in ["hamburg", "uk ltd", "australia", "nsw", "made in", "dist."]):
        return ""

    # Remove unwanted long manufacturer text
    if len(ing.split()) >= 7:
        # If contains many non-chemical words, drop it
        if not any(x in ing.lower() for x in ["acid","alcohol","oil","extract","fragrance","parfum","glyc","propyl","coco","gum", "water", "aqua"]):
            return ""

    # Fix common OCR mistakes
    ing = ing.replace("ydroxide", "hydroxide")
    ing = ing.replace("Citroneld pha", "Citronellol")
    ing = ing.replace("Feel Oil", "Peel Oil")
    ing = ing.replace("Searate", "Stearate")
    
    # Normalize bilingual names (e.g., "Water/Eau" -> "Water")
    # But be careful not to break chemical names with slashes (though rare in basic lists)
    # Usually "Name/Name" with spaces or CamelCase is bilingual.
    if "/" in ing:
        parts = ing.split("/")
        # If the first part looks like a valid name, take it.
        # Simple heuristic: take the first part if it's longer than 2 chars
        if len(parts[0].strip()) > 2:
            ing = parts[0].strip()

    return ing.strip()


def clean_ingredient_list(lst):
    cleaned = []

    for ing in lst:
        ing = clean_ingredient(ing)
        if ing and len(ing) > 2:
            cleaned.append(ing)

    return cleaned
