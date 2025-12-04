import streamlit as st
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

# --- CONFIGURATION ---
st.set_page_config(
    page_title="ScanWise Admin",
    page_icon="🛡️",
    layout="wide"
)

# --- AUTHENTICATION (Simple Password) ---
# In a real app, use Firebase Auth or a more secure method.
# For this internal tool, a simple password check is sufficient for now.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

def check_password():
    """Returns `True` if the user had the correct password."""

    def password_entered():
        """Checks whether a password entered by the user is correct."""
        if st.session_state["password"] == ADMIN_PASSWORD:
            st.session_state["password_correct"] = True
            # del st.session_state["password"]  # don't store password
        else:
            st.session_state["password_correct"] = False

    if "password_correct" not in st.session_state:
        # First run, show input for password.
        st.text_input(
            "Password", type="password", on_change=password_entered, key="password"
        )
        return False
    elif not st.session_state["password_correct"]:
        # Password not correct, show input + error.
        st.text_input(
            "Password", type="password", on_change=password_entered, key="password"
        )
        st.error("😕 Password incorrect")
        return False
    else:
        # Password correct.
        return True

if not check_password():
    st.stop()

# --- FIREBASE SETUP ---
# Singleton pattern to avoid re-initializing
@st.cache_resource
def get_db():
    # Check if already initialized
    if not firebase_admin._apps:
        cred_path = "serviceAccountKey.json"
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Try env var or default
            try:
                firebase_admin.initialize_app()
            except Exception as e:
                st.error(f"Failed to initialize Firebase: {e}")
                return None
    
    try:
        return firestore.client()
    except Exception as e:
        st.error(f"Failed to connect to Firestore: {e}")
        return None

db = get_db()

if not db:
    st.warning("Database connection failed. Please check credentials.")
    st.stop()

# --- APP LOGIC ---

st.title("🛡️ ScanWise Admin Portal")
st.markdown("Manage crowdsourced product data and view statistics.")

# Sidebar
st.sidebar.header("Navigation")
page = st.sidebar.radio("Go to", ["Dashboard", "Product Manager", "User Stats"])

if page == "Dashboard":
    st.header("Overview")
    
    col1, col2, col3 = st.columns(3)
    
    # Fetch stats (this can be optimized with counters in DB)
    products_ref = db.collection("products")
    users_ref = db.collection("users")
    history_ref = db.collection("scan_history")
    
    # Note: count() queries are cheaper/faster in Firestore
    try:
        total_products = products_ref.count().get()[0][0].value
        total_users = users_ref.count().get()[0][0].value
        total_scans = history_ref.count().get()[0][0].value
    except Exception:
        # Fallback if count() aggregation not available/failed
        total_products = len(list(products_ref.limit(1000).stream())) # Approx
        total_users = "N/A"
        total_scans = "N/A"

    col1.metric("Total Products", total_products)
    col2.metric("Total Users", total_users)
    col3.metric("Total Scans", total_scans)
    
    st.subheader("Recent Activity")
    # Show last 5 scans
    recent_scans = history_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(5).stream()
    scan_data = []
    for doc in recent_scans:
        d = doc.to_dict()
        scan_data.append({
            "Product": d.get("product_name"),
            "Score": d.get("toxicity_score"),
            "Time": d.get("timestamp")
        })
    
    if scan_data:
        st.dataframe(pd.DataFrame(scan_data))
    else:
        st.info("No recent scans found.")

elif page == "Product Manager":
    st.header("Product Database")
    
    # Search
    search_query = st.text_input("Search Products (by name)", "")
    
    products_ref = db.collection("products")
    query = products_ref
    
    if search_query:
        # Simple prefix search (Firestore limitation: case sensitive usually)
        # For better search, we'd need Algolia or similar. 
        # Here we just fetch matches.
        # Using >= and <= for prefix search
        query = query.where("product_name", ">=", search_query).where("product_name", "<=", search_query + '\uf8ff')
    
    # Limit to 50 for performance
    docs = query.limit(50).stream()
    
    data = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        data.append(d)
        
    if not data:
        st.info("No products found.")
    else:
        df = pd.DataFrame(data)
        
        # Reorder columns
        cols = ["id", "product_name", "brand", "category", "toxicity_score", "product_status"]
        # Filter to only existing cols
        cols = [c for c in cols if c in df.columns]
        
        # Editable Dataframe
        edited_df = st.data_editor(
            df[cols],
            key="product_editor",
            num_rows="dynamic",
            disabled=["id"] # ID should not be editable
        )
        
        # Check for changes (this is a simplified approach)
        # In a real app, you'd track specific changes. 
        # Streamlit's data_editor returns the current state.
        
        # Edit Form for selected product
        st.divider()
        st.subheader("Edit / Delete Product")
        
        selected_id = st.selectbox("Select Product ID to Edit/Delete", df["id"].tolist())
        
        if selected_id:
            # Fetch fresh data
            p_ref = db.collection("products").document(selected_id)
            p_snap = p_ref.get()
            
            if p_snap.exists:
                p_data = p_snap.to_dict()
                
                with st.form("edit_product_form"):
                    new_name = st.text_input("Product Name", p_data.get("product_name", ""))
                    new_brand = st.text_input("Brand", p_data.get("brand", ""))
                    new_category = st.text_input("Category", p_data.get("category", ""))
                    new_score = st.number_input("Toxicity Score", 0.0, 1.0, p_data.get("toxicity_score", 0.0))
                    
                    # Ingredients (List)
                    ingredients_str = ", ".join(p_data.get("ingredients", []))
                    new_ingredients = st.text_area("Ingredients (comma separated)", ingredients_str)
                    
                    submitted = st.form_submit_button("Update Product")
                    
                    if submitted:
                        updated_data = {
                            "product_name": new_name,
                            "brand": new_brand,
                            "category": new_category,
                            "toxicity_score": new_score,
                            "ingredients": [i.strip() for i in new_ingredients.split(",") if i.strip()]
                        }
                        p_ref.update(updated_data)
                        st.success(f"Updated {new_name}!")
                        st.rerun()
                
                if st.button("Delete Product", type="primary"):
                    p_ref.delete()
                    st.warning(f"Deleted product {selected_id}")
                    st.rerun()

elif page == "User Stats":
    st.header("User Statistics")
    st.info("Coming soon...")
