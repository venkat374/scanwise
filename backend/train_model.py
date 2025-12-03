# train_model.py
import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import classification_report, roc_auc_score
import joblib

os.makedirs("model", exist_ok=True)
DATA_PATH = "model/dataset.csv"
OUT_MODEL = "model/toxicity_model.pkl"
OUT_PIPE = "model/encoder.pkl"

df = pd.read_csv(DATA_PATH)

# Feature columns
text_col = "ingredient"
numeric_cols = ["cancer","allergy","immunotoxic","reprotoxic","restriction",
                "bad_oily","bad_dry","bad_sensitive","bad_combination"]

X_text = df[text_col].astype(str).values
X_nums = df[numeric_cols].values
y = df["toxicity_label"].values

# Train/test
X_train_text, X_test_text, X_train_nums, X_test_nums, y_train, y_test = train_test_split(
    X_text, X_nums, y, test_size=0.2, random_state=42, stratify=y
)

# Preprocessing: TF-IDF for ingredient name; scaler for numeric features
tfidf = TfidfVectorizer(ngram_range=(1,2), max_features=500)
scaler = StandardScaler()

X_train_text_tfidf = tfidf.fit_transform(X_train_text)
X_test_text_tfidf = tfidf.transform(X_test_text)

X_train_nums_scaled = scaler.fit_transform(X_train_nums)
X_test_nums_scaled = scaler.transform(X_test_nums)

# Merge features (sparse + dense -> convert sparse to array if small)
from scipy.sparse import hstack
X_train = hstack([X_train_text_tfidf, X_train_nums_scaled])
X_test = hstack([X_test_text_tfidf, X_test_nums_scaled])

# Define classifiers
svc = SVC(probability=True, random_state=42, kernel="rbf", C=1.0)
rf = RandomForestClassifier(n_estimators=200, random_state=42)
lgb = LGBMClassifier(n_estimators=200, random_state=42)

ensemble = VotingClassifier(
    estimators=[("svc", svc), ("rf", rf), ("lgb", lgb)],
    voting="soft",
    weights=[1,1,2]  # give lightgbm a bit more weight
)

print("Training ensemble...")
ensemble.fit(X_train, y_train)

# Eval
y_pred = ensemble.predict(X_test)
y_proba = ensemble.predict_proba(X_test)[:,1]

print(classification_report(y_test, y_pred))
try:
    print("ROC AUC:", roc_auc_score(y_test, y_proba))
except Exception:
    pass

# Save model and preprocessing objects
joblib.dump(ensemble, OUT_MODEL)
print(f"Saved ensemble model -> {OUT_MODEL}")

# Save preprocessor (tfidf + scaler) as a tuple pipeline
preproc = {"tfidf": tfidf, "scaler": scaler}
joblib.dump(preproc, OUT_PIPE)
print(f"Saved preprocessor pipeline -> {OUT_PIPE}")
