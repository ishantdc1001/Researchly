import os
import numpy as np
from typing import List, Dict, Any

# Try importing FAISS and sentence_transformers; provide robust lightweight fallback
try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False


class ConferenceVectorStore:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.encoder = None
        self.index = None
        self.conferences: List[Dict[str, Any]] = []
        self.dimension = 384  # standard for all-MiniLM-L6-v2

        if HAS_TRANSFORMERS:
            try:
                print(f"Loading transformer model '{model_name}'...")
                self.encoder = SentenceTransformer(model_name)
                self.dimension = self.encoder.get_sentence_embedding_dimension()
                print(f"[OK] SentenceTransformer model ready (dim={self.dimension})")
            except Exception as e:
                print(f"[WARN] Transformer initialization notice: {e}. Fallback active.")
                self.encoder = None

        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dimension)  # Inner Product (Cosine on normalized vectors)
            print(f"[OK] FAISS IndexFlatIP initialized.")
        else:
            print("[INFO] FAISS optional library. Using high-speed NumPy cosine vector matching fallback.")
            self.vectors = None

    def _fallback_embed(self, text: str) -> np.ndarray:
        """Lightweight token hashing embedder if transformer is not loaded."""
        words = text.lower().split()
        vec = np.zeros(self.dimension, dtype=np.float32)
        for w in words:
            h = hash(w) % self.dimension
            vec[h] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        if self.encoder:
            embeddings = self.encoder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.astype(np.float32)
        else:
            return np.array([self._fallback_embed(t) for t in texts], dtype=np.float32)

    def index_conferences(self, conferences: List[Dict[str, Any]]):
        if not conferences:
            return

        self.conferences = conferences
        descriptions = [
            f"{c.get('name', '')} ({c.get('acronym', '')}) - {c.get('publisher', '')}: {c.get('description', '')} Topics: {', '.join(c.get('topics', []))}"
            for c in conferences
        ]

        vectors = self.embed_texts(descriptions)

        if HAS_FAISS and self.index is not None:
            self.index.reset()
            self.index.add(vectors)
            print(f"[OK] FAISS indexed {len(conferences)} conferences.")
        else:
            self.vectors = vectors
            print(f"[OK] NumPy vector store indexed {len(conferences)} conferences.")

    def search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        if not self.conferences:
            return []

        query_vec = self.embed_texts([query])

        if HAS_FAISS and self.index is not None and self.index.ntotal > 0:
            scores, indices = self.index.search(query_vec, min(top_k, len(self.conferences)))
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx >= 0 and idx < len(self.conferences):
                    conf = dict(self.conferences[idx])
                    conf["similarity_score"] = float(score)
                    results.append(conf)
            return results
        elif hasattr(self, "vectors") and self.vectors is not None:
            # Cosine similarity via dot product
            scores = np.dot(self.vectors, query_vec[0])
            top_indices = np.argsort(scores)[::-1][:top_k]
            results = []
            for idx in top_indices:
                conf = dict(self.conferences[idx])
                conf["similarity_score"] = float(scores[idx])
                results.append(conf)
            return results
        else:
            return self.conferences[:top_k]
