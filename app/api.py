from fastapi import FastAPI
import pandas as pd
import joblib
import numpy as np

app = FastAPI(title="ScanWise API")

# Load model + data
model = joblib.load("models/scanwise_model.pkl")
df = pd.read_csv("data/cosmetics.csv")

@app.get("/")
def home():
    return {"message": "Welcome to ScanWise API"}

@app.get("/predict/{product_name}")
def predict_toxicity(product_name: str):
    product = df[df['name'].str.contains(product_name, case=False, na=False)]
    if product.empty:
        return {"error": "Product not found"}
    
    ing_list = product.iloc[0]['ingredients'].lower().split(",")
    # build vector with your ingredient dictionary (simplify for MVP)
    toxic_flag = product.iloc[0]['toxic_flag']
    
    return {
        "product": product.iloc[0]['name'],
        "brand": product.iloc[0]['brand'],
        "price": product.iloc[0]['price'],
        "toxic_flag": int(toxic_flag)
    }
