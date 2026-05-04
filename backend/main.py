from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, or_
from database.database import engine, Base, get_db
from database import models
import schemas
import datetime
from pydantic import BaseModel
from typing import List, Optional

# Note: In production, use Alembic migrations instead of create_all
# create_all is safe here — it only creates tables that don't exist yet
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="RIS Hiring Portal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import File, UploadFile
from fastapi.responses import FileResponse
import os

# AI Preloading disabled - using cloud API
# @app.on_event("startup")
# def preload_ai_model():
#     try:
#         from ai_service import _get_model
#         # _get_model()
#         print("AI Semantic Model preloading skipped for fast startup.")
#     except Exception as e:
#         print(f"Warning: Could not preload AI model: {e}")


# ─────────────────────────────────────────────
# DATABASE SYSTEM MIGRATION (TEMPORARY)
# ─────────────────────────────────────────────
@app.get("/api/v1/system/migrate")
def trigger_migration():
    """
    Temporary endpoint to initialize the cloud database schema.
    """
    try:
        from database.database import Base, engine
        import database.models  # Ensure models are registered
        Base.metadata.create_all(bind=engine)
        return {"status": "success", "message": "Database schema initialized in the cloud."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ─────────────────────────────────────────────
# Internal Data Seeding (Temporary)
# ─────────────────────────────────────────────

@app.get("/api/v1/seed")
def seed_test_data(db: Session = Depends(get_db)):
    """
    Internal trigger to seed professional jobs directly in the cloud.
    """
    from datetime import date, timedelta
    # Use local imports since we are in backend directory context
    import schemas
    
    jobs = [
        {
            "title": "Consultant (International Trade & G20 Policy)",
            "position": "Consultant",
            "division": "RIS",
            "status": "open",
            "total_openings": 2,
            "deadline": date.today() + timedelta(days=30),
            "description": "Lead research initiatives focused on South-South cooperation, global value chains, and India's strategic positioning within the G20 framework.",
            "requirements": "PhD in International Economics. 8+ years experience. Proficiency in STATA/R."
        },
        {
            "title": "Consultant (Blue Economy & Maritime Security)",
            "position": "Consultant",
            "division": "CMEC",
            "status": "open",
            "total_openings": 1,
            "deadline": date.today() + timedelta(days=25),
            "description": "Provide strategic consulting for the Connectivity and Maritime Economic Cooperation (CMEC) division on IORA frameworks.",
            "requirements": "Advanced degree in Strategic Studies. 10+ years experience."
        },
        {
            "title": "Research Assistant (Traditional Medicine Systems)",
            "position": "Research Assistant",
            "division": "FITM",
            "status": "open",
            "total_openings": 3,
            "deadline": date.today() + timedelta(days=15),
            "description": "Support the Forum for Indian Traditional Medicine (FITM) in documenting global health protocols and AYUSH systems.",
            "requirements": "Master's degree in Public Health or Social Sciences. Strong writing skills."
        },
        {
            "title": "Research Assistant (ASEAN-India Regional Integration)",
            "position": "Research Assistant",
            "division": "AIC",
            "status": "open",
            "total_openings": 2,
            "deadline": date.today() + timedelta(days=20),
            "description": "Assist the ASEAN-India Centre (AIC) in monitoring regional trade agreements and connectivity corridors.",
            "requirements": "Master's in International Relations. Proficiency in data visualization tools."
        },
        {
            "title": "Research Assistant (Development Finance)",
            "position": "Research Assistant",
            "division": "DAKSHIN",
            "status": "open",
            "total_openings": 1,
            "deadline": date.today() + timedelta(days=45),
            "description": "Contribute to the DAKSHIN initiative by analyzing debt sustainability frameworks for Least Developed Countries (LDCs).",
            "requirements": "Master's in Finance or Econometrics. Familiarity with IMF/World Bank data."
        }
    ]

    created = 0
    for j_data in jobs:
        existing = db.query(models.JobPosting).filter(models.JobPosting.title == j_data["title"]).first()
        if not existing:
            job = models.JobPosting(**j_data)
            db.add(job)
            created += 1
    
    db.commit()
    return {"status": "success", "message": f"Successfully seeded {created} professional jobs."}

@app.get("/api/v1/seed-candidates")
def seed_candidates(db: Session = Depends(get_db)):
    """
    Heavy-duty seeder to inject 41 high-fidelity candidates based on generated CVs.
    """
    import os
    import random
    from datetime import date
    import schemas
    
    # 1. Map domains to Job IDs
    job_map = {}
    jobs = db.query(models.JobPosting).all()
    for j in jobs:
        if "G20" in j.title: job_map["International Trade & G20 Policy"] = j.id
        elif "Blue Economy" in j.title: job_map["Blue Economy & CMEC"] = j.id
        elif "Traditional Medicine" in j.title: job_map["Traditional Medicine (FITM)"] = j.id
        elif "ASEAN" in j.title: job_map["ASEAN-India (AIC)"] = j.id
        elif "Development Finance" in j.title: job_map["Dev Finance (DAKSHIN)"] = j.id

    resume_dir = os.path.join(os.path.dirname(__file__), "test_resumes")
    resume_files = [f for f in os.listdir(resume_dir) if f.endswith(".pdf")]
    # Add the lone Arjun resume
    arjun_path = os.path.join(os.path.dirname(__file__), "sample_resume_arjun.pdf")
    
    all_resumes = [{"path": arjun_path, "domain": "International Trade & G20 Policy", "name": "Arjun Subramanian"}]
    for rf in resume_files:
        # Extract domain from filename or simple logic
        domain_name = random.choice(list(job_map.keys())) # For seed, we spread them
        all_resumes.append({"path": os.path.join(resume_dir, rf), "domain": domain_name, "name": rf.split("_")[2].replace(".pdf", "").replace("_", " ")})

    created_count = 0
    for res in all_resumes:
        # Avoid duplicate emails (synthetic)
        email = f"{res['name'].lower().replace(' ', '.')}@policy-res.in"
        existing = db.query(models.Candidate).filter(models.Candidate.email == email).first()
        if existing: continue

        # Read PDF binary
        with open(res['path'], "rb") as f:
            pdf_data = f.read()

        # Create Candidate
        tier = random.choice(['PhD', 'Masters', 'Bachelors'])
        candidate = models.Candidate(
            full_name=res['name'],
            email=email,
            mobile_number=f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            age=random.randint(24, 45),
            gender=random.choice(["Male", "Female"]),
            state=random.choice(["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh"]),
            highest_education="PhD" if tier == 'PhD' else ("Postgraduate" if tier == 'Masters' else "Undergraduate"),
            position_applied="Consultant" if tier == 'PhD' else "Research Assistant",
            applied_job_id=job_map.get(res['domain']),
            resume_data=pdf_data,
            resume_filename=os.path.basename(res['path'])
        )
        db.add(candidate)
        db.flush() # Get ID

        # 1. Doctorate
        if tier == 'PhD':
            db.add(models.Doctorate(
                candidate_id=candidate.id,
                university="Jawaharlal Nehru University",
                thesis_title=f"Advanced Analysis of {res['domain']}",
                year_of_completion=2021
            ))
        
        # 2. Postgraduate
        if tier in ['PhD', 'Masters']:
            db.add(models.Postgraduate(
                candidate_id=candidate.id,
                degree_name="M.A. Economics",
                university="Delhi School of Economics",
                score=82.5,
                score_type="Percentage",
                year_of_completion=2016
            ))
        
        # 3. Graduation
        db.add(models.Graduation(
            candidate_id=candidate.id,
            degree_name="B.A. Economics",
            university="University of Delhi",
            score=78.0,
            score_type="Percentage",
            year_of_completion=2014
        ))

        # 4. Experience (2 entries)
        db.add(models.WorkExperience(candidate_id=candidate.id, role="Senior Policy Analyst", company_name="Policy Think Tank", years=3))
        db.add(models.WorkExperience(candidate_id=candidate.id, role="Research Intern", company_name="Regional Agency", years=1))

        # 5. Publications
        db.add(models.Book(candidate_id=candidate.id, title=f"Future of {res['domain']}"))
        db.add(models.ResearchPaper(candidate_id=candidate.id, title=f"Impact of GVCs on {res['domain']}"))

        created_count += 1

    db.commit()
    return {"status": "success", "message": f"Successfully injected {created_count} detailed candidates with resumes."}

# ─────────────────────────────────────────────
# Public Job Board Access
# ─────────────────────────────────────────────

@app.get("/api/v1/public/jobs")
def get_public_jobs(db: Session = Depends(get_db)):
    """
    Returns only 'open' jobs for the candidate landing page.
    Hides internal metadata.
    """
    jobs = db.query(models.JobPosting).filter(
        models.JobPosting.status == 'open',
        models.JobPosting.is_deleted == False
    ).order_by(models.JobPosting.deadline.asc()).all()
    
    return [{
        "id": j.id,
        "title": j.title,
        "position": j.position,
        "division": j.division,
        "location": j.location,
        "deadline": j.deadline,
        "description": j.description,
        "requirements": j.requirements
    } for j in jobs]

@app.get("/api/v1/public/jobs/{job_id}")
def get_public_job_detail(job_id: str, db: Session = Depends(get_db)):
    """
    Returns full public details for a specific job.
    """
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_deleted == False
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "id": job.id,
        "title": job.title,
        "position": job.position,
        "division": job.division,
        "description": job.description,
        "requirements": job.requirements,
        "deadline": job.deadline
    }

# ─────────────────────────────────────────────
# Candidate Application Submission
# ─────────────────────────────────────────────
@app.post(
    "/api/v1/applications",
    response_model=schemas.CandidateResponse,
    status_code=status.HTTP_201_CREATED
)
def create_application(payload: schemas.CandidateCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Create Lean Candidate Metadata (Persona)
    candidate = models.CandidateMetadata(
        full_name           = payload.full_name,
        email               = payload.email,
        mobile_no           = payload.mobile_no,
        dob                 = payload.dob,
        gender              = payload.gender,
        city                = payload.city,
        state               = payload.state,
        years_of_experience = payload.years_of_experience
    )
    db.add(candidate)
    db.flush()

    # 2. Create Application Tracking record
    app_tracking = models.ApplicationTracking(
        candidate_id     = candidate.id,
        job_id           = payload.job_id,
        position_applied = payload.position_applied,
        admin_department = payload.admin_department,
        current_status   = 'received'
    )
    db.add(app_tracking)
    db.flush()

    # 3. Candidate Links & About
    links_about = models.CandidateLinksAbout(
        candidate_id   = candidate.id,
        about          = payload.about,
        google_scholar = payload.google_scholar,
        linkedin       = payload.linkedin
    )
    db.add(links_about)

    # 4. Schooling (1:1)
    db.add(models.CandidateSchooling(
        candidate_id         = candidate.id,
        class_x_percentage   = payload.schooling.class_x_percentage,
        class_xii_percentage = payload.schooling.class_xii_percentage,
    ))

    # 5. Higher Education (1:N)
    for edu in payload.higher_education:
        db.add(models.CandidateHigherEducation(
            candidate_id = candidate.id,
            level        = edu.level,
            university   = edu.university,
            degree_name  = edu.degree_name,
            score_type   = edu.score_type,
            score_value  = edu.score_value,
            grad_year    = edu.grad_year,
            entry_order  = edu.entry_order,
        ))

    # 6. Publications (1:N)
    for pub in payload.publications:
        db.add(models.CandidatePublication(
            candidate_id = candidate.id,
            pub_type     = pub.pub_type,
            title        = pub.title,
            parent_book  = pub.parent_book,
            entry_order  = pub.entry_order,
        ))

    # 7. Work Experiences (1:N)
    for w in payload.work_experiences:
        db.add(models.CandidateWorkExperience(
            candidate_id = candidate.id,
            company_name = w.company_name,
            role         = w.role,
            start_date   = w.start_date,
            end_date     = w.end_date,
            is_current   = w.is_current,
            entry_order  = w.entry_order,
        ))

    # 8. Seed status history
    db.add(models.ApplicationStatusHistory(
        application_tracking_id = app_tracking.id,
        status                 = 'received',
        changed_by             = 'SYSTEM',
        notes                  = 'Application submitted',
    ))

    try:
        db.commit()
        db.refresh(candidate)
        
        # 9. Auto-tokenize candidate data in background
        background_tasks.add_task(tokenize_candidate_bg, candidate.id, payload.job_id)
        
        return candidate
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


def tokenize_candidate_bg(candidate_id: str):
    """
    Background wrapper to tokenize candidate structured data.
    """
    from database.database import SessionLocal
    db = SessionLocal()
    try:
        candidate = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.id == candidate_id).first()
        if candidate:
            tokenize_candidate(db, candidate)
    except Exception as e:
        print(f"Background tokenization error for {candidate_id}: {e}")
    finally:
        db.close()


# ─────────────────────────────────────────────
# Get Full Candidate Profile
# ─────────────────────────────────────────────
@app.get(
    "/api/v1/applications/{candidate_id}",
    response_model=schemas.CandidateFullResponse
)
def get_application(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.CandidateMetadata).filter(
        models.CandidateMetadata.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Application not found")
    return candidate


# ─────────────────────────────────────────────
# Application Status Tracker (public)
# ─────────────────────────────────────────────
@app.get("/api/v1/applications/{candidate_id}/status")
def get_status(candidate_id: str, db: Session = Depends(get_db)):
    return {
        "id":               candidate.id,
        "full_name":        candidate.full_name,
        "position_applied": candidate.position_applied,
        "current_status":   candidate.current_status,
        "submitted_at":     candidate.submitted_at,
    }


# ─────────────────────────────────────────────
# Job Postings (HR)
# ─────────────────────────────────────────────


@app.post(
    "/api/v1/jobs",
    response_model=schemas.JobPostingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_job(payload: schemas.JobPostingCreate, db: Session = Depends(get_db)):
    job = models.JobPosting(**payload.model_dump())
    db.add(job)
    try:
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/jobs/{job_id}", response_model=schemas.JobPostingResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_deleted == False
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return job


# ─────────────────────────────────────────────
# HR Stats (KPI Cards)
# ─────────────────────────────────────────────
@app.get("/api/v1/hr/stats")
def get_hr_stats(db: Session = Depends(get_db)):
    current_year = datetime.datetime.now().year
    today = datetime.date.today()
    week_later = today + datetime.timedelta(days=7)

    open_positions = db.query(models.JobPosting).filter(
        models.JobPosting.status == 'open',
        models.JobPosting.is_deleted == False
    ).count()

    total_applicants_year = db.query(models.ApplicationTracking).filter(
        extract('year', models.ApplicationTracking.submitted_at) == current_year
    ).count()

    closing_soon = db.query(models.JobPosting).filter(
        models.JobPosting.status == 'open',
        models.JobPosting.is_deleted == False,
        models.JobPosting.deadline != None,
        models.JobPosting.deadline >= today,
        models.JobPosting.deadline <= week_later
    ).count()

    return {
        "open_positions": open_positions,
        "total_applicants_year": total_applicants_year,
        "closing_soon": closing_soon,
    }

@app.get("/api/v1/hr/analytics/global")
def get_global_analytics(db: Session = Depends(get_db)):
    gender_stats = db.query(
        models.CandidateMetadata.gender, 
        func.count(models.CandidateMetadata.id)
    ).group_by(models.CandidateMetadata.gender).all()

    state_stats = db.query(
        models.CandidateMetadata.state, 
        func.count(models.CandidateMetadata.id)
    ).group_by(models.CandidateMetadata.state).order_by(func.count(models.CandidateMetadata.id).desc()).limit(5).all()

    # Education stats (count candidates having at least X level)
    phd_count = db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level == 'phd').distinct().count()
    pg_count = db.query(models.CandidateHigherEducation.candidate_id).filter(
        models.CandidateHigherEducation.level == 'postgrad',
        ~models.CandidateHigherEducation.candidate_id.in_(
            db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level == 'phd')
        )
    ).distinct().count()
    ug_count = db.query(models.CandidateMetadata.id).filter(
        models.CandidateMetadata.id.in_(
            db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level == 'undergrad')
        ),
        ~models.CandidateMetadata.id.in_(
            db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level.in_(['phd', 'postgrad']))
        )
    ).distinct().count()

    return {
        "gender": [{"name": g if g else "Other", "value": c} for g, c in gender_stats],
        "states": [{"name": s if s else "Unknown", "value": c} for s, c in state_stats],
        "education": [
            {"name": "PhD", "value": phd_count},
            {"name": "Masters", "value": pg_count},
            {"name": "Bachelors", "value": ug_count}
        ]
    }

@app.get("/api/v1/jobs/{job_id}/analytics")
def get_job_analytics(job_id: str, db: Session = Depends(get_db)):
    clean_id = str(job_id).strip()

    # Join application_tracking
    gender_stats = db.query(
        models.CandidateMetadata.gender, 
        func.count(models.CandidateMetadata.id)
    ).join(models.ApplicationTracking).filter(
        models.ApplicationTracking.job_id == clean_id
    ).group_by(models.CandidateMetadata.gender).all()

    state_stats = db.query(
        models.CandidateMetadata.state, 
        func.count(models.CandidateMetadata.id)
    ).join(models.ApplicationTracking).filter(
        models.ApplicationTracking.job_id == clean_id
    ).group_by(models.CandidateMetadata.state).order_by(func.count(models.CandidateMetadata.id).desc()).limit(5).all()

    # Job-specific candidate IDs
    cand_ids = db.query(models.ApplicationTracking.candidate_id).filter(models.ApplicationTracking.job_id == clean_id).subquery()

    phd_count = db.query(models.CandidateHigherEducation.candidate_id).filter(
        models.CandidateHigherEducation.level == 'phd',
        models.CandidateHigherEducation.candidate_id.in_(cand_ids)
    ).distinct().count()

    pg_count = db.query(models.CandidateHigherEducation.candidate_id).filter(
        models.CandidateHigherEducation.level == 'postgrad',
        models.CandidateHigherEducation.candidate_id.in_(cand_ids),
        ~models.CandidateHigherEducation.candidate_id.in_(
            db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level == 'phd')
        )
    ).distinct().count()

    ug_count = db.query(models.CandidateMetadata.id).filter(
        models.CandidateMetadata.id.in_(cand_ids),
        models.CandidateMetadata.id.in_(
            db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level == 'undergrad')
        ),
        ~models.CandidateMetadata.id.in_(
            db.query(models.CandidateHigherEducation.candidate_id).filter(models.CandidateHigherEducation.level.in_(['phd', 'postgrad']))
        )
    ).distinct().count()

    return {
        "gender": [{"name": g if g else "Other", "value": c} for g, c in gender_stats],
        "states": [{"name": s if s else "Unknown", "value": c} for s, c in state_stats],
        "education": [
            {"name": "PhD", "value": phd_count},
            {"name": "Masters", "value": pg_count},
            {"name": "Bachelors", "value": ug_count}
        ]
    }

@app.get("/api/v1/candidates/{candidate_id}/full_profile")
def get_full_profile(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.CandidateMetadata).options(
        joinedload(models.CandidateMetadata.schooling),
        joinedload(models.CandidateMetadata.higher_education),
        joinedload(models.CandidateMetadata.publications),
        joinedload(models.CandidateMetadata.work_experiences),
        joinedload(models.CandidateMetadata.links_about),
    ).filter(
        models.CandidateMetadata.id == candidate_id
    ).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Fetch applications tracking separately
    tracking_entries = db.query(models.ApplicationTracking).filter(
        models.ApplicationTracking.candidate_id == candidate_id
    ).all()
    
    schooling_data = None
    if candidate.schooling:
        schooling_data = {
            "class_x_percentage": candidate.schooling.class_x_percentage,
            "class_xii_percentage": candidate.schooling.class_xii_percentage
        }

    # Format higher education by level
    grad = [e for e in candidate.higher_education if e.level == 'undergrad']
    postgrad = [e for e in candidate.higher_education if e.level == 'postgrad']
    phd = [e for e in candidate.higher_education if e.level == 'phd']

    return {
        "id": candidate.id,
        "full_name": candidate.full_name,
        "email": candidate.email,
        "mobile_no": candidate.mobile_no,
        "dob": candidate.dob.isoformat() if candidate.dob else None,
        "gender": candidate.gender,
        "state": candidate.state,
        "city": candidate.city,
        "years_of_experience": candidate.years_of_experience,
        "about": candidate.links_about.about if candidate.links_about else None,
        "google_scholar": candidate.links_about.google_scholar if candidate.links_about else None,
        "linkedin": candidate.links_about.linkedin if candidate.links_about else None,
        "schooling": schooling_data,
        "graduation": [{"degree_name": g.degree_name, "university": g.university, "score_type": g.score_type, "score_value": g.score_value, "grad_year": g.grad_year} for g in grad],
        "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score_type": p.score_type, "score_value": p.score_value, "grad_year": p.grad_year} for p in postgrad],
        "doctorate": [{"university": d.university, "thesis_title": d.degree_name, "score_type": d.score_type, "score_value": d.score_value, "grad_year": d.grad_year} for d in phd],
        "work_experiences": [{"role": w.role, "company_name": w.company_name, "start_date": w.start_date.isoformat() if w.start_date else None, "end_date": w.end_date.isoformat() if w.end_date else None, "is_current": w.is_current} for w in candidate.work_experiences],
        "publications": [{"pub_type": pub.pub_type, "title": pub.title, "parent_book": pub.parent_book} for pub in candidate.publications],
        "applications": [{
            "job_id": app.job_id,
            "position_applied": app.position_applied,
            "admin_department": app.admin_department,
            "current_status": app.current_status,
            "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None
        } for app in tracking_entries]
    }


@app.get("/api/v1/applications/{candidate_id}/resume/download")
def download_resume(candidate_id: str, preview: bool = False, db: Session = Depends(get_db)):
    payload = db.query(models.CandidateResumePayload).filter(
        models.CandidateResumePayload.candidate_id == candidate_id
    ).first()
    
    if not payload or not payload.resume_path or not os.path.exists(payload.resume_path):
        raise HTTPException(status_code=404, detail="Resume not found")
    
    headers = {}
    if preview:
        headers["Content-Disposition"] = f'inline; filename="{os.path.basename(payload.resume_path)}"'
    else:
        headers["Content-Disposition"] = f'attachment; filename="{os.path.basename(payload.resume_path)}"'
        
    return FileResponse(path=payload.resume_path, headers=headers, media_type="application/pdf")


@app.post("/api/v1/applications/{candidate_id}/resume")
async def upload_resume(candidate_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    from ai_service import process_and_save_resume, background_vectorize_resume
    try:
        content = await file.read()
        saved_path, file_path = process_and_save_resume(db, candidate_id, content, file.filename)
        background_tasks.add_task(background_vectorize_resume, candidate_id, file_path)
        return {"status": "success", "resume_path": saved_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CandidateFilter(BaseModel):

    states: Optional[List[str]] = None
    genders: Optional[List[str]] = None
    ug_uni: Optional[str] = None
    min_ug_score: Optional[float] = None
    pg_uni: Optional[str] = None
    pg_min_score: Optional[float] = None
    phd_uni: Optional[str] = None
    phd_thesis: Optional[str] = None
    phd_min_score: Optional[float] = None
    min_experience_years: Optional[float] = None
    min_papers: Optional[int] = None
    min_books: Optional[int] = None
    min_chapters: Optional[int] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    min_x_score: Optional[float] = None
    min_xii_score: Optional[float] = None
    role_keyword: Optional[str] = None
    company_keyword: Optional[str] = None
    publication_keyword: Optional[str] = None
    semantic_query: Optional[str] = None
    ai_match_threshold: Optional[float] = 0.0
    # Score type awareness for education filters
    ug_score_type: Optional[str] = None    # 'Percentage' or 'CGPA'
    pg_score_type: Optional[str] = None
    phd_score_type: Optional[str] = None


# ── Autocomplete Suggestion Endpoint ──
@app.get("/api/v1/jobs/{job_id}/suggest")
def suggest_tokens(job_id: str, field: str, q: str = "", db: Session = Depends(get_db)):
    """
    Returns substring-matched suggestions for filter fields.
    field can be: university, degree, company, role, paper, book, chapter
    """
    clean_id = str(job_id).strip()
    
    if not q or len(q) < 1:
        # Return top 15 most frequent tokens of this type
        results = db.query(models.TokenRegistry.token_value).filter(
            models.TokenRegistry.job_id == clean_id,
            models.TokenRegistry.token_type == field
        ).order_by(models.TokenRegistry.frequency.desc()).limit(15).all()
        return [r[0] for r in results]
    
    # Substring match (ILIKE '%q%')
    results = db.query(models.TokenRegistry.token_value).filter(
        models.TokenRegistry.job_id == clean_id,
        models.TokenRegistry.token_type == field,
        models.TokenRegistry.normalized.ilike(f"%{q.lower().strip()}%")
    ).order_by(models.TokenRegistry.frequency.desc()).limit(15).all()
    
    return [r[0] for r in results]

@app.post("/api/v1/jobs/{job_id}/candidates/filter")
def filter_job_candidates(job_id: str, filters: CandidateFilter, db: Session = Depends(get_db)):
    try:
        clean_job_id = str(job_id).strip()
        
        # 1. Base query for IDs joining application_tracking
        id_query = db.query(models.CandidateMetadata.id).join(
            models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateMetadata.id
        ).filter(
            models.ApplicationTracking.job_id == clean_job_id
        )

        # Apply personal filters
        if filters.states and len(filters.states) > 0:
            id_filters = [models.CandidateMetadata.state.ilike(f"%{s}%") for s in filters.states]
            id_query = id_query.filter(or_(*id_filters))
        
        if filters.genders and len(filters.genders) > 0:
            id_query = id_query.filter(models.CandidateMetadata.gender.in_(filters.genders))

        if filters.min_experience_years is not None:
            id_query = id_query.filter(models.CandidateMetadata.years_of_experience >= float(filters.min_experience_years))

        # Higher Education filters (UG/PG/PhD)
        if filters.ug_uni:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'undergrad',
                models.CandidateHigherEducation.university.ilike(f"%{filters.ug_uni}%")
            ).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))
        
        if filters.min_ug_score is not None:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'undergrad',
                models.CandidateHigherEducation.score_value >= float(filters.min_ug_score)
            )
            if filters.ug_score_type:
                sub = sub.filter(models.CandidateHigherEducation.score_type == filters.ug_score_type)
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub.subquery()))

        if filters.pg_uni:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'postgrad',
                models.CandidateHigherEducation.university.ilike(f"%{filters.pg_uni}%")
            ).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.pg_min_score is not None:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'postgrad',
                models.CandidateHigherEducation.score_value >= float(filters.pg_min_score)
            )
            if filters.pg_score_type:
                sub = sub.filter(models.CandidateHigherEducation.score_type == filters.pg_score_type)
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub.subquery()))

        if filters.phd_uni:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'phd',
                models.CandidateHigherEducation.university.ilike(f"%{filters.phd_uni}%")
            ).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.phd_thesis:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'phd',
                models.CandidateHigherEducation.degree_name.ilike(f"%{filters.phd_thesis}%") # PhD degree name = thesis title
            ).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.phd_min_score is not None:
            sub = db.query(models.CandidateHigherEducation.candidate_id).filter(
                models.CandidateHigherEducation.level == 'phd',
                models.CandidateHigherEducation.score_value >= float(filters.phd_min_score)
            )
            if filters.phd_score_type:
                sub = sub.filter(models.CandidateHigherEducation.score_type == filters.phd_score_type)
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub.subquery()))

        # Academic Schooling Filters
        if filters.min_x_score is not None:
            sub = db.query(models.CandidateSchooling.candidate_id).filter(models.CandidateSchooling.class_x_percentage >= float(filters.min_x_score)).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.min_xii_score is not None:
            sub = db.query(models.CandidateSchooling.candidate_id).filter(models.CandidateSchooling.class_xii_percentage >= float(filters.min_xii_score)).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        # Work Experience Filters
        if filters.role_keyword:
            sub = db.query(models.CandidateWorkExperience.candidate_id).filter(models.CandidateWorkExperience.role.ilike(f"%{filters.role_keyword}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.company_keyword:
            sub = db.query(models.CandidateWorkExperience.candidate_id).filter(models.CandidateWorkExperience.company_name.ilike(f"%{filters.company_keyword}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        # Publication Filters
        if filters.min_papers and filters.min_papers > 0:
            sub = db.query(models.CandidatePublication.candidate_id).filter(
                models.CandidatePublication.pub_type == 'paper'
            ).group_by(models.CandidatePublication.candidate_id).having(func.count(models.CandidatePublication.id) >= filters.min_papers).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.publication_keyword:
            sub = db.query(models.CandidatePublication.candidate_id).filter(
                models.CandidatePublication.title.ilike(f"%{filters.publication_keyword}%")
            ).distinct().subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        # 2. Get the final list of matching IDs
        matching_ids = [r[0] for r in id_query.all()]
        
        ai_score_map = {}
        if filters.semantic_query:
            from ai_service import semantic_search_candidates
            ai_results = semantic_search_candidates(db, clean_job_id, filters.semantic_query)
            ai_score_map = {c.id: score for c, score in ai_results}

        if not matching_ids:
            return []

        # 3. Fetch full objects with joinedload only for those IDs
        candidates = db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.id.in_(matching_ids)
        ).options(
            joinedload(models.CandidateMetadata.higher_education),
            joinedload(models.CandidateMetadata.publications),
            joinedload(models.CandidateMetadata.work_experiences)
        ).all()

        # Fetch matching application trackers for status
        trackers = db.query(models.ApplicationTracking).filter(
            models.ApplicationTracking.candidate_id.in_(matching_ids),
            models.ApplicationTracking.job_id == clean_job_id
        ).all()
        tracker_map = {t.candidate_id: t for t in trackers}

        result = []
        for c in candidates:
            track = tracker_map.get(c.id)
            grad = [e for e in c.higher_education if e.level == 'undergrad']
            postgrad = [e for e in c.higher_education if e.level == 'postgrad']
            phd = [e for e in c.higher_education if e.level == 'phd']

            papers_ct = len([p for p in c.publications if p.pub_type == 'paper'])
            books_ct = len([p for p in c.publications if p.pub_type == 'book'])
            chapters_ct = len([p for p in c.publications if p.pub_type == 'chapter'])

            # Find dynamic highest education level
            highest_edu = 'Bachelors'
            if phd: highest_edu = 'PhD'
            elif postgrad: highest_edu = 'Masters'

            d = {
                "id": c.id,
                "full_name": c.full_name,
                "email": c.email,
                "gender": c.gender,
                "state": c.state,
                "years_of_experience": c.years_of_experience,
                "highest_education": highest_edu,
                "current_status": track.current_status if track else 'received',
                "ai_match_score": ai_score_map.get(c.id, None),
                "graduation": [{"degree_name": g.degree_name, "university": g.university, "score": f"{g.score_value} {g.score_type}"} for g in grad],
                "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score": f"{p.score_value} {p.score_type}"} for p in postgrad],
                "doctorate": [{"university": d.university, "thesis_title": d.degree_name, "score": f"{d.score_value} {d.score_type}"} for d in phd],
                "work_experiences": [{"role": w.role, "company_name": w.company_name} for w in c.work_experiences],
                "books_count": books_ct,
                "papers_count": papers_ct,
                "chapters_count": chapters_ct
            }
            result.append(d)
        
        if filters.semantic_query:
            result.sort(key=lambda x: x['ai_match_score'] or 0, reverse=True)
        else:
            result.sort(key=lambda x: x['full_name'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs/{job_id}/filter-options")
def get_filter_options(job_id: str, db: Session = Depends(get_db)):
    clean_id = str(job_id).strip()
    
    # Discover unique values joining application tracking
    states = db.query(models.CandidateMetadata.state).join(
        models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateMetadata.id
    ).filter(models.ApplicationTracking.job_id == clean_id).distinct().all()

    genders = db.query(models.CandidateMetadata.gender).join(
        models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateMetadata.id
    ).filter(models.ApplicationTracking.job_id == clean_id).distinct().all()
    
    # Level-specific university discovery
    ug_unis = db.query(models.CandidateHigherEducation.university).join(
        models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateHigherEducation.candidate_id
    ).filter(
        models.ApplicationTracking.job_id == clean_id,
        models.CandidateHigherEducation.level == 'undergrad'
    ).distinct().all()

    pg_unis = db.query(models.CandidateHigherEducation.university).join(
        models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateHigherEducation.candidate_id
    ).filter(
        models.ApplicationTracking.job_id == clean_id,
        models.CandidateHigherEducation.level == 'postgrad'
    ).distinct().all()

    phd_unis = db.query(models.CandidateHigherEducation.university).join(
        models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateHigherEducation.candidate_id
    ).filter(
        models.ApplicationTracking.job_id == clean_id,
        models.CandidateHigherEducation.level == 'phd'
    ).distinct().all()

    return {
        "states": sorted([s[0] for s in states if s[0]]),
        "genders": sorted([g[0] for g in genders if g[0]]),
        "ug_unis": sorted([u[0] for u in ug_unis if u[0]]),
        "pg_unis": sorted([u[0] for u in pg_unis if u[0]]),
        "phd_unis": sorted([u[0] for u in phd_unis if u[0]])
    }

@app.get("/api/v1/jobs/{job_id}/candidates")
def get_job_candidates(job_id: str, db: Session = Depends(get_db)):
    trackers = db.query(models.ApplicationTracking).filter(
        models.ApplicationTracking.job_id == job_id
    ).order_by(models.ApplicationTracking.submitted_at.desc()).all()
    
    if not trackers:
        return []

    candidate_ids = [t.candidate_id for t in trackers]
    candidates = db.query(models.CandidateMetadata).filter(
        models.CandidateMetadata.id.in_(candidate_ids)
    ).options(
        joinedload(models.CandidateMetadata.higher_education),
        joinedload(models.CandidateMetadata.publications),
        joinedload(models.CandidateMetadata.work_experiences)
    ).all()
    
    # Map for sorting order preservation
    cand_map = {c.id: c for c in candidates}
    
    result = []
    for t in trackers:
        c = cand_map.get(t.candidate_id)
        if not c:
            continue
            
        grad = [e for e in c.higher_education if e.level == 'undergrad']
        postgrad = [e for e in c.higher_education if e.level == 'postgrad']
        phd = [e for e in c.higher_education if e.level == 'phd']

        papers_ct = len([p for p in c.publications if p.pub_type == 'paper'])
        books_ct = len([p for p in c.publications if p.pub_type == 'book'])
        chapters_ct = len([p for p in c.publications if p.pub_type == 'chapter'])

        highest_edu = 'Bachelors'
        if phd: highest_edu = 'PhD'
        elif postgrad: highest_edu = 'Masters'

        d = {
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "gender": c.gender,
            "state": c.state,
            "years_of_experience": c.years_of_experience,
            "highest_education": highest_edu,
            "current_status": t.current_status,
            "ai_match_score": None,
            "graduation": [{"degree_name": g.degree_name, "university": g.university, "score": f"{g.score_value} {g.score_type}"} for g in grad],
            "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score": f"{p.score_value} {p.score_type}"} for p in postgrad],
            "doctorate": [{"university": d.university, "thesis_title": d.degree_name, "score": f"{d.score_value} {d.score_type}"} for d in phd],
            "work_experiences": [{"role": w.role, "company_name": w.company_name} for w in c.work_experiences],
            "books_count": books_ct,
            "papers_count": papers_ct,
            "chapters_count": chapters_ct
        }
        result.append(d)
    return result


# ─────────────────────────────────────────────
# List Jobs (with application counts)
# ─────────────────────────────────────────────
@app.get("/api/v1/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.JobPosting).filter(
        models.JobPosting.is_deleted == False
    ).order_by(models.JobPosting.created_at.desc()).all()

    result = []
    for job in jobs:
        app_count = db.query(models.ApplicationTracking).filter(
            models.ApplicationTracking.job_id == job.id
        ).count()

        result.append({
            "id":             job.id,
            "title":          job.title,
            "position":       job.position,
            "division":       job.division,
            "description":    job.description,
            "requirements":   job.requirements,
            "keywords":       job.keywords,
            "status":         job.status,
            "total_openings": job.total_openings,
            "deadline":       job.deadline.isoformat() if job.deadline else None,
            "created_by":     job.created_by,
            "created_at":     job.created_at.isoformat(),
            "updated_at":     job.updated_at.isoformat(),
            "is_deleted":     job.is_deleted,
            "application_count": app_count,
        })
    return result


# ─────────────────────────────────────────────
# Update Job (Edit)
# ─────────────────────────────────────────────
@app.patch("/api/v1/jobs/{job_id}")
def update_job(job_id: str, payload: schemas.JobPostingCreate, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_deleted == False
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, key, value)
    job.updated_at = datetime.datetime.utcnow()
    try:
        db.commit()
        db.refresh(job)
        return {"status": "updated", "id": job.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────
# Publish Draft → Open
# ─────────────────────────────────────────────
@app.patch("/api/v1/jobs/{job_id}/publish")
def publish_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_deleted == False
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = 'open'
    job.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "published"}


# ─────────────────────────────────────────────
# Archive Job
# ─────────────────────────────────────────────
@app.patch("/api/v1/jobs/{job_id}/archive")
def archive_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_deleted == False
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = 'archived'
    job.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "archived"}


# ─────────────────────────────────────────────
# Close Job
# ─────────────────────────────────────────────
@app.patch("/api/v1/jobs/{job_id}/close")
def close_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.is_deleted == False
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = 'closed'
    job.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "closed"}


# ─────────────────────────────────────────────
# Soft Delete Draft
# ─────────────────────────────────────────────
@app.delete("/api/v1/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.status == 'draft',
        models.JobPosting.is_deleted == False
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Draft not found or not deletable")
    job.is_deleted = True
    job.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "deleted"}

