# ScanWise - AI-Powered Skin Intelligence & Toxicity Analyzer

ScanWise is a next-generation skincare assistant that combines **Ingredient Safety Analysis** with **AI-Driven Skin Diagnostics**. Unlike extensive skincare encyclopedias, ScanWise analyzes *your* face to understand your unique skin needs (Acne, Dryness, Wrinkles) and recommends safe, non-toxic products that actually work for you.

![ScanWise Dashboard](https://via.placeholder.com/800x400?text=ScanWise+Dashboard+Preview)

## 🚀 Key Features

### 1. 🧬 AI Skin Analysis
*   **Face Scan**: Upload a selfie to instantly analyze your skin type (Oily, Dry, Combination) and condition.
*   **Condition Detection**: Detects concerns like Acne, Pigmentation, Wrinkles, and Redness using Google Gemini Vision AI.
*   **Privacy First**: Images are processed in real-time and **never stored** on our servers.

### 2. 🧪 Toxicity & Safety Engine
*   **Ingredient Analysis**: detailed breakdown of product ingredients with safety ratings (Safe, Low Risk, High Risk).
*   **Toxicity Score**: A precise 0-100 safety score for every product.
*   **Smart Filtering**: Automatically filters out products containing allergens or irritants harmful to *your* specific skin barriers.

### 3. 🎯 Personalized Recommendations
*   **Smart Matching**: Recommendations aren't just generic lists. If you need Vitamin C, ScanWise finds the *safest* Vitamin C serum for your skin type.
*   **Curated Catalog**: verified database of high-quality, safe products (Sunscreen, Moisturizer, Serums, Exfoliants).

### 4. 📱 Modern Experience
*   **Barcode & OCR**: Scan product bottles directly (Feature in Beta).
*   **Routine Manager**: Build and track your customized skincare routine.
*   **Fast & Responsive**: Built with a sleek, dark-mode compatible UI.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: TailwindCSS
*   **Icons**: Lucide React
*   **State**: Context API

### Backend
*   **API**: FastAPI (Python)
*   **Database**: Firebase Firestore
*   **AI**: Google Gemini Pro Vision
*   **Data Processing**: Pandas, Scikit-learn (Toxicity Models)

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
│   ├── main.py                 # API Entry Point
│   ├── skin_engine.py          # AI Skin Analysis Logic
│   ├── toxicity_engine.py      # Ingredient Safety Logic
│   ├── requirements.txt        # Python Dependencies
│   └── serviceAccountKey.json  # Firebase Credentials (Ignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Main User Hub
│   │   │   └── SkinAnalysis.jsx # AI Analysis UI
│   │   └── components/         # Reusable UI Components
│   └── package.json
│
└── README.md
```

## 🤝 Contributing

This project is currently in **Production Readiness** mode.
*   **Clean Code**: All debug scripts have been removed.
*   **Optimized**: Dependencies are minified and strict.

## 📄 License
MIT License.
