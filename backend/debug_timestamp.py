import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

# Initialize Firebase
if not firebase_admin._apps:
    try:
        cred_path = "serviceAccountKey.json"
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            print("No serviceAccountKey.json found")
            exit(1)
    except Exception as e:
        print(f"Failed to init firebase: {e}")
        exit(1)

db = firestore.client()

print("Checking users...")
users = db.collection("users").stream()
found = False

for user in users:
    data = user.to_dict()
    print(f"User: {user.id}")
    if "latest_skin_report" in data:
        report = data["latest_skin_report"]
        print("  Found latest_skin_report")
        if "timestamp" in report:
            ts = report["timestamp"]
            print(f"  timestamp value: {ts!r} (Type: {type(ts)})")
        else:
            print("  NO timestamp in latest_skin_report!")
            print("  Keys:", list(report.keys()))
        found = True
    else:
        print("  No latest_skin_report")

if not found:
    print("No users with skin reports found.")
