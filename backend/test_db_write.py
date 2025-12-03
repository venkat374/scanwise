import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("Attempting to write to 'test_collection'...")
try:
    db.collection("test_collection").add({"test": "data"})
    print("Write successful!")
except Exception as e:
    print(f"Write failed: {e}")
