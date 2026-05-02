import uuid
import datetime
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import JobPosting, CandidateMetadata
import ai_service

def inject_multiple():
    db: Session = SessionLocal()
    
    # 1. Use the same Job
    job = db.query(JobPosting).filter(JobPosting.id == 'ec761c44-d68c-4f38-83eb-1b2bb888dbca').first()
    if not job:
        print("Job not found!")
        return
    
    candidates_to_add = [
        {
            "name": "Sarah Connor (AI Test 2)",
            "email": "sarah.connor@example.com",
            "gender": "Female",
            "resume": "../Resume-Sample-3-Computer-Science.pdf"
        },
        {
            "name": "Miles Dyson (AI Test 3)",
            "email": "m.dyson@example.com",
            "gender": "Male",
            "resume": "../Resume-Sample-4-Science.pdf"
        }
    ]

    for cdata in candidates_to_add:
        c_id = str(uuid.uuid4())
        print(f"Creating candidate: {c_id} for job: {job.title} using resume: {cdata['resume']}")
        
        new_c = CandidateMetadata(
            id=c_id,
            job_id=job.id,
            full_name=cdata["name"],
            email=cdata["email"],
            mobile_number="555-0100",
            dob=datetime.date(1990, 5, 20),
            gender=cdata["gender"],
            state="California",
            highest_education="Masters",
            current_status="received",
            total_experience_years=4.0
        )
        db.add(new_c)
        db.commit()
        
        # Open and process the PDF
        try:
            with open(cdata["resume"], "rb") as f:
                pdf_bytes = f.read()
            print(f"Reading PDF from: {cdata['resume']}")
            ai_service.process_and_save_resume(db, c_id, pdf_bytes, cdata["resume"].split('/')[-1])
            print("Successfully processed and saved!")
        except Exception as e:
            print(f"Failed to process PDF: {e}")

if __name__ == "__main__":
    inject_multiple()
