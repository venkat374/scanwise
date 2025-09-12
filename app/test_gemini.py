# app/test_gemini.py — robust .env loader + Gemini Flash 2.0 test
from pathlib import Path
from dotenv import load_dotenv
import os
import sys

# Locate project root relative to this file: assume project_root /app/test_gemini.py
THIS_FILE = Path(__file__).resolve()
PROJECT_ROOT = THIS_FILE.parent.parent  # adjust if your layout differs
DOTENV_PATH = PROJECT_ROOT / ".env"

print("Looking for .env at:", DOTENV_PATH)
# load dotenv from explicit path so we don't depend on current working directory
if DOTENV_PATH.exists():
    load_dotenv(dotenv_path=str(DOTENV_PATH))
    print(".env loaded")
else:
    print("WARNING: .env not found at expected path:", DOTENV_PATH)
    print("You can create a .env in the project root with GEMINI_API_KEY=your_key")

# read key and sanitize
raw_key = os.getenv("GEMINI_API_KEY")
if raw_key is None:
    print("GEMINI_API_KEY not found in environment after loading .env.")
    print("Current environment variables (sample):", [k for k in os.environ.keys() if "GEMINI" in k.upper()][:10])
    sys.exit(2)

# strip whitespace and optional quotes
key = raw_key.strip()
if (key.startswith('"') and key.endswith('"')) or (key.startswith("'") and key.endswith("'")):
    key = key[1:-1].strip()

# safe preview
preview = key[-8:] if len(key) > 8 else key
print("GEMINI_API_KEY preview (last 8 chars):", preview)

# Now test Gemini call
try:
    import google.generativeai as genai
except Exception as e:
    print("Import error:", e)
    raise

try:
    genai.configure(api_key=key)
except Exception as e:
    # configure may be optional depending on client version, but we try it
    print("genai.configure() raised:", type(e).__name__, str(e))

try:
    model = genai.GenerativeModel("gemini-2.0-flash")
    resp = model.generate_content("Say hello from Gemini (flash 2.0).", generation_config={"max_output_tokens": 50})
    print("SUCCESS — resp.text:", getattr(resp, "text", None))
except Exception as ex:
    print("Gemini call failed:", type(ex).__name__, str(ex))
    # If you get API_KEY_INVALID here, it means the key you loaded is not valid for the API
    # (wrong key, restricted, or the API not enabled for the project).
    sys.exit(3)
