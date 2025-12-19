import httpx
from bs4 import BeautifulSoup
import urllib.parse
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")

class IncidecoderClient:
    BASE_URL = "https://incidecoder.com/ingredients"

    @staticmethod
    def search_local_products(query: str):
        """
        Searches for products in the local products.json file.
        Uses token-based matching: all words in query must be in product name.
        """
        if not os.path.exists(PRODUCTS_FILE):
            return []
            
        try:
            with open(PRODUCTS_FILE, "r") as f:
                products = json.load(f)
                
            query_lower = query.lower()
            query_tokens = query_lower.split()
            
            results = []
            for p in products:
                name_lower = p.get("name", "").lower()
                brand_lower = p.get("brand", "").lower()
                full_text = f"{name_lower} {brand_lower}"
                
                # Tokenize product text for accurate matching
                # Replace punctuation that might glue words
                text_tokens = set(full_text.replace("-", " ").replace("(", " ").replace(")", " ").split())
                
                matches = 0
                for token in query_tokens:
                    # 1. Exact word match
                    if token in text_tokens:
                        matches += 1
                    # 2. Substring match only for deeper/longer tokens (e.g. "hydrate" in "hydrating")
                    elif len(token) > 2 and token in full_text:
                        matches += 1
                
                # Require ALL tokens to match (strict) or very high overlap
                if matches == len(query_tokens):
                     results.append(p)
                # Fallback: exact phrase match always wins
                elif query_lower in full_text and p not in results:
                     results.append(p)

            return results
        except Exception as e:
            print(f"Error searching local products: {e}")
            return []

    @staticmethod
    def search_online(query: str, limit: int = 5):
        """
        Scrapes Incidecoder for products matching the query.
        Returns a list of product dicts (name, brand, link, image, ingredients).
        """
        print(f"Searching online for: {query}")
        encoded_query = urllib.parse.quote(query)
        url = f"https://incidecoder.com/search?query={encoded_query}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        try:
            response = httpx.get(url, headers=headers, timeout=10.0, follow_redirects=True)
            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            products = []
            
            # Find product links
            product_links = soup.find_all("a", class_="simpletextlistitem")
            
            # Limit results
            for link in product_links[:limit]:
                href = link.get('href')
                name = link.get_text(strip=True)
                
                if href and name:
                    # STRICT FILTER: Only follow actual product links
                    if "/products/" not in href:
                        continue

                    product_url = f"https://incidecoder.com{href}"
                    # Fetch details immediately to get ingredients
                    details = IncidecoderClient._fetch_product_page_details(product_url)
                    
                    if details:
                        brand_name = details.get("brand", "Unknown")
                        # Filter out bad scrapes where Name == Brand (common Incidecoder glitch)
                        if name.lower() == brand_name.lower():
                            continue
                        # Filter out very short names that are likely junk
                        if len(name) < 3:
                            continue
                            
                        # If name starts with brand, clean it up optionally? 
                        # No, let's keep it but ensure we don't return just the brand.
                        
                        products.append({
                            "name": name, # Standardize on "name" for internal passing/caching
                            "brand": brand_name, 
                            "link": product_url,
                            "image": details.get("image"),
                            "ingredients": details.get("ingredients", [])
                        })
            
            return products

        except Exception as e:
            print(f"Online search error: {e}")
            return []

    @staticmethod
    def _fetch_product_page_details(product_url):
        """
        Helper to fetch ingredients and image from a product page.
        """
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        try:
            response = httpx.get(product_url, headers=headers, timeout=10.0, follow_redirects=True)
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            
            ingredients = []
            
            # Strategy: Look for the specific ingredient links which have class "ingred-link"
            # This is more robust than looking for a specific container which changes ID/Class
            candidate_links = soup.find_all("a", class_="ingred-link")
            
            # Jargon to filter out
            jargon = {
                "ingredients", "learn more", "read more", "explain", 
                "show all ingredients", "click here", "geeky details", 
                "[more]", "more", "about the ingredients"
            }

            for link in candidate_links:
                # Double check it is an ingredient link
                href = link.get('href', '')
                if "/ingredients/" not in href:
                    continue

                text = link.get_text(strip=True)
                if not text:
                    continue
                
                text_lower = text.lower()
                
                # Filter jargon
                if any(j in text_lower for j in jargon):
                    continue
                
                # Filter out "Explain" boxes if they somehow got the class (unlikely but safe)
                if link.find_parent("div", class_="kbox"):
                    continue
                
                ingredients.append(text)
            
            # Deduplicate while preserving order
            seen = set()
            unique_ingredients = [x for x in ingredients if not (x in seen or seen.add(x))]
            
            # Image extraction
            image_url = None
            img_tag = soup.find("img", id="product-main-image")
            
            if not img_tag:
                 # Strategy 2: Look for picture tag in main area
                 picture = soup.find("picture")
                 if picture:
                     img_tag = picture.find("img")
            
            if not img_tag:
                # Strategy 3: Look for any image with src containing likely path
                img_tag = soup.find("img", src=lambda s: s and "incidecoder-content" in s)

            if img_tag:
                src = img_tag.get("src")
                if src:
                    if src.startswith("/"):
                        image_url = f"https://incidecoder.com{src}"
                    else:
                        image_url = src
            
            # Extract Brand
            brand_link = soup.find("a", href=lambda h: h and "/brands/" in h)
            brand = brand_link.get_text(strip=True) if brand_link else "Unknown"
            
            return {
                "image": image_url,
                "brand": brand,
                "ingredients": unique_ingredients
            }
        except Exception as e:
            print(f"Error fetching product details: {e}")
            return None

    @staticmethod
    def cache_product(product):
        """
        Saves a product to the local products.json file.
        """
        try:
            products = []
            if os.path.exists(PRODUCTS_FILE):
                try:
                    with open(PRODUCTS_FILE, "r") as f:
                        products = json.load(f)
                except json.JSONDecodeError:
                    products = []
            
            # Check if exists
            for p in products:
                if p.get("link") == product.get("link"):
                    return # Already cached
            
            # Append
            products.append(product)
            
            # Write back
            # Ensure dir exists
            os.makedirs(os.path.dirname(PRODUCTS_FILE), exist_ok=True)
            with open(PRODUCTS_FILE, "w") as f:
                json.dump(products, f, indent=4)
                
            print(f"Cached product locally: {product['name']}")
        except Exception as e:
            print(f"Error caching product: {e}")


    @staticmethod
    def fetch_ingredient_details(ingredient_name):
        """
        Fetches ingredient details from Incidecoder.
        Returns a dict with description, functions, and safety info if found.
        """
        # Normalize name for URL: lowercase, replace spaces with hyphens
        # e.g. "Niacinamide" -> "niacinamide", "Salicylic Acid" -> "salicylic-acid"
        slug = ingredient_name.lower().replace(" ", "-")
        url = f"{IncidecoderClient.BASE_URL}/{slug}"

        try:
            response = httpx.get(url, timeout=10.0, follow_redirects=True)
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            
            data = {
                "name": ingredient_name,
                "description": None,
                "functions": [],
                "quick_facts": []
            }

            # 1. Extract Description (usually in #showmore-section-ing or just the first p)
            # Incidecoder often has a "What It Is" section
            # We'll look for the first substantial paragraph in the content area
            
            # Try to find the "intro" text
            intro_div = soup.find("div", class_="fs-large")
            if intro_div:
                data["description"] = intro_div.get_text(strip=True)
            
            # 2. Extract Functions ("What-it-does")
            # Structure:
            # <div class="itemprop">
            #   <span class="label klavikab grey1">What-it-does: </span>
            #   <span class="value"><a ...>func</a>, ...</span>
            # </div>
            
            itemprops = soup.find_all("div", class_="itemprop")
            for prop in itemprops:
                label = prop.find("span", class_="label")
                if label and "What-it-does" in label.get_text():
                    value_span = prop.find("span", class_="value")
                    if value_span:
                        # Extract text from links or just the text
                        data["functions"] = [
                            text.strip() 
                            for text in value_span.get_text(separator=",").split(",") 
                            if text.strip()
                        ]

            # 3. Extract "Quick Facts"
            # Structure: <div id="showmore-section-quickfacts"> <ul class="starlist"> <li>...</li> </ul>
            quick_facts_section = soup.find("div", id="showmore-section-quickfacts")
            if quick_facts_section:
                starlist = quick_facts_section.find("ul", class_="starlist")
                if starlist:
                    data["quick_facts"] = [
                        li.get_text(strip=True) 
                        for li in starlist.find_all("li")
                    ]

            # 4. Extract "Geeky Details" / Irritancy (if separate)
            # Irritancy is often in the "Quick Facts" or separate, but let's check for "ir-score" again just in case
            ir_score = soup.find("div", class_="ir-score")
            if ir_score:
                 data["quick_facts"].append(f"Irritancy/Comedogenicity: {ir_score.get_text(strip=True)}")

            return data

        except Exception as e:
            print(f"Error fetching Incidecoder data for {ingredient_name}: {e}")
            return None

if __name__ == "__main__":
    # Test
    print(IncidecoderClient.fetch_ingredient_details("Niacinamide"))
