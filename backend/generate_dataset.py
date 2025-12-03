# generate_dataset.py
import csv
import random
import os

os.makedirs("model", exist_ok=True)
out = "model/dataset.csv"

ingredients_base = [
    "Aqua","Glycerin","Paraffinum Liquidum","Alcohol Denat","Fragrance",
    "Sodium Laureth Sulfate","Benzyl Alcohol","Phenoxyethanol","Paraben",
    "Hydroquinone","Kojic Acid","Retinol","Citric Acid","Salicylic Acid",
    "Cetearyl Alcohol","Propylene Glycol","Dimethicone","Titanium Dioxide",
    "Zinc Oxide","Niacinamide"
]

# health features: cancer, allergy, immunotoxic, reprotoxic, restriction (0/1)
# skin impact: columns indicating problematic for: oily,dry,sensitive,combination (0/1)
# toxicity_label: 1 = toxic, 0 = non-toxic (final ground truth)
rows = []
for i in range(1000):
    ing = random.choice(ingredients_base)
    # randomize features with some patterned biases
    cancer = 1 if ing.lower() in ("hydroquinone","paraben","alcohol denat") and random.random() < 0.7 else int(random.random() < 0.05)
    allergy = 1 if ing.lower() in ("fragrance","phenoxyethanol","benzyl alcohol") and random.random() < 0.6 else int(random.random() < 0.08)
    immuno = int(random.random() < 0.05)
    reprotoxic = 1 if ing.lower() in ("paraben","hydroquinone") and random.random() < 0.6 else int(random.random() < 0.03)
    restriction = 1 if (cancer or allergy or reprotoxic) else int(random.random() < 0.02)

    # skin impact heuristics
    bad_oily = 1 if ing.lower() in ("paraffinum liquidum","dimethicone") and random.random() < 0.6 else 0
    bad_dry = 1 if ing.lower() in ("alcohol denat","sodium laureth sulfate") and random.random() < 0.6 else 0
    bad_sensitive = 1 if ing.lower() in ("fragrance","benzyl alcohol","alcohol denat") and random.random() < 0.7 else 0
    bad_combination = int(random.random() < 0.05)

    # final toxicity label: simple rule-based combination for synthetic data
    tox_score = cancer*0.35 + allergy*0.25 + immuno*0.15 + reprotoxic*0.2 + restriction*0.05
    label = 1 if tox_score >= 0.25 else 0

    rows.append([
        ing, cancer, allergy, immuno, reprotoxic, restriction,
        bad_oily, bad_dry, bad_sensitive, bad_combination, label
    ])

with open(out, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "ingredient","cancer","allergy","immunotoxic","reprotoxic","restriction",
        "bad_oily","bad_dry","bad_sensitive","bad_combination","toxicity_label"
    ])
    writer.writerows(rows)

print(f"Generated synthetic dataset -> {out}")
