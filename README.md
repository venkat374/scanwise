# ScanWise - AI-Powered Skin Intelligence & Toxicity Analyzer

ScanWise is a next-generation skincare assistant that combines **Ingredient Safety Analysis** with **AI-Driven Skin Diagnostics**. Unlike extensive skincare encyclopedias, ScanWise analyzes *your* face to understand your unique skin needs (Acne, Dryness, Wrinkles) and recommends safe, non-toxic products that actually work for you.

![ScanWise Dashboard](https://scanwise-five.vercel.app/)

## �️ Project Flow & User Journey

ScanWise guides users through a scientifically backed skincare journey:

### 1. Onboarding & Profiling
*   **Sign Up**: Users create a secure profile.
*   **Initial Profile**: Users input basic details (Age, Known Sensitivities).
*   **AI Face Scan (Core Feature)**: 
    *   User uploads a selfie.
    *   **Gemini AI** analyzes the image for texture, pores, pigmentation, and barrier health.
    *   System generates a **Skin Health Report** (e.g., "Oily Skin with High Sensitivity").

### 2. Analysis & Diagnosis
*   **Report Generation**: The backend computes severity scores (0-100) for dryness, acne, and aging.
*   **Result**: User sees a visual dashboard of their skin's current state.

### 3. Personalized Recommendation
*   **Matching Engine**: Based on the diagnosis (e.g., "Need Barrier Repair"), the system queries the **Curated Safety Database**.
*   **Safety Check**: Products are filtered by **Toxicity Score** (< 40) and specific ingredient compatibility (e.g., No Alcohol for Dry Skin).
*   **Output**: 3-5 hyper-relevant product suggestions per category (Cleanser, Serum, Moisturizer).

### 4. Toxicity Analysis (Product Scan)
*   **Manual/Barcode Entry**: Users can check products they already own.
*   **Ingredient Breakdown**: The system parses ingredient lists, identifying carcinogens, allergens, or endocrine disruptors.
*   **Verdict**: Returns a "Safe", "Low Risk", or "High Risk" verdict instantly.

---

## 🚀 Key Features In-Depth

### 1. 🧬 AI Skin Analysis Engine
*   **Model**: Google Gemini Pro Vision.
*   **Capabilities**:
    *   **Skin Type Detection**: Precision classification (Oily, Dry, Combination, Normal).
    *   **Condition Mapping**: Identifies 6+ specific concerns: Acne, Fine Lines, Pigmentation, Redness, Dehydration, Dullness.
    *   **Privacy Architecture**: Stateless processing. Images are analyzed in-memory and discarded immediately.

### 2. 🧪 Toxicity Scoring System
*   **Algorithm**: Weighted Ingredient Risk Analysis.
*   **Data Source**: Custom toxicity database (seed data) + Incidecoder integration.
*   **Scoring Logic**:
    *   Each ingredient is assigned a risk level (0-10).
    *   **Product Score** = Weighted average of ingredient risks + Penalties for "The Dirty Dozen" (Parabens, Sulfates, etc.).
    *   **Smart Filtering**: Automatically hides high-toxicity products from recommendations.

### 3. �️ Robust Backend Architecture
*   **FastAPI**: High-performance async Python framework.
*   **Firebase Firestore**: NoSQL real-time database for user profiles and product catalog.
*   **Dependency Injection**: Modular design for Authentication, DB access, and AI services.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: TailwindCSS
*   **UI Components**: Lucide React, Custom Cards/Modals
*   **State Management**: Context API (Auth, Profile)

### Backend
*   **API**: FastAPI (Python)
*   **Database**: Firebase Firestore
*   **AI**: Google Gemini Pro Vision
*   **Libraries**: Pandas, Scikit-learn, Beautifulsoup4

---

## ⚡ Getting Started

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)
*   Firebase Project (Service Account Key)
*   Google Gemini API Key

### 1. Backend Setup

```bash
cd backend

# Create Virtual Environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Setup Environment Variables
# Create a .env file in /backend with:
# GOOGLE_API_KEY=your_gemini_key
# ALLOWED_ORIGINS=http://localhost:5173

# Add Firebase Key
# Place your 'serviceAccountKey.json' in the /backend folder.

# Run Server
uvicorn main:app --reload
```
*Backend will run on http://localhost:8000*

### 2. Frontend Setup

```bash
cd frontend

# Install Packages
npm install

# Run Development Server
npm run dev
```
*Frontend will run on http://localhost:5173*

---

## 🛡️ Project Structure

```
ScanWise/
├── backend/
│   ├── main.py                 # API Entry Point & Endpoints
│   ├── skin_engine.py          # Gemini AI Integration & Logic
│   ├── toxicity_engine.py      # Ingredient Safety Calculator
│   ├── fetch_ingredients.py    # Product Data Fetching
│   ├── requirements.txt        # Production Dependencies
│   └── serviceAccountKey.json  # Firebase Credentials (Ignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Main Hub & Loading Logic
│   │   │   ├── SkinAnalysis.jsx # Face Scan UI & Results
│   │   └── components/         # Reusable UI (Cards, Modals)
│   └── package.json
│
└── README.md
```

## 🤝 Contributing

This project is currently in **Production Readiness** mode.
*   **Code Quality**: Cleaned of all debug/test scripts (`seed_*.py`, `debug_*.py`).
*   **Performance**: Optimized for fast load times and minimal latency.

## 📄 License
MIT License.
