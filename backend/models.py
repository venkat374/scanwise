from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserProfile(BaseModel):
    uid: str
    email: str
    skin_type: Optional[str] = None
    skin_tone: Optional[str] = None
    theme_preference: Optional[str] = "light"
    created_at: datetime = datetime.now()

class ScanHistoryItem(BaseModel):
    id: Optional[str] = None
    user_id: str
    product_name: str
    ingredients: List[str]
    toxicity_score: float
    timestamp: datetime = datetime.now()
    image_url: Optional[str] = None

class FavoriteItem(BaseModel):
    id: Optional[str] = None
    user_id: str
    product_name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: datetime = datetime.now()

class IngredientRequest(BaseModel):
    ingredient_name: str
    risk_context: Optional[str] = None
