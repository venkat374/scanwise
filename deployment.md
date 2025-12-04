# Deployment Guide

This guide details how to deploy the ScanWise application to production using **Render** for the backend and **Vercel** for the frontend.

## 1. Backend Deployment (Render)

We will deploy the FastAPI backend and the Streamlit Admin Portal to Render.

### Prerequisites
*   A [Render](https://render.com) account.
*   Your GitHub repository connected to Render.

### Steps
1.  **Create a New Web Service**:
    *   Go to your Render Dashboard and click **New +** -> **Web Service**.
    *   Select your `scanwise` repository.

2.  **Configure the Service**:
    *   **Name**: `scanwise-backend` (or similar)
    *   **Region**: Choose the one closest to your users.
    *   **Branch**: `main`
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`

3.  **Environment Variables**:
    *   Scroll down to the "Environment Variables" section and add the following:
        *   `PYTHON_VERSION`: `3.9.0` (or your local version)
        *   `GOOGLE_API_KEY`: Your Gemini API Key.
        *   `FIREBASE_CREDENTIALS`: The **content** of your `serviceAccountKey.json` file as a single line string.
        *   `ADMIN_PASSWORD`: Password for the Admin Portal.

4.  **Deploy**:
    *   Click **Create Web Service**. Render will start building your app.
    *   Once deployed, copy the **Service URL** (e.g., `https://scanwise-backend.onrender.com`). You will need this for the frontend.

### Deploying the Admin Portal (Optional)
To deploy the Streamlit Admin Portal, create a **separate** Web Service on Render pointing to the same repo/directory but with a different start command:
*   **Start Command**: `streamlit run admin_app.py --server.port 10000 --server.address 0.0.0.0`
*   **Env Vars**: Same as above.

---

## 2. Frontend Deployment (Vercel)

We will deploy the React frontend to Vercel.

### Prerequisites
*   A [Vercel](https://vercel.com) account.
*   Your GitHub repository connected to Vercel.

### Steps
1.  **Import Project**:
    *   Go to your Vercel Dashboard and click **Add New...** -> **Project**.
    *   Import your `scanwise` repository.

2.  **Configure Project**:
    *   **Framework Preset**: `Vite` (Vercel should detect this automatically).
    *   **Root Directory**: Click "Edit" and select `frontend`.

3.  **Environment Variables**:
    *   Expand the "Environment Variables" section and add:
        *   `VITE_API_URL`: The URL of your deployed backend (e.g., `https://scanwise-backend.onrender.com`). **Do not add a trailing slash.**
        *   `VITE_FIREBASE_API_KEY`: Your Firebase API Key.
        *   `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth Domain.
        *   `VITE_FIREBASE_PROJECT_ID`: Your Firebase Project ID.
        *   `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket.
        *   `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase Messaging Sender ID.
        *   `VITE_FIREBASE_APP_ID`: Your Firebase App ID.

4.  **Deploy**:
    *   Click **Deploy**. Vercel will build and deploy your frontend.
    *   Once finished, you will get a production URL (e.g., `https://scanwise.vercel.app`).

---

## 3. Post-Deployment Verification

1.  **Visit your Frontend URL**.
2.  **Test Authentication**: Try logging in or signing up.
3.  **Test Analysis**: Run a product scan to ensure the frontend can communicate with the backend and the backend can talk to Gemini/Firebase.
4.  **Check Admin**: If you deployed the admin portal, visit its URL and try logging in.
