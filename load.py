import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.manifold import TSNE
import plotly.express as px
import joblib
from sklearn.metrics.pairwise import cosine_similarity


# Load dataset
df = pd.read_csv("data/cosmetics.csv")

# Inspect
print("Dataset shape:", df.shape)
print(df.head())

# Drop missing or 'No Info' in ingredients
df = df[df['ingredients'].notna()]
df = df[df['ingredients'] != "No Info"]

# Normalize and split ingredients
def clean_ingredients(ing_str):
    return [i.strip().lower() for i in ing_str.split(",")]

df['ingredient_list'] = df['ingredients'].apply(clean_ingredients)
print(df[['name', 'ingredient_list']].head())

# Build ingredient dictionary
ingredient_idx = {}
idx = 0
for ing_list in df['ingredient_list']:
    for ing in ing_list:
        if ing not in ingredient_idx:
            ingredient_idx[ing] = idx
            idx += 1

print("Unique ingredients:", len(ingredient_idx))

# Build binary matrix
M, N = len(df), len(ingredient_idx)
A = np.zeros((M, N))
for i, ing_list in enumerate(df['ingredient_list']):
    for ing in ing_list:
        j = ingredient_idx[ing]
        A[i, j] = 1

print("Matrix shape:", A.shape)

# Define toxic ingredient list
print("Matrix shape:", A.shape)

# Compute similarity matrix
similarities = cosine_similarity(A)
    "parabens", "sodium lauryl sulfate", "phthalates",
    "formaldehyde", "oxybenzone", "triclosan", "toluene",
    "petrolatum", "coal tar", "fragrance", "linalool", "limonene", "citral"
]

def check_toxic(ing_list):
    for ing in ing_list:
        for tox in toxic_ingredients:
            if tox in ing:  # substring match
                return 1
    return 0

df['toxic_flag'] = df['ingredient_list'].apply(check_toxic)
print(df[['name', 'brand', 'toxic_flag']].head())

# Prepare data for model
X = A
y = df['toxic_flag']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train classifier
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred))

# t-SNE visualization
tsne = TSNE(n_components=2, random_state=42, perplexity=30)
tsne_results = tsne.fit_transform(A)
df['X'] = tsne_results[:, 0]
df['Y'] = tsne_results[:, 1]

fig = px.scatter(
    df, x="X", y="Y",
    color=df['toxic_flag'].map({0: "Safe", 1: "Toxic"}),
    hover_data=["name", "brand", "price", "rank"]
)
fig.show()

# Save model
joblib.dump(clf, "models/scanwise_model.pkl")
print("✅ Model saved to models/scanwise_model.pkl")

def recommend_safe_alternatives(product_name, top_n=3):
    # Find product index
    product = df[df['name'].str.contains(product_name, case=False, na=False)]
    if product.empty:
        return []
    
    idx = product.index[0]
    
    # Compute similarity scores
    sim_scores = similarities[idx]
    
    # Rank safe products by similarity
    safe_products = df[df['toxic_flag'] == 0].copy()
    safe_products['similarity'] = [sim_scores[i] for i in safe_products.index]
    
    safe_products = safe_products.sort_values(by="similarity", ascending=False)
    
    return safe_products.head(top_n)[['name', 'brand', 'price', 'similarity']]
