
from database.database import SessionLocal
from database import models
import traceback

db = SessionLocal()
try:
    print("Checking JobPosting...")
    jobs = db.query(models.JobPosting).count()
    print(f"Jobs: {jobs}")
    
    print("Checking CandidateMetadata...")
    candidates = db.query(models.CandidateMetadata).count()
    print(f"Candidates: {candidates}")
    
except Exception as e:
    print("ERROR DETECTED:")
    print(str(e))
    traceback.print_exc()
finally:
    db.close()
