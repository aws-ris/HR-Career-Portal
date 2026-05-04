import os
import fitz  # PyMuPDF
import requests
import time
from sqlalchemy.orm import Session
from database.models import CandidateMetadata, CandidateResumePayload, ApplicationTracking
import uuid

from huggingface_hub import InferenceClient

# Load token from environment
HF_TOKEN = os.getenv("HF_TOKEN")
client = InferenceClient(api_key=HF_TOKEN) if HF_TOKEN else None

def compute_embedding(text: str) -> list:
    """
    Computes embedding using Hugging Face Inference API via InferenceClient.
    """
    if not text or not text.strip():
        return []
    
    if not client:
        print("Warning: HF_TOKEN not found or client not initialized. AI search will return zero matches.")
        return []

    try:
        # feature_extraction returns a list of floats or a numpy array
        embedding = client.feature_extraction(
            text, 
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Handle if it comes back as a numpy-like object
        if hasattr(embedding, "tolist"):
            embedding = embedding.tolist()

        if isinstance(embedding, list) and len(embedding) > 0:
            # Flatten if nested (batch of 1)
            if isinstance(embedding[0], list):
                return embedding[0]
            return embedding
        
        print(f"Unexpected result format from HF: {type(embedding)}")
        return []
    except Exception as e:
        print(f"AI API Error via Client: {e}")
        return []

def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    Basic python implementation of cosine similarity to avoid heavy numpy dependency in production.
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = sum(a * a for a in vec1) ** 0.5
    norm_b = sum(b * b for b in vec2) ** 0.5
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def extract_text_from_pdf(pdf_path: str = None, pdf_stream: bytes = None) -> str:
    text = ""
    try:
        if pdf_path and os.path.exists(pdf_path):
            with fitz.open(pdf_path) as doc:
                for page in doc:
                    text += page.get_text("text") + "\n"
        elif pdf_stream:
            with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text("text") + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text.strip()

def process_and_save_resume(db: Session, candidate_id: str, file_bytes: bytes, filename: str):
    candidate = db.query(CandidateMetadata).filter(CandidateMetadata.id == candidate_id).first()
    if not candidate:
        raise ValueError(f"Candidate {candidate_id} not found")

    # Local save (fallback/legacy)
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads", "resumes")
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"{candidate_id}_{filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except:
        pass # Vercel might deny write access in some contexts

    rel_path = os.path.join("uploads", "resumes", safe_filename).replace("\\", "/")

    payload = db.query(CandidateResumePayload).filter(CandidateResumePayload.candidate_id == candidate_id).first()
    if payload:
        payload.resume_path = rel_path
        payload.pdf_blob = file_bytes # STORE IN DB
    else:
        payload = CandidateResumePayload(candidate_id=candidate_id, resume_path=rel_path, pdf_blob=file_bytes)
        db.add(payload)

    db.commit()
    return rel_path, file_path

def background_vectorize_resume(candidate_id: str, file_path: str):
    from database.database import SessionLocal
    db = SessionLocal()
    try:
        payload = db.query(CandidateResumePayload).filter(CandidateResumePayload.candidate_id == candidate_id).first()
        if not payload:
            return

        # Try file first, then fallback to DB stream
        raw_text = extract_text_from_pdf(pdf_path=file_path, pdf_stream=payload.pdf_blob)
        # Limit text for API if necessary, but MiniLM handles up to 512 tokens
        embedding = compute_embedding(raw_text[:2000]) 

        payload.raw_resume_text = raw_text
        payload.resume_embedding = embedding

        db.commit()
        print(f"[BG] API Vectorization complete for {candidate_id}")
    except Exception as e:
        print(f"[BG] API Vectorization error: {e}")
        db.rollback()
    finally:
        db.close()

def semantic_search_candidates(db: Session, job_id: str, query: str, threshold: float = 0.0) -> list:
    app_rows = db.query(ApplicationTracking.candidate_id).filter(
        ApplicationTracking.job_id == job_id
    ).all()
    candidate_ids = [r[0] for r in app_rows]

    if not candidate_ids:
        return []

    payloads = db.query(CandidateResumePayload).filter(
        CandidateResumePayload.candidate_id.in_(candidate_ids)
    ).all()
    payload_map = {p.candidate_id: p for p in payloads}

    candidates = db.query(CandidateMetadata).filter(
        CandidateMetadata.id.in_(candidate_ids)
    ).all()

    if not query.strip():
        return [(c, 100.0) for c in candidates]

    query_vector = compute_embedding(query)
    if not query_vector:
        return [(c, 0.0) for c in candidates]

    results = []
    for c in candidates:
        payload = payload_map.get(c.id)
        if not payload or not payload.resume_embedding:
            results.append((c, 0.0))
            continue

        similarity = cosine_similarity(query_vector, payload.resume_embedding)
        boosted = similarity * 2.5
        match_score = max(0.0, min(100.0, boosted * 100))
        results.append((c, round(match_score, 1)))

    results.sort(key=lambda x: x[1], reverse=True)
    return results

