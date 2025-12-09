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
page = st.sidebar.radio("Go to", ["Dashboard", "Product Manager", "Add Product", "User Stats"])

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
    
    col1, col2 = st.columns([3, 1])
    with col1:
        search_query = st.text_input("Search Products (by name)", "")
    with col2:
        filter_status = st.radio("Status", ["All", "Active", "Flagged"], index=0, horizontal=True)
    
    products_ref = db.collection("products")
    query = products_ref
    
    # Strategy: 
    # If search query exists, query by name (inequality) and filter status in memory (to avoid complex index).
    # If no search query, query by status (equality) if not "All".
    
    if search_query:
        query = query.where("product_name", ">=", search_query).where("product_name", "<=", search_query + '\uf8ff')
    elif filter_status != "All":
        query = query.where("db_status", "==", filter_status.lower())
    
    # Limit to 50 for performance
    docs = query.limit(50).stream()
    
    data = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        # Client-side filtering if search query was used
        if search_query and filter_status != "All":
            if d.get("db_status", "active") != filter_status.lower():
                continue
        data.append(d)
        
    if not data:
        st.info("No products found.")
    else:
        df = pd.DataFrame(data)
        
        # Reorder columns
        cols = ["id", "product_name", "brand", "category", "toxicity_score", "db_status", "product_status"]
        # Filter to only existing cols
        cols = [c for c in cols if c in df.columns]
        
        # Editable Dataframe
        edited_df = st.data_editor(
            df[cols],
            key="product_editor",
            num_rows="dynamic",
            disabled=["id"] # ID should not be editable
        )
        
        # Edit Form for selected product
        st.divider()
        st.subheader("Edit / Review Product")
        
        selected_id = st.selectbox("Select Product ID to Edit/Review", df["id"].tolist())
        
        if selected_id:
            # Fetch fresh data
            p_ref = db.collection("products").document(selected_id)
            p_snap = p_ref.get()
            
            if p_snap.exists:
                p_data = p_snap.to_dict()
                
                # Show Status Badge
                curr_status = p_data.get("db_status", "active")
                if curr_status == "flagged":
                    st.warning("⚠️ This product is FLAGGED as suspicious.")
                else:
                    st.success("✅ This product is ACTIVE.")

                with st.form("edit_product_form"):
                    new_name = st.text_input("Product Name", p_data.get("product_name", ""))
                    new_brand = st.text_input("Brand", p_data.get("brand", ""))
                    new_category = st.text_input("Category", p_data.get("category", ""))
                    new_score = st.number_input("Toxicity Score", 0.0, 1.0, p_data.get("toxicity_score", 0.0))
                    
                    # Ingredients (List)
                    ingredients_str = ", ".join(p_data.get("ingredients", []))
                    new_ingredients = st.text_area("Ingredients (comma separated)", ingredients_str)
                    
                    col_update, col_approve = st.columns(2)
                    
                    with col_update:
                        submitted = st.form_submit_button("Update Product Data")
                    
                    with col_approve:
                        if curr_status == "flagged":
                            approve_btn = st.form_submit_button("✅ Approve (Set Active)")
                        else:
                            approve_btn = False

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
                    
                    if approve_btn:
                        p_ref.update({"db_status": "active"})
                        st.success(f"Approved {new_name}!")
                        st.rerun()
                
                st.write("")
                if st.button("Delete / Reject Product", type="primary"):
                    p_ref.delete()
                    st.warning(f"Deleted product {selected_id}")
                    st.rerun()

elif page == "Add Product":
    st.header("Add New Product")
    st.markdown("Manually add authentic products to the database. These will take precedence over external API results.")
    
    with st.form("add_product_form"):
        col1, col2 = st.columns(2)
        with col1:
            barcode = st.text_input("Barcode (Required)", help="Scan the barcode or type it in.")
            product_name = st.text_input("Product Name")
            brand = st.text_input("Brand")
        
        with col2:
            category = st.text_input("Category (e.g. Moisturizer)")
            image_url = st.text_input("Image URL (Optional)")
            toxicity_score = st.number_input("Toxicity Score (Optional Override)", 0.0, 10.0, 0.0, help="Leave 0 to auto-calculate later if needed, or set manually.")
            
        ingredients = st.text_area("Ingredients (comma separated)", height=150, help="Copy paste the full ingredient list here.")
        
        submitted = st.form_submit_button("Add Product to Database")
        
        if submitted:
            if not barcode or not product_name or not ingredients:
                st.error("Barcode, Product Name, and Ingredients are required.")
            else:
                # Check if exists
                doc_ref = db.collection("products").document(barcode)
                doc = doc_ref.get()
                
                if doc.exists:
                    st.warning(f"Product with barcode {barcode} already exists: {doc.to_dict().get('product_name')}. Use Product Manager to edit.")
                else:
                    # Clean ingredients
                    ing_list = [i.strip() for i in ingredients.split(",") if i.strip()]
                    
                    new_product = {
                        "product_name": product_name,
                        "brand": brand,
                        "category": category,
                        "ingredients": ing_list,
                        "image_url": image_url,
                        "toxicity_score": toxicity_score,
                        "product_status": "analyzed" if toxicity_score > 0 else "pending",
                        "db_status": "active", # Admin added is always active
                        "source": "admin_manual",
                        "timestamp": datetime.now()
                    }
                    
                    doc_ref.set(new_product)
                    st.success(f"Successfully added {product_name} ({barcode})!")
                    
elif page == "User Stats":
    st.header("User Statistics")
    st.info("Coming soon...")
