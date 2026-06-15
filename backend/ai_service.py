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

    from huggingface_hub.utils import HfHubHTTPError
    max_retries = 3
    for attempt in range(max_retries):
        try:
            embedding = client.feature_extraction(text, model="sentence-transformers/all-MiniLM-L6-v2")
            
            if hasattr(embedding, "tolist"):
                embedding = embedding.tolist()

            if isinstance(embedding, list) and len(embedding) > 0:
                if isinstance(embedding[0], list):
                    return embedding[0]
                return embedding
            
            print(f"Unexpected result format from HF: {type(embedding)}")
            return []
            
        except HfHubHTTPError as e:
            if hasattr(e, 'response') and e.response.status_code == 503:
                try:
                    data = e.response.json()
                    wait_time = data.get("estimated_time", 15.0)
                except:
                    wait_time = 15.0
                print(f"[AI] Model loading (503). Waiting {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(min(wait_time, 10))
                continue
            else:
                print(f"[AI] HTTP Error via Client: {e}")
                return []
        except Exception as e:
            print(f"AI API Error via Client: {e}")
            return []
            
    print("[AI] Failed to vectorize query after retries.")
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

    # Check if S3 is configured
    S3_BUCKET = os.getenv("S3_BUCKET_NAME")
    s3_key = f"resumes/{candidate_id}_{filename}"
    uploaded_to_s3 = False

    if S3_BUCKET:
        try:
            import boto3
            s3_client = boto3.client('s3')
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=file_bytes,
                ContentType='application/pdf'
            )
            uploaded_to_s3 = True
            print(f"[S3] Uploaded resume for candidate {candidate_id} to S3 bucket {S3_BUCKET}")
        except Exception as e:
            print(f"[S3] Error uploading to S3: {e}. Falling back to database/local file storage.")

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

    rel_path = s3_key if uploaded_to_s3 else os.path.join("uploads", "resumes", safe_filename).replace("\\", "/")

    payload = db.query(CandidateResumePayload).filter(CandidateResumePayload.candidate_id == candidate_id).first()
    if payload:
        payload.resume_path = rel_path
        payload.pdf_blob = None if uploaded_to_s3 else file_bytes # Save DB storage if uploaded to S3!
    else:
        payload = CandidateResumePayload(
            candidate_id=candidate_id, 
            resume_path=rel_path, 
            pdf_blob=None if uploaded_to_s3 else file_bytes
        )
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

        # Try file first, then fallback to DB stream, then S3 stream!
        pdf_bytes = payload.pdf_blob
        if not pdf_bytes:
            S3_BUCKET = os.getenv("S3_BUCKET_NAME")
            if S3_BUCKET and payload.resume_path:
                try:
                    import boto3
                    s3_client = boto3.client('s3')
                    response = s3_client.get_object(Bucket=S3_BUCKET, Key=payload.resume_path)
                    pdf_bytes = response['Body'].read()
                except Exception as e:
                    print(f"[BG] Error downloading from S3 for vectorization: {e}")

        raw_text = extract_text_from_pdf(pdf_path=file_path, pdf_stream=pdf_bytes)
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
        print(f"[AI] Search aborted: Query vectorization failed (check HF_TOKEN).")
        return [(c, 0.0) for c in candidates]

    results = []
    for c in candidates:
        payload = payload_map.get(c.id)
        if not payload or not payload.resume_embedding:
            results.append((c, 0.0))
            continue

        similarity = cosine_similarity(query_vector, payload.resume_embedding)
        # More generous scaling for human-readable percentages
        # Raw cosine of 0.2 now becomes ~48%
        boosted = similarity * 2.4
        match_score = max(0.5, min(100.0, boosted * 100)) # 0.5 baseline for data-integrity check
        results.append((c, round(match_score, 1)))

    results.sort(key=lambda x: x[1], reverse=True)
    return results

