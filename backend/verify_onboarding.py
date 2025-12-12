import firebase_admin
from firebase_admin import firestore, auth
import os
import sys

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import from firebase_config which handles initialization
from firebase_config import get_db

# Create a dummy user or use an existing one for testing
try:
    user = auth.get_user_by_email("test_onboarding@example.com")
    uid = user.uid
    print(f"Found existing test user: {uid}")
except:
    try:
        user = auth.create_user(email="test_onboarding@example.com", password="password123")
        uid = user.uid
        print(f"Created new test user: {uid}")
    except Exception as e:
        print(f"Error creating user: {e}")
        # Try to proceed if user exists but get_user failed for some reason, or just fail
        uid = "test_uid_fallback"

from models import UserProfile

print("\n--- Testing Update Profile Logic ---")
profile_data = UserProfile(
    uid=uid,
    email="test_onboarding@example.com",
    skin_type="Oily",
    skin_tone="Medium",
    age_group="25-34",
    skin_concerns=["Acne", "Pores"],
    allergies=["Peanuts"]
)

# Manually save to DB to mimic the API
db = get_db()
if db:
    db.collection("users").document(uid).set(profile_data.dict(), merge=True)
    print("Saved profile to Firestore.")

    # Retrieve and Verify
    print("\n--- Verifying Data Persistence ---")
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        data = doc.to_dict()
        print("Retrieved Data:", data)
        
        try:
            assert data.get("age_group") == "25-34"
            assert "Acne" in data.get("skin_concerns", [])
            assert "Peanuts" in data.get("allergies", [])
            print("\nSUCCESS: New fields (age_group, skin_concerns, allergies) saved and retrieved correctly!")
        except AssertionError as e:
            print(f"\nFAILURE: Assertion failed. Data mismatch. {e}")
    else:
        print("FAILURE: Document not found.")
else:
    print("FAILURE: Could not get DB client.")
