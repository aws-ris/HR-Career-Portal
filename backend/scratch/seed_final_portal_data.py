import os
import sys
import fitz
from datetime import date, datetime
from sqlalchemy import text

# Add backend directory to python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from database.database import SessionLocal
import database.models as models
from utils.scoring import calculate_candidate_score
from ai_service import process_and_save_resume

UNIS = [
    "Jawaharlal Nehru University", 
    "Delhi School of Economics", 
    "IIT Delhi", 
    "IIT Bombay", 
    "Madras School of Economics", 
    "TISS Mumbai", 
    "LSE (London)", 
    "National University of Singapore"
]

def parse_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return None
        
    name = lines[0]
    email = ""
    mobile = ""
    
    for line in lines:
        if "Email:" in line:
            parts = line.split("|")
            for part in parts:
                if "Email:" in part:
                    email = part.replace("Email:", "").strip()
                if "Mobile:" in part:
                    mobile = part.replace("Mobile:", "").strip()
                    
    # Find sections
    edu_start = -1
    exp_start = -1
    pub_start = -1
    
    for idx, line in enumerate(lines):
        if line == "EDUCATION":
            edu_start = idx
        elif line == "PROFESSIONAL EXPERIENCE":
            exp_start = idx
        elif line == "SELECTED PUBLICATIONS":
            pub_start = idx
            
    # Extract Education
    education = []
    if edu_start != -1 and exp_start != -1:
        edu_lines = lines[edu_start+1:exp_start]
        i = 0
        while i < len(edu_lines):
            line = edu_lines[i]
            if "Ph.D." in line or "Master of" in line or "Bachelor of" in line:
                deg = line
                uni = ""
                dates = ""
                if i + 1 < len(edu_lines):
                    uni = edu_lines[i+1]
                if i + 2 < len(edu_lines):
                    dates = edu_lines[i+2]
                
                # Parse years
                start_yr, end_yr = 2011, 2014
                if "-" in dates:
                    parts = dates.split("-")
                    try:
                        start_yr = int(parts[0].strip())
                        end_yr = int(parts[1].strip())
                    except:
                        pass
                
                education.append({
                    "degree": deg,
                    "university": uni,
                    "start_year": start_yr,
                    "end_year": end_yr
                })
                i += 3
            else:
                i += 1
                
    # Extract Experience
    experience = []
    limit = pub_start if pub_start != -1 else len(lines)
    if exp_start != -1:
        exp_lines = lines[exp_start+1:limit]
        i = 0
        while i < len(exp_lines):
            line = exp_lines[i]
            if line in ["Policy Analyst / Consultant", "Research Intern"]:
                role = line
                company = ""
                dates = ""
                if i + 1 < len(exp_lines):
                    company = exp_lines[i+1]
                if i + 2 < len(exp_lines):
                    dates = exp_lines[i+2]
                
                start_yr, end_yr = 2016, 2017
                if "-" in dates:
                    parts = dates.split("-")
                    try:
                        start_yr = int(parts[0].strip())
                        end_yr = 2026 if "Present" in parts[1] else int(parts[1].strip())
                    except:
                        pass
                
                experience.append({
                    "role": role,
                    "company": company,
                    "start_year": start_yr,
                    "end_year": end_yr
                })
                i += 3
            else:
                i += 1
                
    return {
        "name": name,
        "email": email,
        "mobile": mobile,
        "education": education,
        "experience": experience
    }

def main():
    db = SessionLocal()
    try:
        print("1. Running database schema migrations locally...")
        migrations = [
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS min_pay INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS max_pay INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS min_experience INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS max_experience INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS contract_period INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS job_mode VARCHAR(50);",
            "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);",
            "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS age INTEGER;",
            "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS city VARCHAR(100);",
            "ALTER TABLE candidate_links_about ADD COLUMN IF NOT EXISTS extracurriculars TEXT;",
            "ALTER TABLE candidate_resume_payload ADD COLUMN IF NOT EXISTS pdf_blob BYTEA;",
            "ALTER TABLE application_status_history ADD COLUMN IF NOT EXISTS application_tracking_id VARCHAR(36);",
            "ALTER TABLE application_status_history ALTER COLUMN candidate_id DROP NOT NULL;",
            "ALTER TABLE application_tracking ADD COLUMN IF NOT EXISTS profile_score FLOAT;"
        ]
        for query in migrations:
            try:
                db.execute(text(query))
            except Exception as e:
                print(f"   Migration warning: {e}")
        db.commit()
        print("   Database schema upgraded.")

        print("\n2. Safely purging existing candidates and jobs for a clean setup...")
        # Wiping candidates (cascades to applications, experiences, resumes)
        db.query(models.CandidateMetadata).delete()
        # Wiping jobs
        db.query(models.JobPosting).delete()
        db.commit()
        print("   Database cleared successfully.")

        print("\n3. Creating 2 new check-constraint compliant Job Postings...")
        job1 = models.JobPosting(
            title="Professor (Trade & Investment Policy)",
            position="Professor",
            division="RIS",
            description="Join RIS as a Professor in the International Trade & G20 Policy division. This role involves leading policy-oriented research on WTO rules, regional trade agreements, global value chains, and economic cooperation in the G20 framework. The successful candidate will prepare policy briefs, draft academic papers, and liaise with government ministries and international organizations to shape trade policies in the Global South.",
            requirements="Ph.D. in Economics, International Trade, or Development Studies with minimum 3 years of relevant research/policy experience. Proven track record of publications in peer-reviewed journals, knowledge of econometrics (STATA/R), and policy advisory experience is highly desirable.",
            status="open",
            total_openings=2,
            location="New Delhi",
            deadline=date(2026, 12, 31),
            min_pay=90000,
            max_pay=120000,
            min_experience=3,
            max_experience=8,
            job_mode="On-site",
            is_deleted=False
        )
        db.add(job1)

        job2 = models.JobPosting(
            title="Research Assistant (Blue Economy & Coastal Management)",
            position="Research Assistant",
            division="CMEC",
            description="We are seeking a Research Assistant for the Blue Economy & CMEC division. The researcher will conduct qualitative and quantitative analyses on sustainable fisheries, ocean governance, maritime security, and regional connectivity in the Indo-Pacific and Indian Ocean Region (IORA). Responsibilities include organizing research workshops, data aggregation, and drafting policy recommendations for sustainable maritime resource management.",
            requirements="Master's degree in Marine Policy, Environmental Economics, Geography/GIS, or Public Policy with minimum 1 year of experience in research or data analysis. Familiarity with GIS mapping and maritime treaties/IORA frameworks is desirable.",
            status="open",
            total_openings=3,
            location="New Delhi",
            deadline=date(2026, 12, 31),
            min_pay=55000,
            max_pay=70000,
            min_experience=1,
            max_experience=4,
            job_mode="On-site",
            is_deleted=False
        )
        db.add(job2)
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        print(f"   Created Job 1: {job1.title} (ID: {job1.id})")
        print(f"   Created Job 2: {job2.title} (ID: {job2.id})")

        resume_dir = os.path.join(backend_dir, "test_resumes")
        pdf_files = sorted([f for f in os.listdir(resume_dir) if f.endswith(".pdf")], key=lambda x: int(x.split("_")[1]))

        print("\n4. Parsing and seeding 16 candidates matching resume files...")
        
        # 8 Candidates for Job 1 (CV 1 to 8)
        # 8 Candidates for Job 2 (CV 9 to 16)
        job_assignment = [(job1, pdf_files[0:8]), (job2, pdf_files[8:16])]

        for job, files in job_assignment:
            print(f"\nSeeding 8 candidates for job: {job.title} (Min Exp: {job.min_experience} yrs)")
            for rf in files:
                pdf_path = os.path.join(resume_dir, rf)
                data = parse_pdf(pdf_path)
                if not data:
                    print(f"   Error parsing {rf}")
                    continue

                # Calculate total experience years from experience entries
                total_exp = 0.0
                for exp in data['experience']:
                    duration = exp['end_year'] - exp['start_year']
                    total_exp += max(1.0, float(duration))

                # Insert Candidate Metadata
                candidate = models.CandidateMetadata(
                    full_name=data['name'],
                    email=data['email'],
                    mobile_no=data['mobile'],
                    gender="Female" if "meera" in data['name'].lower() or "ayesha" in data['name'].lower() or "nisha" in data['name'].lower() or "priya" in data['name'].lower() or "riya" in data['name'].lower() or "ishani" in data['name'].lower() else "Male",
                    dob=date(1992, 5, 15),
                    years_of_experience=total_exp,
                    city="New Delhi",
                    state="Delhi",
                    pincode="110003"
                )
                db.add(candidate)
                db.flush()  # Gen ID

                # Insert Links & About
                links = models.CandidateLinksAbout(
                    candidate_id=candidate.id,
                    about=f"Policy researcher specializing in {job.division} thematic areas.",
                    extracurriculars="Active member of policy debate groups and lead author of local community development papers."
                )
                db.add(links)

                # Insert Schooling (standard realistic marks)
                schooling = models.CandidateSchooling(
                    candidate_id=candidate.id,
                    class_x_school="Secondary High School",
                    class_x_board="CBSE",
                    class_x_score_type="Percentage",
                    class_x_score_value=86.5,
                    class_xii_school="Senior Secondary School",
                    class_xii_board="CBSE",
                    class_xii_score_type="Percentage",
                    class_xii_score_value=88.2
                )
                db.add(schooling)

                # Insert Higher Educations
                for deg_data in data['education']:
                    deg_level = "undergrad"
                    if "Ph.D." in deg_data['degree']:
                        deg_level = "phd"
                    elif "Master" in deg_data['degree']:
                        deg_level = "postgrad"
                    
                    score_val = 8.5 if deg_level == "phd" else (8.0 if deg_level == "postgrad" else 7.5)
                    edu = models.CandidateHigherEducation(
                        candidate_id=candidate.id,
                        level=deg_level,
                        degree_name=deg_data['degree'],
                        university=deg_data['university'],
                        score_type="CGPA",
                        score_value=score_val,
                        grad_year=deg_data['end_year'],
                        entry_order=1 if deg_level == "phd" else (2 if deg_level == "postgrad" else 3)
                    )
                    db.add(edu)

                # Insert Work Experiences
                for idx, exp_data in enumerate(data['experience']):
                    start_date = date(exp_data['start_year'], 1, 1)
                    end_date = date(exp_data['end_year'], 12, 31) if exp_data['end_year'] <= 2026 else None
                    work = models.CandidateWorkExperience(
                        candidate_id=candidate.id,
                        company_name=exp_data['company'],
                        role=exp_data['role'],
                        start_date=start_date,
                        end_date=end_date,
                        is_current=(end_date is None),
                        entry_order=idx + 1
                    )
                    db.add(work)

                # Calculate Candidate Score out of 85 marks
                # Temporarily attach dependencies to candidate object so calculator can read them
                candidate.schooling = schooling
                candidate.higher_education = [e for e in db.new if isinstance(e, models.CandidateHigherEducation) and e.candidate_id == candidate.id]
                
                score_res = calculate_candidate_score(candidate, min_experience=job.min_experience)

                # Insert Application Tracking
                app_track = models.ApplicationTracking(
                    candidate_id=candidate.id,
                    job_id=job.id,
                    position_applied=job.position,
                    admin_department=job.division,
                    current_status="received",
                    profile_score=score_res["total_score"]
                )
                db.add(app_track)
                db.flush()

                # Insert Application Status History
                history = models.ApplicationStatusHistory(
                    application_tracking_id=app_track.id,
                    status="received",
                    changed_by="SYSTEM",
                    notes="Application received and scored automatically by ATS."
                )
                db.add(history)

                # Read PDF file bytes and upload/save resume
                with open(pdf_path, "rb") as f:
                    pdf_bytes = f.read()
                
                # Calls our robust function from ai_service.py which handles both S3 and local storage fallbacks!
                process_and_save_resume(db, candidate.id, pdf_bytes, rf)

                print(f"   Seeded Candidate: {candidate.full_name} | Score: {score_res['total_score']} | Exp: {total_exp} yrs | CV: {rf}")
        
        db.commit()
        print("\n Seeding completed successfully. 2 Jobs and 16 candidates populated matching CV PDF text.")

    except Exception as e:
        db.rollback()
        print(f"\n Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
