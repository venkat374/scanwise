# app/streamlit_app.py
"""
ScanWise Streamlit app — cleaned, minimal, Gemini Flash 2.0 + optional local fallback.
- Put GEMINI_API_KEY in project-root .env (GEMINI_API_KEY=...)
- Change FALLBACK_ENABLED below to enable/disable the local fallback behavior.
"""

import os
import re
import streamlit as st
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.manifold import TSNE
from pathlib import Path
from dotenv import load_dotenv
from difflib import SequenceMatcher

# ---------------- CONFIG ----------------
# Toggle fallback behavior here (edit this value in code to disable/enable fallback)
FALLBACK_ENABLED = True

# Default Gemini model to use (the one tested)
DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"

# ---------------- Load .env explicitly from project root ----------------
THIS_FILE = Path(__file__).resolve()
PROJECT_ROOT = THIS_FILE.parent.parent
DOTENV_PATH = PROJECT_ROOT / ".env"
if DOTENV_PATH.exists():
    load_dotenv(dotenv_path=str(DOTENV_PATH))
else:
    # fallback to default loader (helpful in some deployments)
    load_dotenv()

# sanitize key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    GEMINI_API_KEY = GEMINI_API_KEY.strip().strip('"').strip("'")

# ---------------- Try import Gemini client ----------------
try:
    import google.generativeai as genai
    GEMINI_CLIENT_AVAILABLE = True
except Exception:
    genai = None
    GEMINI_CLIENT_AVAILABLE = False

# Configure Gemini client if possible
gemini_ready = False
gemini_init_error = None
if GEMINI_CLIENT_AVAILABLE and GEMINI_API_KEY:
    try:
        # configure (may be a no-op for some client builds)
        try:
            genai.configure(api_key=GEMINI_API_KEY)
        except Exception:
            pass
        # mark ready: actual call errors will surface when calling generate_content
        gemini_ready = True
    except Exception as e:
        gemini_init_error = str(e)
        gemini_ready = False

# ---------------- Streamlit UI config ----------------
st.set_page_config(page_title="ScanWise", layout="wide")
st.title("🧴 ScanWise – Cosmetic Toxicity Predictor + Chat")

# ---------------- Data loading & preprocessing ----------------
@st.cache_data(show_spinner=False)
def load_and_prepare_csv(path=str(PROJECT_ROOT / "data" / "cosmetics.csv")):
    df = pd.read_csv(path)
    df = df[df["ingredients"].notna()]
    df = df[df["ingredients"].str.strip().str.lower() != "no info"]
    df = df.reset_index(drop=True)

    # tokenize ingredient lists
    def clean_ingredients(ing):
        return [i.strip().lower() for i in str(ing).split(",") if i.strip() != ""]

    df["ingredient_list"] = df["ingredients"].apply(clean_ingredients)

    # build ingredient index mapping
    ingredient_idx = {}
    idx = 0
    for lst in df["ingredient_list"]:
        for ing in lst:
            if ing not in ingredient_idx:
                ingredient_idx[ing] = idx
                idx += 1

    # create binary product x ingredient matrix
    M = len(df)
    N = len(ingredient_idx)
    A = np.zeros((M, N), dtype=np.uint8)
    for i, lst in enumerate(df["ingredient_list"]):
        for ing in lst:
            j = ingredient_idx[ing]
            A[i, j] = 1

    return df, ingredient_idx, A

# Load dataset
df, ingredient_idx, A = load_and_prepare_csv()

# ---------------- Heuristics & toxicity lists ----------------
TOXIC_INGREDIENTS = [
    "paraben", "parabens", "sodium lauryl sulfate", "sls", "phthalate", "phthalates",
    "formaldehyde", "oxybenzone", "triclosan", "toluene", "petrolatum", "coal tar",
    "fragrance", "parfum", "linalool", "limonene", "citral"
]

COMEDO_GENIC_KEYWORDS = [
    "coconut", "cocos nucifera", "capric triglyceride", "isopropyl myristate",
    "isopropyl palmitate", "myristyl myristate", "lanolin", "cocoa butter",
    "butyrospermum parkii", "shea butter", "oleic", "oleate", "ethylhexyl palmitate",
    "isopropyl", "petrolatum", "mineral oil", "cetearyl alcohol"
]

HEAVY_OILS = [
    "coconut oil", "cocos nucifera", "cocoa butter", "shea butter",
    "isopropyl myristate", "isopropyl palmitate", "oleic acid", "lanolin", "mineral oil", "petrolatum"
]

IRRITANTS = [
    "fragrance", "parfum", "linalool", "limonene", "citral", "eugenol", "geraniol", "cinnamal", "benzyl alcohol"
]

def normalize_text(s):
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r'[^a-z0-9, /-]+', ' ', s)
    return s

def find_matches(s, keywords):
    s = normalize_text(s)
    found = []
    for k in keywords:
        if k in s:
            found.append(k)
    return list(dict.fromkeys(found))

def check_toxic(ing_str):
    s = normalize_text(ing_str)
    found = [t for t in TOXIC_INGREDIENTS if t in s]
    return 1 if found else 0

def get_toxic_ingredients(ing_str):
    s = normalize_text(ing_str)
    return [t for t in TOXIC_INGREDIENTS if t in s]

if "toxic_flag" not in df.columns:
    df["toxic_flag"] = df["ingredients"].apply(check_toxic)

# ---------------- Similarity & recommend ----------------
@st.cache_data(show_spinner=False)
def compute_similarity(matrix):
    return cosine_similarity(matrix)

similarities = compute_similarity(A)

def recommend_safe_alternatives(product_idx, top_n=5):
    if product_idx is None or product_idx < 0 or product_idx >= len(df):
        return pd.DataFrame()
    sim_scores = similarities[product_idx]
    safe_mask = (df["toxic_flag"] == 0).to_numpy()
    candidates_idx = np.where(safe_mask)[0]
    candidate_scores = [(int(i), float(sim_scores[i])) for i in candidates_idx if int(i) != int(product_idx)]
    candidate_scores.sort(key=lambda x: x[1], reverse=True)
    top = candidate_scores[:top_n]
    rows = []
    for i, score in top:
        rows.append({"idx": int(i), "name": df.at[i, "name"], "brand": df.at[i, "brand"], "price": df.at[i, "price"], "similarity": float(score)})
    return pd.DataFrame(rows)

# ---------------- Local fallback (minimal, conservative) ----------------
def local_fallback_answer(user_prompt, product_context):
    """
    A conservative, deterministic fallback that uses simple heuristics.
    Keep this minimal: only used if FALLBACK_ENABLED is True.
    """
    q = (user_prompt or "").strip().lower()

    # refuse ingestion/medical
    ingestion_kw = ["oral", "orally", "drink", "swallow", "ingest", "take by mouth", "consume", "eat this"]
    if any(k in q for k in ingestion_kw):
        return ("I can't advise on ingesting products. If someone swallowed a product and has symptoms (difficulty breathing, severe dizziness, fainting, swelling), "
                "call emergency services or poison control. For non-emergency concerns, consult a medical professional or pharmacist.")

    # hair intent
    if any(term in q for term in ["hair", "scalp", "apply on hair", "apply to hair", "use on hair", "leave-in"]):
        ctx = normalize_text(product_context or "")
        heavy = find_matches(ctx, HEAVY_OILS)
        acids = [a for a in ["glycolic", "lactic", "salicylic", "retinol", "retinoid", "alpha hydroxy", "aha", "bha"] if a in ctx]
        if acids:
            return ("This product contains exfoliating acids (" + ", ".join(acids) + ") which could irritate the scalp. Avoid applying concentrated facial actives to the scalp.")
        if heavy:
            return ("Contains heavier conditioning oils (" + ", ".join(heavy[:5]) + "). These can be useful for dry hair ends but may feel greasy on the scalp and can weigh down fine hair.")
        return ("No clear hair-specific concerns detected. If treating scalp issues, use products formulated for hair.")

    # 'why harmful' and skin-type queries
    if any(term in q for term in ["why", "harmful", "danger", "risk", "why is"]):
        ctx = normalize_text(product_context or "")
        toxic_found = get_toxic_ingredients(ctx)
        comedo = find_matches(ctx, COMEDO_GENIC_KEYWORDS)
        irr = find_matches(ctx, IRRITANTS)
        reasons = []
        if toxic_found:
            reasons.append("Known sensitizers/irritants: " + ", ".join(toxic_found))
        if comedo:
            reasons.append("Potentially pore-clogging/heavy: " + ", ".join(comedo))
        if irr and not toxic_found:
            reasons.append("Potential irritants: " + ", ".join(irr))
        if reasons:
            return " ".join(reasons) + " These may increase the chance of irritation or breakouts for some people."
        return ("I don't see common risky ingredients in the provided list. That doesn't guarantee safety — patch-test and consult a dermatologist for medical concerns.")

    # general fallback message
    return "I couldn't confidently answer that. Try asking: 'Is it OK for oily skin?' or 'Why might this irritate sensitive skin?'"

# ---------------- Gemini wrapper ----------------
def call_gemini_chat(user_question, product_context_dict, model_name=DEFAULT_GEMINI_MODEL,
                     temperature=0.0, max_output_tokens=300):
    """
    Call Gemini once (GenerativeModel.generate_content). If it fails, and FALLBACK_ENABLED is True,
    run a single local fallback; otherwise return the visible error.
    """
    # Build compact context
    ingredients_short = product_context_dict.get("ingredients_short", "")
    detected_toxic = product_context_dict.get("detected_toxic", [])
    toxic_note = ("Detected flagged ingredients: " + ", ".join(detected_toxic) + ".") if detected_toxic else ""
    raw_context = (
        f"Product: {product_context_dict.get('name','')}\n"
        f"Brand: {product_context_dict.get('brand','')}\n"
        f"Price: {product_context_dict.get('price','')}\n"
        f"{toxic_note}\n"
        f"Ingredients (trimmed): {ingredients_short}"
    )

    # System prompt
    system = (
        "You are ScanWise, a concise consumer-facing cosmetic safety assistant. "
        "Use the provided product context to answer the user's question concisely (1-4 sentences). "
        "If you assert a safety claim, cite the ingredient(s) from the context that support the claim. "
        "If the user asks about ingestion/emergencies, refuse and advise contacting emergency services/poison control. "
        "Do not provide medical diagnoses."
    )

    final_input = system + "\n\nPRODUCT CONTEXT:\n" + raw_context + "\n\nUSER QUESTION:\n" + user_question
    if len(final_input) > 4000:
        final_input = final_input[:4000] + "\n\n[TRUNCATED]"

    # Client availability checks
    if not GEMINI_CLIENT_AVAILABLE:
        if FALLBACK_ENABLED:
            return local_fallback_answer(user_question, product_context_dict.get("raw_context",""))
        return "<Gemini client not installed (google-generativeai missing)>"

    if not GEMINI_API_KEY:
        if FALLBACK_ENABLED:
            return local_fallback_answer(user_question, product_context_dict.get("raw_context",""))
        return "<GEMINI_API_KEY not configured in .env>"

    # Attempt a single Gemini call
    try:
        model = genai.GenerativeModel(model_name)
        gen_cfg = {"temperature": float(temperature), "max_output_tokens": int(max_output_tokens)}
        resp = model.generate_content(final_input, generation_config=gen_cfg)
        if resp and hasattr(resp, "text") and resp.text:
            return resp.text.strip()
        # Empty response -> return a short note
        return "<Gemini returned an empty response>"
    except Exception as e:
        # Only use local fallback if enabled
        if FALLBACK_ENABLED:
            return local_fallback_answer(user_question, product_context_dict.get("raw_context",""))
        # Otherwise return visible error message
        return f"<Gemini API call failed: {type(e).__name__}: {str(e)}>"

# ---------------- Streamlit UI ----------------
st.sidebar.header("Controls")
product_query = st.sidebar.text_input("Product name (partial ok):", value="")
perplexity = st.sidebar.slider("t-SNE perplexity (visual only)", 5, 50, 30)
temperature = st.sidebar.slider("Chat temperature", 0.0, 1.0, 0.0, 0.05)
# Simple indicator: show whether fallback is active (configuration value)
st.sidebar.write("Local fallback enabled:", FALLBACK_ENABLED)

col1, col2 = st.columns([1.3, 1])

with col1:
    st.header("Product Lookup")
    if product_query.strip() == "":
        st.info("Type product name on the left and press Enter.")
    else:
        matches = df[df["name"].str.contains(product_query, case=False, na=False)]
        if matches.empty:
            st.warning("No product matched your query.")
        else:
            p = matches.iloc[0]
            idx = int(matches.index[0])
            st.subheader(p["name"])
            st.write("**Brand:**", p["brand"])
            st.write("**Price:**", f"${p['price']}")
            st.write("**Ingredients:**")
            st.caption(p["ingredients"])

            if int(p["toxic_flag"]) == 1:
                harmful = get_toxic_ingredients(p["ingredients"])
                st.error("⚠️ Potentially harmful ingredients detected!")
                st.write("**Detected toxic ingredients:**", ", ".join(harmful))
            else:
                st.success("✅ No flagged harmful ingredients detected.")

            st.markdown("### 🔄 Safer alternatives (similar formulation)")
            alt_df = recommend_safe_alternatives(idx, top_n=6)
            if alt_df.empty:
                st.write("No safe alternatives found in dataset.")
            else:
                for _, row in alt_df.iterrows():
                    st.write(f"- **{row['name']}** — {row['brand']} — ${row['price']} — similarity {row['similarity']:.2f}")

with col2:
    st.header("Chat with ScanWise about this product")
    st.write("Ask follow-ups about safety, skin-type suitability, hair use, ingredients, or alternatives.")
    if not GEMINI_CLIENT_AVAILABLE:
        st.warning("Gemini client not installed. Install `google-generativeai` to enable model answers.")
    elif not GEMINI_API_KEY:
        st.warning("GEMINI_API_KEY not set in .env (project root).")
    else:
        st.success("Gemini configured. Chat will attempt to use the API.")

    # Chat history in session state
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Display chat
    for role, text in st.session_state.chat_history:
        if role == "user":
            st.markdown(f"**You:** {text}")
        else:
            st.markdown(f"**ScanWise:** {text}")

    # Chat form to avoid duplicate sends
    with st.form(key="scanwise_chat_form", clear_on_submit=False):
        user_msg = st.text_input("Message:", key="user_input_field")
        submit = st.form_submit_button("Send")
        if submit:
            if product_query.strip() == "" or df[df["name"].str.contains(product_query, case=False, na=False)].empty:
                st.warning("Please select a product first.")
            elif not user_msg or user_msg.strip() == "":
                st.info("Type a short question or request.")
            else:
                # append user message immediately
                st.session_state.chat_history.append(("user", user_msg))

                # build product context
                matches = df[df["name"].str.contains(product_query, case=False, na=False)]
                p = matches.iloc[0]
                ingredients = p["ingredients"]
                ingredients_short = " ".join(ingredients.split())[:700]
                detected = get_toxic_ingredients(ingredients)
                product_ctx = {
                    "name": p["name"],
                    "brand": p["brand"],
                    "price": p["price"],
                    "ingredients_short": ingredients_short,
                    "detected_toxic": detected,
                    "raw_context": f"Product: {p['name']}\nBrand: {p['brand']}\nPrice: {p['price']}\nIngredients: {ingredients}"
                }

                # Call Gemini (or local fallback depending on FALLBACK_ENABLED and errors)
                assistant_reply = call_gemini_chat(user_msg, product_ctx, temperature=temperature, max_output_tokens=300)
                st.session_state.chat_history.append(("assistant", assistant_reply))

    # Clear chat (outside form)
    if st.button("Clear chat"):
        st.session_state.chat_history = []

# Optional t-SNE visualization
with st.expander("Show ingredient-similarity map (t-SNE)"):
    st.write("2D t-SNE map of products (Safe vs Toxic). This may take several seconds.")
    if st.button("Compute / Refresh t-SNE"):
        try:
            tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity)
            coords = tsne.fit_transform(A)
            df["X_tsne"], df["Y_tsne"] = coords[:, 0], coords[:, 1]
            import plotly.express as px
            fig = px.scatter(df, x="X_tsne", y="Y_tsne",
                             color=df["toxic_flag"].map({0: "Safe", 1: "Toxic"}),
                             hover_data=["name", "brand", "price", "rank"])
            st.plotly_chart(fig, use_container_width=True)
        except Exception as e:
            st.error("t-SNE failed: " + str(e))

# Footer
st.markdown("---")
st.caption("ScanWise — ingredient-based cosmetic assistant. Uses heuristics and a language model for explanations. Not medical advice.")