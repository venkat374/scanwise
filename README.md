# ScanWise - Advanced Toxicity & Suitability Analyzer

ScanWise is a full-stack web application designed to help users analyze cosmetic and skincare products for toxicity and suitability based on their specific skin type and tone. It leverages AI (Google Gemini) for image analysis and a crowdsourced database for product lookups.

## 🚀 Key Features

### 1. Multi-Modal Product Scanning
*   **Barcode Scanning**: Instantly look up products by scanning their barcode using the device camera.
*   **AI-Powered Image Analysis (OCR)**:
    *   **Dual-Scan Mode**: Upload "Front" (Product Name) and "Back" (Ingredients) photos.
    *   **Gemini AI Integration**: Uses Google's Gemini 1.5 Flash model to extract and synthesize Product Name, Brand, and Ingredient List from images with high accuracy.
*   **Manual Entry**: Fallback option to manually type or paste ingredient lists.

### 2. Advanced Analysis Engine
*   **Toxicity Scoring**: Calculates a weighted toxicity score (0-100) based on ingredient safety profiles.
*   **Suitability Checks**:
    *   **Skin Type Analysis**: Warns if ingredients are unsuitable for the user's skin type (e.g., comedogenic ingredients for Oily skin).
    *   **Skin Tone Analysis**: Checks for ingredients that might cause issues for specific skin tones.
*   **Detailed Breakdown**: Provides a granular report of "Safe", "Moderate", and "High Risk" ingredients.

### 3. Crowdsourcing & Persistence
*   **Global Product Database**: Every successful scan is saved to a shared Firestore database.
*   **Smart Search**:
    *   **Local First**: Search queries first check the internal crowdsourced database for instant results.
    *   **External Fallback**: If not found locally, it queries the OpenBeautyFacts API.
*   **Data Enrichment**: AI automatically extracts and saves metadata (Name, Brand) to improve the quality of the crowdsourced data.

### 4. User Personalization
*   **User Profiles**: Stores user skin type (Oily, Dry, Normal, etc.) and skin tone preferences.
*   **Scan History**: Automatically saves a history of all analyzed products for easy retrieval.
*   **Favorites**: Allows users to bookmark products for quick access.
*   **Authentication**: Secure Email/Password login and signup via Firebase Auth.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS (Dark Mode UI)
*   **State Management**: React Context API (Auth)
*   **Icons**: Lucide React
*   **HTTP Client**: Axios
*   **Barcode Library**: `react-zxing`

### Backend
*   **Framework**: FastAPI (Python)
*   **AI Model**: Google Gemini 1.5 Flash (`google-generativeai`)
*   **Database**: Google Cloud Firestore (via `firebase-admin`)
*   **Authentication**: Firebase Admin SDK (Token Verification)
*   **Image Processing**: Pillow (PIL)

---

## 🔌 API Endpoints

### Product & Analysis
*   `POST /analyze-image`: Accepts Front/Back images, returns JSON `{product_name, brand, ingredients}`.
*   `POST /scan-product`: Analyzes a product (by name, barcode, or raw ingredients) and saves it to the DB.
*   `GET /scan-barcode`: Looks up product details by barcode.
*   `GET /search-products`: Searches for products by name (Local DB + External API).

### User Data
*   `GET /history`: Retrieves user's scan history.
*   `POST /history`: Adds an item to history.
*   `GET /favorites`: Retrieves user's favorite products.
*   `POST /favorites`: Adds a product to favorites.
*   `DELETE /favorites/{product_name}`: Removes a favorite.
*   `GET/POST /users/profile`: Manages user skin profile settings.

---

## ⚙️ Setup & Configuration

### Prerequisites
*   Node.js & npm
*   Python 3.10+
*   Firebase Project (Firestore & Auth enabled)
*   Google Cloud Project (Firestore API enabled)
*   Google AI Studio API Key (Gemini)

### Environment Variables

**Backend ([backend/.env](file:///c:/Users/venkt/Documents/projects/scanwise/ScanWise_Toxicity_analyzer/backend/.env))**
```env
GOOGLE_API_KEY=your_gemini_api_key
```
*Note: `serviceAccountKey.json` is also required in the backend directory for Firebase Admin.*

**Frontend ([frontend/.env](file:///c:/Users/venkt/Documents/projects/scanwise/ScanWise_Toxicity_analyzer/frontend/.env))**
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
...
```

### Running the Project

1.  **Backend**:
    ```bash
    cd backend
    uvicorn main:app --reload --port 8000
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```
