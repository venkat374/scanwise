from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from firebase_config import get_db

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the Firebase ID token and returns the decoded token (user info).
    """
    token = credentials.credentials
    try:
        with open("debug.log", "a") as f:
            f.write(f"Verifying token: {token[:10]}...\n")
        decoded_token = auth.verify_id_token(token)
        with open("debug.log", "a") as f:
            f.write("Token verified\n")
        return decoded_token
    except Exception as e:
        with open("debug.log", "a") as f:
            f.write(f"Token verification failed: {e}\n")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {e}"
        )

def get_current_user_uid(user = Depends(get_current_user)):
    return user['uid']
