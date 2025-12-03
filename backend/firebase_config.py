import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Initialize Firebase Admin SDK
# Expects 'serviceAccountKey.json' in the same directory or environment variable
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized with serviceAccountKey.json")
elif os.environ.get("FIREBASE_CREDENTIALS"):
    # Parse JSON from environment variable
    import json
    cred_dict = json.loads(os.environ.get("FIREBASE_CREDENTIALS"))
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized with FIREBASE_CREDENTIALS env var")
else:
    # Fallback for when deployed or if using default google credentials
    # For now, we'll just print a warning if not found, but in production
    # you might want to rely on GOOGLE_APPLICATION_CREDENTIALS env var.
    try:
        firebase_admin.initialize_app()
        print("Firebase Admin SDK initialized with default credentials")
    except Exception as e:
        print(f"Warning: Firebase Admin SDK could not be initialized: {e}")

def get_db():
    try:
        return firestore.client()
    except Exception as e:
        print(f"Error getting Firestore client: {e}")
        return None
