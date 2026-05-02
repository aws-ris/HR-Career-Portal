
import os
import sys
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database.database import SessionLocal
from database import models

db = SessionLocal()
jobs = db.query(models.JobPosting).all()
print("--- DATABASE DIAGNOSTIC ---")
for j in jobs:
    count = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.job_id == j.id).count()
    print(f"Job: {j.title} | ID: {j.id} | Applicants: {count}")

candidates = db.query(models.CandidateMetadata).all()
if candidates:
    print(f"\nTotal Candidates in DB: {len(candidates)}")
    first = candidates[0]
    print(f"Sample Candidate: {first.full_name} | JobID: {first.job_id}")
else:
    print("\nNO CANDIDATES FOUND IN DATABASE AT ALL.")
