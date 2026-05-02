import uuid
from datetime import datetime, date
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import CandidateMetadata, JobPosting
from ai_service import process_and_save_resume

def inject_ai_candidate():
    db: Session = SessionLocal()
    
    # 1. Find or Create a Tech Job
    job = db.query(JobPosting).filter(JobPosting.id == 'ec761c44-d68c-4f38-83eb-1b2bb888dbca').first()
    if not job:
        print("Job not found!")
        return
    
    c_id = str(uuid.uuid4())
    print(f"Creating candidate: {c_id} for job: {job.title}")

    # 2. Create Candidate Metadata
    candidate = CandidateMetadata(
        id=c_id,
        job_id=job.id,
        position_applied=job.title,
        full_name="Alex Mercer (AI Test)",
        email="alex.mercer.ai@example.com",
        mobile_number="9988776655",
        dob=date(1990, 5, 15),
        gender="Male",
        state="Karnataka",
        highest_education="Bachelors",
        total_experience_years=5.5,
        current_status='received'
    )
    db.add(candidate)
    db.commit()

    # 3. Process Resume
    pdf_path = r"c:\Users\Viraal\Desktop\HRForm\Resume-Sample-1-Software-Engineer.pdf"
    print(f"Reading PDF from: {pdf_path}")
    
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
            
        print("Processing AI extraction and embedding... (this takes a few seconds on first run)")
        saved_path = process_and_save_resume(db, c_id, pdf_bytes, "Resume-Sample-1-Software-Engineer.pdf")
        
        print(f"Successfully processed! Resume saved to: {saved_path}")
        
        # Verify
        db.refresh(candidate)
        print(f"Extracted {len(candidate.raw_resume_text)} characters.")
        print(f"Embedding size: {len(candidate.resume_embedding) if candidate.resume_embedding else 0} dimensions.")
        
    except Exception as e:
        print(f"Failed to process resume: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inject_ai_candidate()
