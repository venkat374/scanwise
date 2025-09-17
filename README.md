### ScanWise: Cosmetic Toxicity Predictor + Chat 🧴

ScanWise is a Streamlit application designed to help users analyze cosmetic products. It can identify potentially harmful ingredients, suggest safer alternatives based on ingredient similarity, and provide a chatbot interface for answering product-related questions. The chat feature uses the Gemini Flash 2.0 API, with an optional local fallback for simple queries.

#### Features

-   **Product Lookup**: Search for cosmetics by name and view their ingredients.
-   **Toxicity Flagging**: Automatically flags products containing a predefined list of potentially harmful ingredients.
-   **Safe Alternatives**: Recommends similar products from the dataset that do not contain flagged ingredients, using a cosine similarity model.
-   **Interactive Chat**: Ask questions about a selected product's suitability for different skin types, potential irritants, or other concerns. The chat is powered by the Gemini API.
-   **t-SNE Visualization**: A 2D visualization of product similarity, helping to understand how products with different ingredient profiles are clustered.

#### Prerequisites

To run this app, you'll need **Python 3.8+**.

#### Setup and Installation

1.  **Clone the repository** or download the project files.
2.  **Navigate to the project directory** in your terminal.
3.  **Create and activate a virtual environment** (recommended):

    ```sh
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

4.  **Install the required packages** using the `requirements.txt` file:

    ```sh
    pip install -r requirements.txt
    ```

#### Configuration

This app uses the **Gemini API** for its chat functionality. You must get an API key and save it in a `.env` file.

1.  **Get a Gemini API Key**: Visit the [Google AI Studio](https://aistudio.google.com/app/apikey) and create a new API key.
2.  **Create a `.env` file**: In the **root directory of the project** (the same folder as `app/`), create a file named `.env`.
3.  **Add your API key** to the `.env` file in the following format:

    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

4.  **Optional**: To disable the local fallback chat feature, you can edit the `FALLBACK_ENABLED` variable in the `app/streamlit_app.py` file from `True` to `False`.
5.  **Optional**: To test the API key, use the ```test_gemini.py``` file to test the API key. The output should be a response from Gemini.

#### How to Run the App

After setting up your environment and configuring the API key, run the app from your terminal using Streamlit:

```sh
streamlit run app/streamlit_app.py
