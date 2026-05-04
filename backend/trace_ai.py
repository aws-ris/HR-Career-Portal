
import os
from database.database import SessionLocal
from database import models
import ai_service

def trace():
    db = SessionLocal()
    # 1. Get a candidate who HAS an embedding
    sample = db.query(models.CandidateResumePayload).filter(models.CandidateResumePayload.resume_embedding != None).first()
    if not sample:
        print("FAIL: No candidates with embeddings found.")
        return

    meta = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.id == sample.candidate_id).first()
    print(f"Tracing Candidate: {meta.full_name} ({meta.id})")
    
    # 2. Test common queries
    queries = ["Research Assistant", "Python Developer", "Professor", "Ph.D."]
    
    for q in queries:
        print(f"\nQuery: '{q}'")
        q_vec = ai_service.compute_embedding(q)
        if not q_vec:
            print("  FAIL: Query vectorization failed.")
            continue
            
        raw_sim = ai_service.cosine_similarity(q_vec, sample.resume_embedding)
        print(f"  Raw Similarity: {raw_sim:.6f}")
        
        boosted = raw_sim * 2.2
        final = max(0.0, min(100.0, boosted * 100))
        print(f"  Final Score (Boosted): {final:.1f}%")

    db.close()

if __name__ == "__main__":
    trace()
