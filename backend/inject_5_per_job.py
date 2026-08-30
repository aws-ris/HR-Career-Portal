import sys
import os
import random
from datetime import date, datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal, engine
from database import models
from utils.scoring import calculate_candidate_score

def inject_candidates():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("🌱 Starting 5 Candidates per Job Injection...")
        
        jobs = db.query(models.JobPosting).filter(models.JobPosting.is_deleted == False).all()
        if not jobs:
            print("⚠️ No job postings found. Seeding jobs first...")
            from seed_jobs import seed_jobs
            seed_jobs()
            jobs = db.query(models.JobPosting).filter(models.JobPosting.is_deleted == False).all()
            
        print(f"📋 Found {len(jobs)} active job postings.")

        # Candidate names & data pools for diverse backgrounds
        names = [
            ("Ananya Sharma", "Female"), ("Rohan Verma", "Male"), ("Priya Nair", "Female"), ("Vikram Sengupta", "Male"), ("Sneha Kulkarni", "Female"),
            ("Aarav Mehta", "Male"), ("Meera Deshmukh", "Female"), ("Aditya Roy", "Male"), ("Kavya Reddy", "Female"), ("Tushar Saxena", "Male"),
            ("Divya Iyer", "Female"), ("Siddharth Rao", "Male"), ("Ishita Banerjee", "Female"), ("Karan Malhotra", "Male"), ("Nidhi Patel", "Female"),
            ("Varun Kapoor", "Male"), ("Pooja Joshi", "Female"), ("Abhinav Pandey", "Male"), ("Tanvi Agarwal", "Female"), ("Rahul Bhatia", "Male"),
            ("Ritu Choudhury", "Female"), ("Amitav Ghosh", "Male"), ("Sanya Das", "Female"), ("Harshvardhan Singh", "Male"), ("Deepika Pillai", "Female")
        ]

        cities_states = [
            ("New Delhi", "Delhi", "110001"), ("Mumbai", "Maharashtra", "400001"),
            ("Bengaluru", "Karnataka", "560001"), ("Chennai", "Tamil Nadu", "600001"),
            ("Kolkata", "West Bengal", "700001"), ("Hyderabad", "Telangana", "500001"),
            ("Pune", "Maharashtra", "411001"), ("Ahmedabad", "Gujarat", "380001")
        ]

        universities = [
            "Jawaharlal Nehru University (JNU)", "Delhi School of Economics (DSE)", "IIT Delhi",
            "University of Hyderabad", "Tata Institute of Social Sciences (TISS)", "St. Xavier's College, Mumbai",
            "Madras School of Economics", "Indian Institute of Foreign Trade (IIFT)", "Ashoka University"
        ]

        companies = [
            "NITI Aayog", "NIPFP", "ICRIER", "Observer Research Foundation (ORF)", "CPR India",
            "RIS", "KPMG India", "Ernst & Young (EY)", "World Bank India", "ADB South Asia"
        ]

        sample_pdf_bytes = b"%PDF-1.4 %--- Sample Candidate PDF Resume Content for Testing ---%"

        idx = 0
        total_injected = 0

        for job in jobs:
            print(f"\n🎯 Injecting 5 candidates for Job: '{job.title}'...")
            
            for i in range(5):
                name, gender = names[idx % len(names)]
                city, state, pincode = cities_states[idx % len(cities_states)]
                email = f"{name.lower().replace(' ', '.')}.{job.id[:4]}.{i+1}@policy-res.in"
                
                # Check existing
                existing = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.email == email).first()
                if existing:
                    print(f"⏭️ Candidate '{name}' ({email}) already exists. Skipping.")
                    idx += 1
                    continue

                # Varied DOB & Experience
                birth_year = random.randint(1988, 1999)
                dob = date(birth_year, random.randint(1, 12), random.randint(1, 28))
                today = date.today()
                calculated_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                years_exp = round(random.uniform(1.5, 12.0), 1)
                last_salary = round(random.uniform(5.0, 24.0), 1)

                # 1. Candidate Metadata
                candidate = models.CandidateMetadata(
                    full_name=name,
                    email=email,
                    country_code="+91",
                    mobile_no=f"9{random.randint(100000000, 999999999)}",
                    dob=dob,
                    age=calculated_age,
                    gender=gender,
                    city=city,
                    state=state,
                    pincode=pincode,
                    years_of_experience=years_exp,
                    last_salary=last_salary
                )
                db.add(candidate)
                db.flush()

                # 2. Links & About
                db.add(models.CandidateLinksAbout(
                    candidate_id=candidate.id,
                    about=f"Experienced researcher specializing in {job.division} policy and analytical research.",
                    sop=f"I am applying for {job.title} to contribute quantitative policy research expertise to RIS.",
                    google_scholar=f"https://scholar.google.com/citations?user={name.lower().replace(' ', '')}",
                    linkedin=f"https://linkedin.com/in/{name.lower().replace(' ', '')}",
                    pub_books=random.randint(0, 2),
                    pub_papers=random.randint(1, 6),
                    pub_chapters=random.randint(0, 3),
                    pub_reports=random.randint(1, 4),
                    pub_policy_briefs=random.randint(0, 5),
                    how_heard=random.choice(["LinkedIn", "RIS Website", "Employment News", "Peer Recommendation"])
                ))

                # 3. Schooling
                db.add(models.CandidateSchooling(
                    candidate_id=candidate.id,
                    class_x_school="Delhi Public School",
                    class_x_board="CBSE",
                    class_x_score_type="Percentage",
                    class_x_score_value=round(random.uniform(80.0, 96.0), 1),
                    class_x_year=birth_year + 16,
                    class_xii_school="Delhi Public School",
                    class_xii_board="CBSE",
                    class_xii_score_type="Percentage",
                    class_xii_score_value=round(random.uniform(78.0, 97.0), 1),
                    class_xii_year=birth_year + 18
                ))

                # 4. Higher Education
                uni1 = universities[idx % len(universities)]
                uni2 = universities[(idx + 1) % len(universities)]
                
                # Master's / Undergrad
                db.add(models.CandidateHigherEducation(
                    candidate_id=candidate.id,
                    level="undergrad",
                    degree_name="B.A. (Hons) Economics",
                    university=uni1,
                    score_type="Percentage",
                    score_value=round(random.uniform(72.0, 88.0), 1),
                    grad_year=birth_year + 21,
                    entry_order=1
                ))
                
                db.add(models.CandidateHigherEducation(
                    candidate_id=candidate.id,
                    level="postgrad",
                    degree_name="M.A. Economics / Public Policy",
                    university=uni2,
                    score_type="CGPA (Out of 10)",
                    score_value=round(random.uniform(7.5, 9.4), 2),
                    grad_year=birth_year + 23,
                    entry_order=2
                ))

                if i % 2 == 0:  # 50% PhD candidates
                    db.add(models.CandidateHigherEducation(
                        candidate_id=candidate.id,
                        level="phd",
                        degree_name=f"Ph.D. in {job.division} Studies",
                        university=uni1,
                        score_type="CGPA (Out of 10)",
                        score_value=round(random.uniform(8.5, 9.8), 2),
                        grad_year=birth_year + 27,
                        entry_order=3
                    ))

                # 5. Work Experience
                company = companies[idx % len(companies)]
                db.add(models.CandidateWorkExperience(
                    candidate_id=candidate.id,
                    role="Senior Research Fellow" if years_exp > 5 else "Research Analyst",
                    company_name=company,
                    start_date=date(birth_year + 23, 6, 1),
                    end_date=date.today(),
                    is_current=True,
                    entry_order=1
                ))

                # 6. Publication Title
                db.add(models.CandidatePublication(
                    candidate_id=candidate.id,
                    pub_type="paper",
                    title=f"Empirical Evaluation of {job.title} in South Asia",
                    entry_order=1
                ))

                # 7. Resume Payload
                db.add(models.CandidateResumePayload(
                    candidate_id=candidate.id,
                    resume_path=f"uploads/cv_{name.lower().replace(' ', '_')}.pdf",
                    pdf_blob=sample_pdf_bytes,
                    raw_resume_text=f"Resume of {name}. Expert in {job.title}."
                ))

                # 8. Application Tracker & Scoring
                app_track = models.ApplicationTracking(
                    candidate_id=candidate.id,
                    job_id=job.id,
                    position_applied=job.position,
                    admin_department=job.division,
                    current_status=random.choice(["received", "under_review", "shortlisted"])
                )
                db.add(app_track)
                db.flush()

                # Scoring
                score_res = calculate_candidate_score(candidate, job.min_experience or 1.0)
                app_track.profile_score = score_res["total_score"]

                # Status History
                db.add(models.ApplicationStatusHistory(
                    application_tracking_id=app_track.id,
                    status=app_track.current_status,
                    changed_by="SYSTEM_SEEDER",
                    notes="Analytical test candidate injected"
                ))

                print(f"  ✅ Added Candidate #{i+1}: {name} (Age: {calculated_age}, Exp: {years_exp} yrs, Score: {app_track.profile_score:.1f})")
                idx += 1
                total_injected += 1

        db.commit()
        print(f"\n✨ Successfully injected {total_injected} candidates with diverse analytical backgrounds across all active jobs!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error injecting candidates: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inject_candidates()
