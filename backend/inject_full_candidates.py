"""
Inject 3 fully populated candidates with realistic data + resume embeddings.
Deletes previous AI test candidates first to avoid duplicates.
"""
import uuid
import datetime
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database import models

def inject():
    db: Session = SessionLocal()
    JOB_ID = 'ec761c44-d68c-4f38-83eb-1b2bb888dbca'

    # ── Clean up old test candidates ──
    emails_to_clean = ['arjun.raghavan@techcorp.in', 'priya.venkatesh@research.edu', 'vikram.malhotra@consulting.com']
    old = db.query(models.CandidateMetadata).filter(
        db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.email.in_(emails_to_clean)
        ).exists() | models.CandidateMetadata.full_name.ilike('%AI Test%')
    ).all()
    # Simpler approach: just delete by email directly
    for email in emails_to_clean:
        c = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.email == email).first()
        if c:
            db.delete(c)
    old_test = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.full_name.ilike('%AI Test%')).all()
    for o in old_test:
        db.delete(o)
    db.commit()
    print(f"Cleaned old test candidates.")

    candidates_data = [
        {
            "name": "Arjun Raghavan",
            "email": "arjun.raghavan@techcorp.in",
            "mobile": "9876543210",
            "dob": datetime.date(1993, 8, 14),
            "gender": "Male",
            "state": "Karnataka",
            "about": "Full-stack software engineer with 6 years of experience in backend systems, distributed computing, and machine learning pipelines.",
            "total_exp": 6.0,
            "highest_edu": "Masters",
            "resume_file": "../Resume-Sample-1-Software-Engineer.pdf",
            "schooling": {"x": 92.5, "xii": 88.0},
            "graduation": [{"uni": "Indian Institute of Technology, Bombay", "degree": "B.Tech Computer Science", "score_type": "CGPA", "score": 8.7}],
            "postgraduate": [{"uni": "Carnegie Mellon University", "degree": "M.S. Computer Science", "score_type": "CGPA", "score": 3.85}],
            "doctorate": [],
            "work": [
                {"company": "Google India", "role": "Software Engineer II", "start": datetime.date(2019, 6, 1), "end": datetime.date(2022, 3, 15), "desc": "Worked on distributed systems for Google Cloud Platform, optimizing data pipelines."},
                {"company": "Flipkart", "role": "Senior Backend Engineer", "start": datetime.date(2022, 4, 1), "end": None, "desc": "Leading backend architecture for supply chain management microservices."},
            ],
            "books": [],
            "papers": [{"title": "Efficient Distributed Training of Deep Neural Networks on Commodity Hardware"}],
            "chapters": [],
        },
        {
            "name": "Priya Venkatesh",
            "email": "priya.venkatesh@research.edu",
            "mobile": "9123456789",
            "dob": datetime.date(1991, 3, 22),
            "gender": "Female",
            "state": "Tamil Nadu",
            "about": "Research scientist specializing in computational biology, bioinformatics, and statistical modeling with a strong publication record.",
            "total_exp": 8.0,
            "highest_edu": "PhD",
            "resume_file": "../Resume-Sample-3-Computer-Science.pdf",
            "schooling": {"x": 95.0, "xii": 93.5},
            "graduation": [{"uni": "Anna University", "degree": "B.Sc. Biotechnology", "score_type": "CGPA", "score": 9.1}],
            "postgraduate": [{"uni": "University of Edinburgh", "degree": "M.Sc. Bioinformatics", "score_type": "CGPA", "score": 3.9}],
            "doctorate": [{"uni": "MIT", "thesis": "Graph Neural Networks for Protein Folding Prediction", "score_type": "CGPA", "score": 4.0}],
            "work": [
                {"company": "Broad Institute", "role": "Research Associate", "start": datetime.date(2017, 9, 1), "end": datetime.date(2020, 6, 30), "desc": "Developed computational pipelines for genomic data analysis."},
                {"company": "IISc Bangalore", "role": "Assistant Professor", "start": datetime.date(2021, 1, 10), "end": None, "desc": "Teaching computational biology and leading a research group on drug discovery."},
            ],
            "books": [{"title": "Computational Methods in Modern Genomics"}],
            "papers": [
                {"title": "Deep Learning Approaches for Genomic Variant Calling"},
                {"title": "Statistical Methods for Single-Cell RNA Sequencing Analysis"},
            ],
            "chapters": [{"chapter": "Machine Learning in Drug Discovery", "book": "Computational Methods in Modern Genomics"}],
        },
        {
            "name": "Vikram Malhotra",
            "email": "vikram.malhotra@consulting.com",
            "mobile": "9988776655",
            "dob": datetime.date(1988, 11, 5),
            "gender": "Male",
            "state": "Delhi",
            "about": "Management consultant and data scientist with expertise in supply chain optimization, operations research, and business analytics.",
            "total_exp": 10.0,
            "highest_edu": "Masters",
            "resume_file": "../Resume-Sample-4-Science.pdf",
            "schooling": {"x": 89.0, "xii": 91.5},
            "graduation": [{"uni": "Delhi University", "degree": "B.Com (Honours)", "score_type": "Percentage", "score": 85.0}],
            "postgraduate": [{"uni": "Indian School of Business", "degree": "MBA - Operations & Strategy", "score_type": "CGPA", "score": 3.7}],
            "doctorate": [],
            "work": [
                {"company": "McKinsey & Company", "role": "Associate", "start": datetime.date(2014, 7, 1), "end": datetime.date(2018, 12, 31), "desc": "Led supply chain transformation projects for Fortune 500 clients across APAC."},
                {"company": "Amazon India", "role": "Senior Operations Manager", "start": datetime.date(2019, 2, 1), "end": datetime.date(2023, 6, 30), "desc": "Managed last-mile delivery optimization using ML models."},
                {"company": "Tata Consultancy Services", "role": "Director - Analytics", "start": datetime.date(2023, 8, 1), "end": None, "desc": "Leading enterprise analytics practice for manufacturing and logistics clients."},
            ],
            "books": [{"title": "Data-Driven Supply Chain Management"}],
            "papers": [{"title": "Optimization Algorithms for Last-Mile Delivery in Emerging Markets"}],
            "chapters": [],
        },
    ]

    for cd in candidates_data:
        c_id = str(uuid.uuid4())
        print(f"Injecting: {cd['name']} -> {c_id}")

        candidate = models.CandidateMetadata(
            id=c_id,
            full_name=cd["name"],
            email=cd["email"],
            mobile_no=cd["mobile"],
            dob=cd["dob"],
            gender=cd["gender"],
            state=cd["state"],
            years_of_experience=cd["total_exp"]
        )
        db.add(candidate)
        db.flush()

        db.add(models.ApplicationTracking(
            candidate_id=c_id,
            job_id=JOB_ID,
            position_applied='Professor',
            current_status='received'
        ))

        db.add(models.CandidateLinksAbout(
            candidate_id=c_id,
            about=cd["about"],
            linkedin="https://linkedin.com"
        ))

        # Schooling
        db.add(models.CandidateSchooling(
            candidate_id=c_id,
            class_x_percentage=cd["schooling"]["x"],
            class_xii_percentage=cd["schooling"]["xii"],
        ))

        # Graduation
        for i, g in enumerate(cd["graduation"], 1):
            db.add(models.CandidateHigherEducation(
                candidate_id=c_id, level='undergrad', university=g["uni"], degree_name=g["degree"],
                score_type=g["score_type"], score_value=g["score"], entry_order=i,
            ))

        # Postgraduate
        for i, p in enumerate(cd["postgraduate"], 1):
            db.add(models.CandidateHigherEducation(
                candidate_id=c_id, level='postgrad', university=p["uni"], degree_name=p["degree"],
                score_type=p["score_type"], score_value=p["score"], entry_order=i,
            ))

        # Doctorate
        for i, d in enumerate(cd["doctorate"], 1):
            db.add(models.CandidateHigherEducation(
                candidate_id=c_id, level='phd', university=d["uni"], degree_name=d["thesis"],
                score_type=d["score_type"], score_value=d["score"], entry_order=i,
            ))

        # Work
        for i, w in enumerate(cd["work"], 1):
            db.add(models.CandidateWorkExperience(
                candidate_id=c_id, company_name=w["company"], role=w["role"],
                start_date=w["start"], end_date=w["end"],
                is_current=(w["end"] is None), entry_order=i,
            ))

        # Books
        for i, b in enumerate(cd["books"], 1):
            db.add(models.CandidatePublication(candidate_id=c_id, pub_type='book', title=b["title"], entry_order=i))

        # Papers
        for i, p in enumerate(cd["papers"], 1):
            db.add(models.CandidatePublication(candidate_id=c_id, pub_type='paper', title=p["title"], entry_order=i))

        # Chapters
        for i, ch in enumerate(cd["chapters"], 1):
            db.add(models.CandidatePublication(
                candidate_id=c_id, pub_type='chapter', title=ch["chapter"],
                parent_book=ch["book"], entry_order=i,
            ))

        # Status history
        db.add(models.ApplicationStatusHistory(
            application_id=db.query(models.ApplicationTracking.id).filter(models.ApplicationTracking.candidate_id == c_id).first()[0],
            status="received", changed_by="SYSTEM", notes="Injected via script",
        ))

        db.commit()

        # Process resume
        import os
        resume_path = os.path.abspath(cd["resume_file"])
        if os.path.exists(resume_path):
            print(f"  Processing resume: {resume_path}")
            from ai_service import process_and_save_resume
            with open(resume_path, "rb") as f:
                pdf_bytes = f.read()
            process_and_save_resume(db, c_id, pdf_bytes, os.path.basename(resume_path))
            print(f"  [OK] Resume embedded successfully")
        else:
            print(f"  [FAIL] Resume file not found: {resume_path}")

    print("\n=== Done! All 3 candidates injected with full data + resume embeddings ===")

if __name__ == "__main__":
    inject()
