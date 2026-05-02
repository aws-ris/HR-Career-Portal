from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database.database import engine, Base, get_db
from database import models
import schemas
import datetime

# Note: In production, use Alembic migrations instead of create_all
# create_all is safe here — it only creates tables that don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RIS Hiring Portal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Candidate Application Submission
# ─────────────────────────────────────────────
@app.post(
    "/api/v1/applications",
    response_model=schemas.CandidateResponse,
    status_code=status.HTTP_201_CREATED
)
def create_application(payload: schemas.CandidateCreate, db: Session = Depends(get_db)):

    # 1. Core candidate record
    candidate = models.CandidateMetadata(
        job_id           = payload.job_id,
        position_applied = payload.position_applied,
        admin_department = payload.admin_department,
        full_name        = payload.full_name,
        email            = payload.email,
        mobile_number    = payload.mobile_number,
        dob              = payload.dob,
        gender           = payload.gender,
        state            = payload.state,
        about            = payload.about,
        google_scholar_link = payload.google_scholar_link,
        current_status   = 'received',
    )
    # Determine highest education for future analytics
    highest = 'Bachelors'
    if payload.postgraduate: highest = 'Masters'
    if payload.doctorate: highest = 'PhD'
    candidate.highest_education = highest

    db.add(candidate)
    db.flush()  # assign UUID before FK references

    # 2. Schooling (1:1)
    db.add(models.Schooling(
        candidate_id         = candidate.id,
        class_x_percentage   = payload.schooling.class_x_percentage,
        class_xii_percentage = payload.schooling.class_xii_percentage,
    ))

    # 3. Graduation
    for g in payload.graduation:
        db.add(models.Graduation(
            candidate_id = candidate.id,
            university   = g.university,
            degree_name  = g.degree_name,
            score_type   = g.score_type,
            score_value  = g.score_value,
            entry_order  = g.entry_order,
        ))

    # 4. Postgraduate
    for pg in payload.postgraduate:
        db.add(models.Postgraduate(
            candidate_id = candidate.id,
            university   = pg.university,
            degree_name  = pg.degree_name,
            score_type   = pg.score_type,
            score_value  = pg.score_value,
            entry_order  = pg.entry_order,
        ))

    # 5. Doctorate
    for doc in payload.doctorate:
        db.add(models.Doctorate(
            candidate_id = candidate.id,
            university   = doc.university,
            thesis_title = doc.thesis_title,
            score_type   = doc.score_type,
            score_value  = doc.score_value,
            entry_order  = doc.entry_order,
        ))

    # 6. Books
    for b in payload.books:
        db.add(models.Book(
            candidate_id = candidate.id,
            title        = b.title,
            entry_order  = b.entry_order,
        ))

    # 7. Chapters
    for ch in payload.chapters:
        db.add(models.Chapter(
            candidate_id       = candidate.id,
            chapter_name       = ch.chapter_name,
            corresponding_book = ch.corresponding_book,
            entry_order        = ch.entry_order,
        ))

    # 8. Papers
    for p in payload.papers:
        db.add(models.Paper(
            candidate_id = candidate.id,
            title        = p.title,
            entry_order  = p.entry_order,
        ))

    # 9. Work Experiences
    for w in payload.work_experiences:
        db.add(models.WorkExperience(
            candidate_id = candidate.id,
            company_name = w.company_name,
            role         = w.role,
            start_date   = w.start_date,
            end_date     = w.end_date,
            is_current   = w.is_current,
            description  = w.description,
            entry_order  = w.entry_order,
        ))

    # 10. Seed status history
    db.add(models.ApplicationStatusHistory(
        candidate_id = candidate.id,
        status       = 'received',
        changed_by   = 'SYSTEM',
        notes        = 'Application submitted',
    ))

    try:
        db.commit()
        db.refresh(candidate)
        return candidate
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


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
    candidate = db.query(models.CandidateMetadata).filter(
        models.CandidateMetadata.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Application not found")
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

    total_applicants_year = db.query(models.CandidateMetadata).filter(
        extract('year', models.CandidateMetadata.submitted_at) == current_year,
        models.CandidateMetadata.is_deleted == False
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
    # 1. Gender Distribution
    gender_stats = db.query(
        models.CandidateMetadata.gender, 
        func.count(models.CandidateMetadata.id)
    ).filter(models.CandidateMetadata.is_deleted == False).group_by(models.CandidateMetadata.gender).all()

    # 2. State Distribution (Top 5)
    state_stats = db.query(
        models.CandidateMetadata.state, 
        func.count(models.CandidateMetadata.id)
    ).filter(models.CandidateMetadata.is_deleted == False).group_by(models.CandidateMetadata.state).order_by(func.count(models.CandidateMetadata.id).desc()).limit(5).all()

    # 3. Education Breakdown (Using Smart Column)
    edu_stats = db.query(
        models.CandidateMetadata.highest_education,
        func.count(models.CandidateMetadata.id)
    ).filter(
        models.CandidateMetadata.is_deleted == False
    ).group_by(models.CandidateMetadata.highest_education).all()

    # Convert to expected format with default values if missing
    edu_map = { r[0]: r[1] for r in edu_stats if r[0] }
    
    return {
        "gender": [{"name": g, "value": c} for g, c in gender_stats],
        "states": [{"name": s, "value": c} for s, c in state_stats],
        "education": [
            {"name": "PhD", "value": edu_map.get('PhD', 0)},
            {"name": "Masters", "value": edu_map.get('Masters', 0)},
            {"name": "Bachelors", "value": edu_map.get('Bachelors', 0)}
        ]
    }

@app.get("/api/v1/jobs/{job_id}/analytics")
def get_job_analytics(job_id: str, db: Session = Depends(get_db)):
    # 1. Gender Distribution
    gender_stats = db.query(
        models.CandidateMetadata.gender, 
        func.count(models.CandidateMetadata.id)
    ).filter(
        models.CandidateMetadata.job_id == job_id,
        models.CandidateMetadata.is_deleted == False
    ).group_by(models.CandidateMetadata.gender).all()

    # 2. State Distribution
    state_stats = db.query(
        models.CandidateMetadata.state, 
        func.count(models.CandidateMetadata.id)
    ).filter(
        models.CandidateMetadata.job_id == job_id,
        models.CandidateMetadata.is_deleted == False
    ).group_by(models.CandidateMetadata.state).order_by(func.count(models.CandidateMetadata.id).desc()).limit(5).all()

    # 3. Education Breakdown (Using Smart Column)
    edu_stats = db.query(
        models.CandidateMetadata.highest_education,
        func.count(models.CandidateMetadata.id)
    ).filter(
        models.CandidateMetadata.job_id == job_id,
        models.CandidateMetadata.is_deleted == False
    ).group_by(models.CandidateMetadata.highest_education).all()

    edu_map = { r[0]: r[1] for r in edu_stats if r[0] }

    return {
        "gender": [{"name": g, "value": c} for g, c in gender_stats],
        "states": [{"name": s, "value": c} for s, c in state_stats],
        "education": [
            {"name": "PhD", "value": edu_map.get('PhD', 0)},
            {"name": "Masters", "value": edu_map.get('Masters', 0)},
            {"name": "Bachelors", "value": edu_map.get('Bachelors', 0)}
        ]
    }

@app.get("/api/v1/candidates/{candidate_id}/full_profile")
def get_full_profile(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(models.CandidateMetadata).filter(
        models.CandidateMetadata.id == candidate_id,
        models.CandidateMetadata.is_deleted == False
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {
        "id": candidate.id,
        "full_name": candidate.full_name,
        "email": candidate.email,
        "mobile_number": candidate.mobile_number,
        "dob": candidate.dob.isoformat(),
        "gender": candidate.gender,
        "state": candidate.state,
        "position_applied": candidate.position_applied,
        "highest_education": candidate.highest_education,
        "current_status": candidate.current_status,
        "google_scholar_link": candidate.google_scholar_link,
        "ai_summary": candidate.ai_summary,
        "ai_match_score": candidate.ai_match_score,
        "schooling": candidate.schooling,
        "graduation": candidate.graduation,
        "postgraduate": candidate.postgraduate,
        "doctorate": candidate.doctorate,
        "work_experiences": candidate.work_experiences,
        "books": candidate.books,
        "chapters": candidate.chapters,
        "papers": candidate.papers
    }

from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func, and_, or_

class CandidateFilter(BaseModel):
    states: Optional[List[str]] = None
    genders: Optional[List[str]] = None
    ug_uni: Optional[str] = None
    min_ug_score: Optional[float] = None
    pg_uni: Optional[str] = None
    min_experience_years: Optional[float] = None
    min_papers: Optional[int] = None
    min_books: Optional[int] = None
    min_chapters: Optional[int] = None
    phd_thesis: Optional[str] = None
    phd_uni: Optional[str] = None

@app.post("/api/v1/jobs/{job_id}/candidates/filter")
@app.post("/api/v1/jobs/{job_id}/candidates/filter")
def filter_job_candidates(job_id: str, filters: CandidateFilter, db: Session = Depends(get_db)):
    try:
        clean_job_id = str(job_id).strip()
        
        # 1. Base query for IDs
        id_query = db.query(models.CandidateMetadata.id).filter(
            models.CandidateMetadata.job_id == clean_job_id,
            models.CandidateMetadata.is_deleted == False
        )

        # Apply filters to the ID query
        if filters.states and len(filters.states) > 0:
            id_filters = [models.CandidateMetadata.state.ilike(f"%{s}%") for s in filters.states]
            id_query = id_query.filter(or_(*id_filters))
        
        if filters.genders and len(filters.genders) > 0:
            id_query = id_query.filter(models.CandidateMetadata.gender.in_(filters.genders))

        if filters.ug_uni:
            grad_ids = db.query(models.Graduation.candidate_id).filter(models.Graduation.university.ilike(f"%{filters.ug_uni}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(grad_ids))
        
        if filters.min_ug_score is not None:
            grad_ids = db.query(models.Graduation.candidate_id).filter(models.Graduation.score_value >= float(filters.min_ug_score)).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(grad_ids))

        if filters.pg_uni:
            pg_ids = db.query(models.Postgraduate.candidate_id).filter(models.Postgraduate.university.ilike(f"%{filters.pg_uni}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(pg_ids))

        if filters.phd_uni:
            phd_ids = db.query(models.Doctorate.candidate_id).filter(models.Doctorate.university.ilike(f"%{filters.phd_uni}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(phd_ids))

        if filters.phd_thesis:
            phd_ids = db.query(models.Doctorate.candidate_id).filter(models.Doctorate.thesis_title.ilike(f"%{filters.phd_thesis}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(phd_ids))

        if filters.min_papers and filters.min_papers > 0:
            p_ids = db.query(models.Paper.candidate_id).group_by(models.Paper.candidate_id).having(func.count(models.Paper.id) >= filters.min_papers).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(p_ids))

        # 2. Get the final list of matching IDs
        res_ids = id_query.all()
        matching_ids = [r[0] for r in res_ids]
        
        with open("filter_debug.log", "a") as f:
            f.write(f"ID Query Result: Found {len(matching_ids)} IDs matching filters. IDs: {matching_ids}\n")
        
        if not matching_ids:
            return []

        # 3. Fetch full objects with joinedload only for those IDs
        candidates = db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.id.in_(matching_ids)
        ).options(
            joinedload(models.CandidateMetadata.graduation),
            joinedload(models.CandidateMetadata.postgraduate),
            joinedload(models.CandidateMetadata.doctorate),
            joinedload(models.CandidateMetadata.work_experiences),
            joinedload(models.CandidateMetadata.books),
            joinedload(models.CandidateMetadata.papers),
            joinedload(models.CandidateMetadata.chapters)
        ).all()

        result = []
        for c in candidates:
            d = {
                "id": c.id,
                "full_name": c.full_name,
                "email": c.email,
                "gender": c.gender,
                "state": c.state,
                "highest_education": c.highest_education,
                "current_status": c.current_status,
                "graduation": [{"degree_name": g.degree_name, "university": g.university, "score": f"{g.score_value} {g.score_type}"} for g in c.graduation],
                "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score": f"{p.score_value} {p.score_type}"} for p in c.postgraduate],
                "doctorate": [{"university": d.university, "thesis_title": d.thesis_title, "score": f"{d.score_value} {d.score_type}"} for d in c.doctorate],
                "work_experiences": [{"role": w.role, "company_name": w.company_name} for w in c.work_experiences],
                "books": [{"title": b.title} for b in c.books],
                "papers": [{"title": p.title} for p in c.papers],
                "chapters": [{"title": ch.chapter_name} for ch in c.chapters],
                "books_count": len(c.books),
                "papers_count": len(c.papers),
                "chapters_count": len(c.chapters)
            }
            result.append(d)
        
        result.sort(key=lambda x: x['full_name'])
        return result
    except Exception as e:
        with open("filter_debug.log", "a") as f:
            f.write(f"CRITICAL BACKEND ERROR: {str(e)}\n")
        raise HTTPException(status_code=500, detail=str(e))

        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs/{job_id}/candidates")
def get_job_candidates(job_id: str, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    candidates = db.query(models.CandidateMetadata).options(
        joinedload(models.CandidateMetadata.schooling),
        joinedload(models.CandidateMetadata.graduation),
        joinedload(models.CandidateMetadata.postgraduate),
        joinedload(models.CandidateMetadata.doctorate),
        joinedload(models.CandidateMetadata.work_experiences),
        joinedload(models.CandidateMetadata.books),
        joinedload(models.CandidateMetadata.papers)
    ).filter(
        models.CandidateMetadata.job_id == job_id,
        models.CandidateMetadata.is_deleted == False
    ).order_by(models.CandidateMetadata.submitted_at.desc()).all()
    
    # We need to manually convert these to dictionaries to ensure lazy attributes are loaded correctly
    result = []
    for c in candidates:
        d = {
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "gender": c.gender,
            "state": c.state,
            "highest_education": c.highest_education,
            "current_status": c.current_status,
            "graduation": [{"degree_name": g.degree_name, "university": g.university, "score": f"{g.score_value} {g.score_type}"} for g in c.graduation],
            "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score": f"{p.score_value} {p.score_type}"} for p in c.postgraduate],
            "doctorate": [{"university": d.university, "score": f"{d.score_value} {d.score_type}"} for d in c.doctorate],
            "work_experiences": [{"role": w.role, "company_name": w.company_name} for w in c.work_experiences],
            "books": [{"title": b.title} for b in c.books],
            "papers": [{"title": p.title} for p in c.papers],
            "chapters": [{"title": ch.chapter_name} for ch in c.chapters],
            "books_count": len(c.books),
            "papers_count": len(c.papers),
            "chapters_count": len(c.chapters)
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
        app_count = db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.job_id == job.id,
            models.CandidateMetadata.is_deleted == False
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

