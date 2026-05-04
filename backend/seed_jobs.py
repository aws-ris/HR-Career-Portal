
import sys
import os
from datetime import date, timedelta

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.database import SessionLocal
from backend.database import models
from backend.schemas import PositionType, DivisionType, JobStatus

def seed_jobs():
    db = SessionLocal()
    try:
        print("🌱 Starting Job Seeding for RIS...")
        
        jobs = [
            {
                "title": "Consultant (International Trade & G20 Policy)",
                "position": PositionType.Consultant,
                "division": DivisionType.RIS,
                "location": "New Delhi, India",
                "status": JobStatus.open,
                "total_openings": 2,
                "deadline": date.today() + timedelta(days=30),
                "description": "Lead research initiatives focused on South-South cooperation, global value chains, and India's strategic positioning within the G20 framework. The role involves drafting policy briefs for senior government officials and participating in multilateral trade negotiations.",
                "requirements": "PhD in International Economics or Public Policy. Minimum 8 years of experience in trade data analysis. Proficiency in STATA/R and a proven track record of peer-reviewed publications is mandatory."
            },
            {
                "title": "Consultant (Blue Economy & Maritime Security)",
                "position": PositionType.Consultant,
                "division": DivisionType.CMEC,
                "location": "New Delhi / Remote",
                "status": JobStatus.open,
                "total_openings": 1,
                "deadline": date.today() + timedelta(days=25),
                "description": "Provide strategic consulting for the Connectivity and Maritime Economic Cooperation (CMEC) division. Focus areas include IORA frameworks, sustainable fisheries, and maritime connectivity projects in the Indo-Pacific region.",
                "requirements": "Advanced degree in Strategic Studies or Marine Policy. 10+ years of advisory experience with international organizations. Strong network within maritime security circles is preferred."
            },
            {
                "title": "Research Assistant (Traditional Medicine Systems)",
                "position": PositionType.Research_Assistant,
                "division": DivisionType.FITM,
                "location": "New Delhi, India",
                "status": JobStatus.open,
                "total_openings": 3,
                "deadline": date.today() + timedelta(days=15),
                "description": "Support the Forum for Indian Traditional Medicine (FITM) in documenting global health protocols and the integration of AYUSH systems into mainstream healthcare. Responsibilities include secondary data collection and organizing stakeholder consultations.",
                "requirements": "Master's degree in Public Health, Botany, or Social Sciences. Strong interest in traditional knowledge systems. Excellent writing skills and ability to synthesize complex data into reports."
            },
            {
                "title": "Research Assistant (ASEAN-India Regional Integration)",
                "position": PositionType.Research_Assistant,
                "division": DivisionType.AIC,
                "location": "New Delhi, India",
                "status": JobStatus.open,
                "total_openings": 2,
                "deadline": date.today() + timedelta(days=20),
                "description": "Assist the ASEAN-India Centre (AIC) in monitoring regional trade agreements and connectivity corridors. The candidate will work on building a comprehensive database of bilateral investment treaties between India and SE Asian nations.",
                "requirements": "Master's in International Relations or Economics. Proficiency in data visualization tools (Tableau/PowerBI). Prior experience in regional studies or diplomacy is a plus."
            },
            {
                "title": "Research Assistant (Development Finance & Debt Sustainability)",
                "position": PositionType.Research_Assistant,
                "division": DivisionType.DAKSHIN,
                "location": "New Delhi, India",
                "status": JobStatus.open,
                "total_openings": 1,
                "deadline": date.today() + timedelta(days=45),
                "description": "Contribute to the DAKSHIN initiative by analyzing debt sustainability frameworks for Least Developed Countries (LDCs). The role involves quantitative modeling of multilateral financing trends and infrastructure funding gaps.",
                "requirements": "Master's in Finance or Econometrics. Strong quantitative skills and familiarity with IMF/World Bank data repositories. Ability to work in a fast-paced, high-pressure policy environment."
            }
        ]

        for job_data in jobs:
            # Check if job already exists to avoid duplicates
            existing = db.query(models.JobPosting).filter(models.JobPosting.title == job_data["title"]).first()
            if not existing:
                job = models.JobPosting(**job_data)
                db.add(job)
                print(f"✅ Created: {job_data['title']}")
            else:
                print(f"⏭️ Skipping (Exists): {job_data['title']}")
        
        db.commit()
        print("\n✨ Successfully seeded 5 detailed Job Postings!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding jobs: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_jobs()
