
import os
from database.database import SessionLocal
from database import models
import ai_service

def run_diag():
    db = SessionLocal()
    print("=== AI SUBSYSTEM DIAGNOSTIC ===")
    
    # 1. Check HF Token
    token = os.getenv("HF_TOKEN")
    print(f"HF_TOKEN detected: {'YES' if token else 'NO'}")
    if token:
        print(f"Token Prefix: {token[:4]}...")
    
    # 2. Check Embeddings
    count = db.query(models.CandidateResumePayload).filter(models.CandidateResumePayload.resume_embedding != None).count()
    total = db.query(models.CandidateResumePayload).count()
    print(f"Candidates with Embeddings: {count}/{total}")
    
    # 3. Test Sample Embedding
    if count > 0:
        sample = db.query(models.CandidateResumePayload).filter(models.CandidateResumePayload.resume_embedding != None).first()
        emb = sample.resume_embedding
        print(f"Sample Embedding Length: {len(emb)}")
        print(f"Sample Embedding Values (First 5): {emb[:5]}")
        
        # 4. Test Query Vectorization
        print("Testing Query Vectorization ('Python developer')...")
        q_vec = ai_service.compute_embedding("Python developer")
        if q_vec:
            print(f"Query Vectorized Successfully! Length: {len(q_vec)}")
            # 5. Test Similarity
            sim = ai_service.cosine_similarity(q_vec, emb)
            print(f"Test Similarity Score: {sim:.4f}")
        else:
            print("FAILED: Query vectorization returned empty list.")
    
    db.close()

if __name__ == "__main__":
    run_diag()
