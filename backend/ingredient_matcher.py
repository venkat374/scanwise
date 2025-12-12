import json
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class IngredientMatcher:
    def __init__(self, db_path="data/ingredients_db.json"):
        self.db_path = os.path.join(os.path.dirname(__file__), db_path)
        self.ingredients_db = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.names_list = []
        self.index_map = [] # Maps matrix index back to db entry
        
        self._load_db()
        self._train_vectorizer()

    def _load_db(self):
        """Loads the ingredients database from JSON."""
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                self.ingredients_db = json.load(f)
        except FileNotFoundError:
            print(f"Warning: Database not found at {self.db_path}")
            self.ingredients_db = []

    def _train_vectorizer(self):
        """Trains TF-IDF vectorizer on ingredient names and synonyms."""
        corpus = []
        self.index_map = []
        
        for entry in self.ingredients_db:
            # Add primary name
            corpus.append(entry["name"].lower())
            self.index_map.append(entry)
            
            # Add synonyms
            for synonym in entry.get("synonyms", []):
                corpus.append(synonym.lower())
                self.index_map.append(entry)
        
        if corpus:
            self.vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4))
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        else:
            print("Warning: Empty corpus, vectorizer not trained.")

    def match(self, query, threshold=0.6):
        """
        Finds the best match for a query string.
        Returns the DB entry dict or None if no match found above threshold.
        """
        if not self.vectorizer or not query:
            return None

        query_vec = self.vectorizer.transform([query.lower()])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]
        
        if best_score >= threshold:
            return {
                "match": self.index_map[best_idx],
                "score": float(best_score),
                "original_query": query
            }
        
        return None

# Singleton instance for easy import
matcher = IngredientMatcher()
