
import os
import sys
from datetime import date, datetime
import uuid

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal, engine
from database import models

def clean_db():
    print("Cleaning database...")
    db = SessionLocal()
    try:
        # Delete in order of dependency
        db.query(models.ApplicationStatusHistory).delete()
        db.query(models.CandidateWorkExperience).delete()
        db.query(models.CandidatePublication).delete()
        db.query(models.CandidateHigherEducation).delete()
        db.query(models.CandidateSchooling).delete()
        db.query(models.CandidateLinksAbout).delete()
        db.query(models.CandidateResumePayload).delete()
        db.query(models.ApplicationTracking).delete()
        db.query(models.CandidateMetadata).delete()
        db.commit()
        print("Database purged of all candidate data.")
    except Exception as e:
        print(f"Error cleaning DB: {e}")
        db.rollback()
    finally:
        db.close()

def add_real_candidates():
    db = SessionLocal()
    
    # Get a job ID to link to
    job = db.query(models.JobPosting).first()
    if not job:
        print("No job postings found. Please create one first.")
        return
    
    job_id = job.id
    
    candidates = [
        {
            "name": "Dr. Aarav Mehta", "email": "aarav.mehta.phd@outlook.com", "edu": "PhD", "state": "Maharashtra", "gender": "Male",
            "grad": [{"uni": "IIT Bombay", "deg": "B.Tech Mechanical", "score": "9.2 CGPA"}],
            "pg": [{"uni": "IIT Delhi", "deg": "M.Tech Robotics", "score": "9.5 CGPA"}],
            "doc": [{"uni": "Stanford University", "thesis": "Autonomous Navigation in Dynamic Environments", "score": "Pass"}],
            "work": [{"role": "Senior Research Scientist", "comp": "Tesla Automation"}],
            "books": ["Robotics in the 21st Century"], "papers": ["Path Planning Algorithms"], "chapters": [{"name": "Sensor Fusion", "book": "AI Handbook"}]
        },
        {
            "name": "Ms. Ishani Sharma", "email": "ishani.sharma@gmail.com", "edu": "Masters", "state": "Delhi", "gender": "Female",
            "grad": [{"uni": "Delhi University", "deg": "B.A. Economics", "score": "88%"}],
            "pg": [{"uni": "LSE", "deg": "M.Sc. Econometrics", "score": "Distinction"}],
            "work": [{"role": "Economist", "comp": "World Bank"}],
            "books": [], "papers": ["Impact of GST on SMEs"], "chapters": []
        },
        {
            "name": "Prof. Rajesh Iyer", "email": "r.iyer@jnu.ac.in", "edu": "PhD", "state": "Tamil Nadu", "gender": "Male",
            "grad": [{"uni": "Madras University", "deg": "B.Sc. Physics", "score": "94%"}],
            "pg": [{"uni": "IISc Bangalore", "deg": "M.Sc. Physics", "score": "9.1 CGPA"}],
            "doc": [{"uni": "JNU", "thesis": "Quantum Entanglement", "score": "Awarded"}],
            "work": [{"role": "Assistant Professor", "comp": "Anna University"}],
            "books": ["Quantum Mechanics 101"], "papers": ["Bose-Einstein Condensation"], "chapters": []
        },
        {
            "name": "Dr. Sunita Williams", "email": "s.williams@nasa.gov", "edu": "PhD", "state": "Gujarat", "gender": "Female",
            "grad": [{"uni": "U.S. Naval Academy", "deg": "B.S. Physical Science", "score": "3.8 GPA"}],
            "pg": [{"uni": "Florida Tech", "deg": "M.S. Eng Management", "score": "4.0 GPA"}],
            "doc": [{"uni": "MIT", "thesis": "Aeroelasticity", "score": "Outstanding"}],
            "work": [{"role": "Astronaut", "comp": "NASA"}],
            "books": ["Life in Orbit"], "papers": ["Radiation Shielding"], "chapters": [{"name": "EVA Systems", "book": "Space Guide"}]
        },
        {
            "name": "Mr. Arjun Mukherjee", "email": "arjun.m@techcorp.in", "edu": "Bachelors", "state": "West Bengal", "gender": "Male",
            "grad": [
                {"uni": "Jadavpur University", "deg": "B.E. CSE", "score": "8.5 CGPA"},
                {"uni": "Calcutta University", "deg": "B.Sc. Math", "score": "78%"}
            ],
            "work": [{"role": "Lead Architect", "comp": "TCS"}],
            "books": [], "papers": [], "chapters": []
        },
        {
            "name": "Ms. Priya Kulkarni", "email": "p.kulkarni@isro.gov.in", "edu": "Masters", "state": "Karnataka", "gender": "Female",
            "grad": [{"uni": "RV College", "deg": "B.E. Aerospace", "score": "9.0 CGPA"}],
            "pg": [
                {"uni": "IISc Bangalore", "deg": "M.Tech Aerospace", "score": "9.2 CGPA"},
                {"uni": "IIM Ahmedabad", "deg": "MBA Operations", "score": "3.5 GPA"}
            ],
            "work": [{"role": "Mission Director", "comp": "ISRO"}],
            "books": ["Rocketry 101"], "papers": ["Cryogenic Engine Design"], "chapters": []
        },
        {
            "name": "Dr. Amitav Ghosh", "email": "ghosh@oxford.edu", "edu": "PhD", "state": "Delhi", "gender": "Male",
            "grad": [{"uni": "St. Stephens", "deg": "B.A. History", "score": "82%"}],
            "pg": [{"uni": "JNU", "deg": "M.A. Modern History", "score": "7.8 CGPA"}],
            "doc": [{"uni": "Oxford", "thesis": "Post-Colonial Narratives", "score": "Distinction"}],
            "work": [{"role": "Professor", "comp": "Columbia University"}],
            "books": ["The Hungry Tide", "Sea of Poppies", "River of Smoke"], "papers": ["Maritime History of India"], "chapters": []
        },
        {
            "name": "Ms. Zara Khan", "email": "zara.k@undp.org", "edu": "Masters", "state": "Telangana", "gender": "Female",
            "grad": [{"uni": "Osmania University", "deg": "B.A. Pol Sci", "score": "75%"}],
            "pg": [{"uni": "Columbia SIPA", "deg": "Master of International Affairs", "score": "3.9 GPA"}],
            "work": [{"role": "Program Officer", "comp": "United Nations"}],
            "books": [], "papers": ["Climate Change in South Asia", "Gender Equality Trends"], "chapters": [{"name": "Urbanization", "book": "Global Dev Report"}]
        },
        {
            "name": "Mr. Rohan Verma", "email": "rohan.v@goldmansachs.com", "edu": "Masters", "state": "Punjab", "gender": "Male",
            "grad": [{"uni": "PEC Chandigarh", "deg": "B.E. Mech", "score": "8.8 CGPA"}],
            "pg": [{"uni": "IIM Calcutta", "deg": "PGDM Finance", "score": "3.7 GPA"}],
            "work": [{"role": "Vice President", "comp": "Goldman Sachs"}],
            "books": ["Financial Derivatives"], "papers": [], "chapters": []
        },
        {
            "name": "Dr. Meera Nair", "email": "meera.nair@mayoclinic.org", "edu": "PhD", "state": "Kerala", "gender": "Female",
            "grad": [{"uni": "CMC Vellore", "deg": "MBBS", "score": "Gold Medalist"}],
            "pg": [{"uni": "AIIMS Delhi", "deg": "MD Neurology", "score": "Pass"}],
            "doc": [{"uni": "Johns Hopkins", "thesis": "Neural Regeneration in Primates", "score": "Outstanding"}],
            "work": [{"role": "Chief Surgeon", "comp": "Mayo Clinic"}],
            "books": ["The Plastic Brain"], "papers": ["Synaptic Mapping", "Glioblastoma Treatment"], "chapters": []
        }
    ]

    print(f"Injecting {len(candidates)} Realistic Power Candidates...")
    
    for can in candidates:
        c_id = str(uuid.uuid4())
        
        birth_date = date(1985, 5, 20) # Mock date for seeds

        # Metadata
        meta = models.CandidateMetadata(
            id=c_id,
            full_name=can["name"],
            email=can["email"],
            mobile_no="9876543210",
            dob=birth_date,
            gender=can["gender"],
            state=can["state"],
            city="New Delhi",
            years_of_experience=5.0
        )
        db.add(meta)
        db.flush()

        # Application Tracking
        app_track = models.ApplicationTracking(
            candidate_id=c_id,
            job_id=job_id,
            position_applied=job.title,
            admin_department='IT',
            current_status='under_review'
        )
        db.add(app_track)
        
        # Links & About
        links = models.CandidateLinksAbout(
            candidate_id=c_id,
            about="Candidate seeded via automation script",
            google_scholar="https://scholar.google.com",
            linkedin="https://linkedin.com"
        )
        db.add(links)

        # Schooling
        sch = models.CandidateSchooling(candidate_id=c_id, class_x_percentage=92.5, class_xii_percentage=89.0)
        db.add(sch)
        
        # Grad
        for i, g in enumerate(can.get("grad", [])):
            stype = "CGPA" if "CGPA" in g["score"] or "GPA" in g["score"] else "Percentage"
            try:
                sval = float(g["score"].split()[0].replace('%','')) if stype == "Percentage" else float(g["score"].split()[0])
            except: sval = 0.0
            grad = models.CandidateHigherEducation(candidate_id=c_id, level='undergrad', university=g["uni"], degree_name=g["deg"], score_type=stype, score_value=sval, grad_year=2007, entry_order=i+1)
            db.add(grad)
            
        # PG
        for i, p in enumerate(can.get("pg", [])):
            stype = "CGPA" if "GPA" in p["score"] else "Percentage"
            pg = models.CandidateHigherEducation(candidate_id=c_id, level='postgrad', university=p["uni"], degree_name=p["deg"], score_type=stype, score_value=3.8 if stype=="CGPA" else 85.0, grad_year=2010, entry_order=i+1)
            db.add(pg)
            
        # Doc
        for i, d in enumerate(can.get("doc", [])):
            doc = models.CandidateHigherEducation(candidate_id=c_id, level='phd', university=d["uni"], degree_name=d["thesis"], score_type="Percentage", score_value=0.0, grad_year=2015, entry_order=i+1)
            db.add(doc)
            
        # Work
        for i, w in enumerate(can.get("work", [])):
            work = models.CandidateWorkExperience(candidate_id=c_id, company_name=w["comp"], role=w["role"], start_date=date(2010,1,1), is_current=(i==0), entry_order=i+1)
            db.add(work)
            
        # Pubs
        for i, b in enumerate(can.get("books", [])):
            book = models.CandidatePublication(candidate_id=c_id, pub_type='book', title=b, entry_order=i+1)
            db.add(book)
        for i, p in enumerate(can.get("papers", [])):
            paper = models.CandidatePublication(candidate_id=c_id, pub_type='paper', title=p, entry_order=i+1)
            db.add(paper)
        for i, ch in enumerate(can.get("chapters", [])):
            chap = models.CandidatePublication(candidate_id=c_id, pub_type='chapter', title=ch["name"], parent_book=ch["book"], entry_order=i+1)
            db.add(chap)
            
        print(f"  [OK] Injected {can['name']}")
        
    db.commit()
    db.close()
    print("Injection Complete.")

if __name__ == "__main__":
    clean_db()
    add_real_candidates()
