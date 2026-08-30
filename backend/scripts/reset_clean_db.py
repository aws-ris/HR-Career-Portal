import sys
import os
import uuid
import datetime

# Add parent directory to sys.path so backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models import (
    CandidateMetadata, ApplicationTracking, ApplicationStatusHistory,
    CandidateSchooling, CandidateHigherEducation, CandidateWorkExperience,
    CandidatePublication, CandidateLinksAbout, CandidateResumePayload,
    TokenRegistry, JobPosting
)

def reset_db():
    print("🧹 RESETTING DATABASE: Clearing candidates and retaining 1 clean job posting...")
    db = SessionLocal()
    try:
        # Delete all candidate relations and applications
        db.query(ApplicationStatusHistory).delete()
        db.query(ApplicationTracking).delete()
        db.query(CandidateSchooling).delete()
        db.query(CandidateHigherEducation).delete()
        db.query(CandidateWorkExperience).delete()
        db.query(CandidatePublication).delete()
        db.query(CandidateLinksAbout).delete()
        db.query(CandidateResumePayload).delete()
        db.query(TokenRegistry).delete()
        db.query(CandidateMetadata).delete()
        db.query(JobPosting).delete()
        db.commit()

        # Create 1 clean active open job posting
        clean_job = JobPosting(
            id=str(uuid.uuid4()),
            title="Consultant (International Trade & G20 Policy)",
            position="Consultant",
            division="RIS",
            location="New Delhi, India",
            deadline=datetime.date(2026, 9, 30),
            description="Lead research initiatives focused on South-South cooperation, global value chains, and India's strategic positioning within the G20 framework. The role involves drafting policy briefs for senior government officials and participating in multilateral trade negotiations.",
            requirements="PhD in International Economics or Public Policy. Minimum 8 years of experience in trade data analysis. Proficiency in STATA/R and a proven track record of peer-reviewed publications is mandatory.",
            min_experience=8,
            max_experience=15,
            status="open",
            total_openings=2,
            is_deleted=False
        )
        db.add(clean_job)
        db.commit()
        db.refresh(clean_job)

        print("\n" + "=" * 65)
        print(" ✅ DATABASE RESET SUCCESSFULLY COMPLETED!")
        print("=" * 65)
        print(f" 📌 Active Jobs Remaining: 1")
        print(f"    - Title: '{clean_job.title}'")
        print(f"    - ID: {clean_job.id}")
        print(f" 👤 Total Candidates Remaining: 0")
        print(f" 📑 Total Applications Remaining: 0")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"❌ Error resetting database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
