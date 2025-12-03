import requests
import json

def test_routine_endpoint():
    url = "http://localhost:8000/analyze-routine"
    payload = {
        "products": [
            {
                "name": "Nivea Soft",
                "ingredients": ["Water", "Glycerin", "Myristyl Alcohol", "Alcohol Denat.", "Myristyl Myristate", "Glyceryl Stearate", "Coco-Caprylate/Caprate"]
            },
            {
                "name": "Oat & Ceramide Cream",
                "ingredients": ["Water", "Glycerin", "Caprylic/Capric Triglyceride", "Cetearyl Alcohol", "Avena Sativa (Oat) Kernel Flour", "Ceramide NP"]
            }
        ]
    }
    
    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_routine_endpoint()
