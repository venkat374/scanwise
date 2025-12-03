import re

def clean_ingredient(ing):
    ing = ing.strip()

    # Remove URLs
    ing = re.sub(r"http\S+", "", ing)

    # Remove lot numbers / random codes
    ing = re.sub(r"\b\d+[A-Za-z]+\b", "", ing)

    # Remove temperature storage instructions
    ing = re.sub(r"Store.*?Aqua", "Aqua", ing, flags=re.IGNORECASE)

    # Remove manufacturer addresses
    if any(x in ing.lower() for x in ["hamburg", "uk ltd", "australia", "nsw"]):
        return ""

    # Remove unwanted long manufacturer text
    if len(ing.split()) >= 7:
        # If contains many non-chemical words, drop it
        if not any(x in ing.lower() for x in ["acid","alcohol","oil","extract","fragrance","parfum","glyc","propyl","coco","gum"]):
            return ""

    # Fix common OCR mistakes
    ing = ing.replace("ydroxide", "hydroxide")
    ing = ing.replace("Citroneld pha", "Citronellol")
    ing = ing.replace("Feel Oil", "Peel Oil")
    ing = ing.replace("Searate", "Stearate")

    return ing.strip()


def clean_ingredient_list(lst):
    cleaned = []

    for ing in lst:
        ing = clean_ingredient(ing)
        if ing and len(ing) > 2:
            cleaned.append(ing)

    return cleaned
