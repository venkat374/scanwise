# skin_engine.py

def check_skin_type_suitability(ingredients, skin_type):
    bad_for_skin = []

    # Rules for oily skin
    oily_bad = ["paraffin", "mineral oil", "dimethicone", "coconut oil"]
    
    # Rules for dry skin
    dry_bad = ["alcohol", "sodium laureth sulfate", "benzyl alcohol"]

    # Rules for sensitive skin
    sensitive_bad = ["fragrance", "parfum", "linalool", "limonene", "phenoxyethanol"]

    # Rules for combination
    combination_bad = ["mineral oil", "dimethicone"]

    # Rules for normal skin
    normal_bad = []

    skin_type = skin_type.lower()

    for ing in ingredients:
        ing_l = ing.lower()

        if skin_type == "oily" and any(x in ing_l for x in oily_bad):
            bad_for_skin.append(ing)
        if skin_type == "dry" and any(x in ing_l for x in dry_bad):
            bad_for_skin.append(ing)
        if skin_type == "sensitive" and any(x in ing_l for x in sensitive_bad):
            bad_for_skin.append(ing)
        if skin_type == "combination" and any(x in ing_l for x in combination_bad):
            bad_for_skin.append(ing)
        if skin_type == "normal" and any(x in ing_l for x in normal_bad):
            bad_for_skin.append(ing)

    return list(set(bad_for_skin))


def check_skin_tone_suitability(ingredients, skin_tone):
    bad_for_tone = []

    # Darker skin tones react poorly to bleaching/lightening agents
    dark_tone_bad = ["kojic acid", "hydroquinone"]

    # Fair skin may react to high citrus concentrations
    light_tone_bad = ["lime oil", "lemon oil"]

    # Medium tone mostly neutral sensitivity
    medium_tone_bad = []

    skin_tone = skin_tone.lower()

    for ing in ingredients:
        ing_l = ing.lower()

        if skin_tone == "dark" and any(x in ing_l for x in dark_tone_bad):
            bad_for_tone.append(ing)

        if skin_tone == "light" and any(x in ing_l for x in light_tone_bad):
            bad_for_tone.append(ing)

        if skin_tone == "medium" and any(x in ing_l for x in medium_tone_bad):
            bad_for_tone.append(ing)

    return list(set(bad_for_tone))
