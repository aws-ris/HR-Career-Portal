import sys
import os
sys.path.append(os.getcwd()) # Add current dir to path for imports

from backend.database.database import SessionLocal
from backend.database import models
from sqlalchemy import func

db = SessionLocal()
try:
    edu_query = db.query(
        models.CandidateMetadata.highest_education,
        func.count(models.CandidateMetadata.id)
    ).filter(
        models.CandidateMetadata.is_deleted == False
    ).group_by(models.CandidateMetadata.highest_education)
    
    print("--- RAW SQL ---")
    print(edu_query)
    
    print("\n--- RESULTS ---")
    results = edu_query.all()
    for r in results:
        print(f"Education: {r[0]}, Count: {r[1]}")
finally:
    db.close()
