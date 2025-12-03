# toxicity_engine.py
import joblib
import numpy as np
from scipy.sparse import hstack
import os

MODEL_PATH = "model/toxicity_model.pkl"
ENCODER_PATH = "model/encoder.pkl"

if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
    raise FileNotFoundError("Model or encoder not found. Run train_model.py first.")

ensemble = joblib.load(MODEL_PATH)
preproc = joblib.load(ENCODER_PATH)
tfidf = preproc["tfidf"]
scaler = preproc["scaler"]

# The numeric features order must match the training script numeric_cols
numeric_cols = ["cancer","allergy","immunotoxic","reprotoxic","restriction",
                "bad_oily","bad_dry","bad_sensitive","bad_combination"]

def ingredient_features_from_name(name):
    """
    Best-effort: small heuristic to infer numeric features from ingredient name
    when only the name is available (useful for product ingredient lists).
    You should replace this with real features from your dataset where possible.
    """
    n = name.lower()
    cancer = 1 if any(x in n for x in ["hydroquinone","paraben","formaldehyde","benzene"]) else 0
    allergy = 1 if any(x in n for x in ["fragrance","parfum","benzyl","limonene","linalool"]) else 0
    immuno = 1 if "isocyanate" in n else 0
    reprotoxic = 1 if any(x in n for x in ["phthalate","paraben"]) else 0
    restriction = 1 if (cancer or allergy or reprotoxic) else 0
    bad_oily = 1 if any(x in n for x in ["paraffin","mineral oil","dimethicone"]) else 0
    bad_dry = 1 if any(x in n for x in ["alcohol","sulfate"]) else 0
    bad_sensitive = 1 if any(x in n for x in ["fragrance","alcohol"]) else 0
    bad_combination = 0
    return [cancer, allergy, immuno, reprotoxic, restriction, bad_oily, bad_dry, bad_sensitive, bad_combination]

def predict_toxicity(ingredients):
    """
    ingredients: list of ingredient strings
    returns list of dicts: {ingredient, score (0..1), label}
    """
    results = []
    names = [str(i) for i in ingredients]
    # build features
    text_features = tfidf.transform(names)
    numeric_features = np.array([ingredient_features_from_name(n) for n in names])
    numeric_scaled = scaler.transform(numeric_features)

    X = hstack([text_features, numeric_scaled])

    probs = ensemble.predict_proba(X)[:,1]  # probability of toxic class
    for name, p in zip(names, probs):
        score = float(p)
        if score >= 0.75:
            label = "HIGH RISK"
        elif score >= 0.50:
            label = "MODERATE RISK"
        elif score >= 0.25:
            label = "LOW RISK"
        else:
            label = "SAFE"

        results.append({
            "ingredient": name,
            "score": score,
            "label": label
        })

    return results
