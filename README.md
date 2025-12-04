# ScanWise - Advanced Toxicity & Suitability Analyzer

ScanWise is a modern, full-stack web application designed to help users analyze cosmetic and skincare products for toxicity and suitability. It leverages **Google Gemini AI** for deep ingredient analysis and provides personalized recommendations based on skin type and tone.

## 🌟 Key Features

### 🎨 Premium User Experience
*   **Modern Design System**: Built with a sophisticated **Zinc & Emerald** color palette and **Outfit** typography for a clean, clinical, yet premium feel.
*   **Fluid Animations**: Powered by `framer-motion` for smooth page transitions, card entries, and interactive elements.
*   **Glassmorphism**: Subtle glass effects on cards and panels for a modern aesthetic.
*   **Dark/Light Mode**: Fully supported theme switching that persists across sessions.
*   **Responsive Layout**: Optimized for all devices, from desktop dashboards to mobile screens.

### 🛡️ Admin Portal (New)
*   **Streamlit Dashboard**: A dedicated backend admin portal for managing the crowdsourced product database.
*   **Product Management**: Search, view, edit, and delete product entries directly from the database.
*   **Analytics**: View real-time statistics on total products, users, and scan activity.

### 🧠 AI-Powered Analysis
*   **Deep Ingredient Insights**: Click on any ingredient to get an AI-generated explanation of its function, common uses, and potential side effects.
*   **Risk Context**: The AI understands the context of the risk level (e.g., why "Fragrance" might be high risk for sensitive skin).
*   **Smart Caching**: Explanations are cached locally to reduce API calls and ensure a snappy user experience.

### 🧴 Routine Builder & Conflict Checker
*   **Build Your Routine**: Add multiple products to a virtual routine.
*   **Conflict Detection**: The AI analyzes the combined ingredient list of all products to detect potential conflicts (e.g., Retinol + Vitamin C causing irritation).
*   **Suitability Check**: Verifies if the entire routine matches your skin profile.

### 🔄 Smart Recommendations
*   **Better Alternatives**: If a product has a high toxicity score, ScanWise automatically suggests safer alternatives from the same category.
*   **Social Sharing**: Generate beautiful, shareable cards of your analysis results.

---

## 🚀 Core Functionality

### 1. Multi-Modal Product Scanning
*   **Barcode Scanning**: Instantly look up products by scanning their barcode using your device's camera.
*   **AI OCR (Image Analysis)**: Upload photos of the front (name) and back (ingredients) of a product. Google Gemini extracts the text with high accuracy.
*   **Manual Entry**: Fallback option to manually type or paste ingredient lists.

### 2. Advanced Analysis Engine
*   **Toxicity Scoring**: Calculates a weighted toxicity score (0-100) based on ingredient safety profiles.
*   **Personalized Suitability**:
    *   **Skin Type**: Warns if ingredients are unsuitable for Oily, Dry, Sensitive, etc., skin.
    *   **Skin Tone**: Checks for ingredients that might cause issues for specific skin tones.
*   **Detailed Breakdown**: Granular report of "Safe", "Moderate", and "High Risk" ingredients.

### 3. User Personalization
*   **Profile Auto-Fill**: Analysis forms automatically pre-fill with your skin profile data.
*   **History & Favorites**: Save scans and bookmark favorite products.
*   **Secure Auth**: Firebase Authentication for secure login/signup.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS, Lucide React
*   **Animations**: Framer Motion
*   **State Management**: React Context API
*   **Deployment**: Vercel

### Backend
*   **Framework**: FastAPI (Python)
*   **Admin Portal**: Streamlit
*   **AI Model**: Google Gemini 1.5 Flash
*   **Database**: Google Cloud Firestore
*   **Auth**: Firebase Admin SDK
*   **Deployment**: Render

---

## 🔌 API Endpoints

### Analysis & AI
*   `POST /analyze-image`: Extract text from product images.
*   `POST /scan-product`: Analyze product toxicity and suitability.
*   `POST /explain-ingredient`: Get AI explanation for a specific ingredient.
*   `POST /analyze-routine`: Check a list of products for conflicts.
*   `POST /recommend-alternatives`: Get safer product suggestions.

### User Data
*   `GET /history`: Retrieve scan history.
*   `GET /favorites`: Retrieve favorite products.
*   `GET/POST /users/profile`: Manage user skin profile and theme preferences.

### Admin
*   `GET /admin/products`: (Internal) Retrieve product list.
*   `PUT /admin/products/{id}`: (Internal) Update product details.

---

## ⚙️ Setup & Deployment

### Prerequisites
*   Node.js & npm
*   Python 3.9+
*   Firebase Project (Firestore & Auth enabled)
*   Google AI Studio API Key (Gemini)

### Environment Variables

**Backend (`backend/.env` or Render Env Vars)**
```env
GOOGLE_API_KEY=your_gemini_api_key
FIREBASE_CREDENTIALS={...json_content...}
ADMIN_PASSWORD=your_admin_password
```

**Frontend (`frontend/.env` or Vercel Env Vars)**
```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
...
```

### Running Locally

1.  **Backend (API)**:
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
    ```

2.  **Admin Portal**:
    ```bash
    cd backend
    streamlit run admin_app.py
    ```

3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Deployment
For detailed step-by-step instructions on deploying to **Render** (Backend) and **Vercel** (Frontend), please refer to the [Deployment Guide](deployment.md).
