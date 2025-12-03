import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase (if not already)
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("Listing all products in 'products' collection:")
docs = db.collection("products").stream()
count = 0
for doc in docs:
    data = doc.to_dict()
    print(f"- ID: {doc.id}")
    print(f"  Name: {data.get('product_name')}")
    print(f"  Brand: {data.get('brand')}")
    print("-" * 20)
    count += 1

print(f"Total products found: {count}")
