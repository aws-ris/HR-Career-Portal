from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, or_
from database.database import engine, Base, get_db
from database import models
import schemas
import datetime
from pydantic import BaseModel
from typing import List, Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.auth import generate_token, verify_token

MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_RESUME_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def validate_resume_upload(filename: str, content_type: Optional[str], size_bytes: int):
    name = (filename or "").lower()
    file_ext = os.path.splitext(name)[1]
    mime_type = (content_type or "").split(";")[0].strip().lower()

    if file_ext not in ALLOWED_RESUME_EXTENSIONS and mime_type not in ALLOWED_RESUME_MIME_TYPES:
        raise ValueError("Resume upload must be a PDF or DOCX file.")

    if size_bytes > MAX_RESUME_FILE_SIZE_BYTES:
        raise ValueError("Resume file must be 5MB or smaller.")

    return True


def get_resume_media_type(filename: str, fallback_content_type: Optional[str] = None) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return "application/pdf"
    if name.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return (fallback_content_type or "application/octet-stream").split(";")[0].strip().lower()

auth_scheme = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str

def get_current_admin(
    token: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme)
):
    actual_token = None
    if credentials:
        actual_token = credentials.credentials
    elif token:
        actual_token = token
        
    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials"
        )
        
    username = verify_token(actual_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
    return username

# Note: In production, use Alembic migrations instead of create_all
# create_all is safe here — it only creates tables that don't exist yet
Base.metadata.create_all(bind=engine)

# Ensure default admin user exists in PostgreSQL DB
try:
    from utils.auth import hash_password
    with SessionLocal() as _db:
        _admin_user_env = os.getenv("HR_ADMIN_USERNAME", "hr_ris")
        _admin_pass_env = os.getenv("HR_ADMIN_PASSWORD", "ris@1234")
        _admin_rec = _db.query(models.AdminUser).filter(models.AdminUser.username == _admin_user_env).first()
        if not _admin_rec:
            _admin_rec = models.AdminUser(
                username=_admin_user_env,
                password_hash=hash_password(_admin_pass_env),
                full_name="HR Administrator"
            )
            _db.add(_admin_rec)
            _db.commit()
            print(f"✅ Seeded default admin user '{_admin_user_env}' in PostgreSQL database")
except Exception as _e:
    print(f"⚠️ Warning initializing admin user: {_e}")

app = FastAPI(title="RIS Hiring Portal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@app.post("/api/v1/auth/login")
@app.post("/v1/auth/login")
@app.post("/auth/login")
def login_admin(req: LoginRequest, db: Session = Depends(get_db)):
    from utils.auth import verify_password
    admin_user_env = os.getenv("HR_ADMIN_USERNAME", "hr_ris")
    admin_pass_env = os.getenv("HR_ADMIN_PASSWORD", "ris@1234")
    
    # 1. Database-backed authentication (Sole authority if user exists in DB)
    db_admin = db.query(models.AdminUser).filter(
        models.AdminUser.username == req.username,
        models.AdminUser.is_active == True
    ).first()
    
    if db_admin:
        if verify_password(req.password, db_admin.password_hash):
            db_admin.last_login_at = datetime.datetime.utcnow()
            db.commit()
            token = generate_token(db_admin.username)
            return {
                "status": "success",
                "token": token,
                "username": db_admin.username,
                "full_name": db_admin.full_name or "HR Administrator"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
    # 2. Environment variable fallback ONLY if user record does not exist in DB yet
    if req.username == admin_user_env and req.password == admin_pass_env:
        token = generate_token(req.username)
        return {"status": "success", "token": token, "username": admin_user_env, "full_name": "HR Administrator"}
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

@app.post("/api/v1/auth/change-password")
def change_admin_password(
    req: ChangePasswordRequest,
    current_username: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    from utils.auth import verify_password, hash_password
    if not req.new_password or len(req.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    db_admin = db.query(models.AdminUser).filter(models.AdminUser.username == current_username).first()
    admin_pass_env = os.getenv("HR_ADMIN_PASSWORD", "ris@1234")

    if db_admin:
        if not verify_password(req.old_password, db_admin.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        db_admin.password_hash = hash_password(req.new_password)
        db_admin.updated_at = datetime.datetime.utcnow()
    else:
        if req.old_password != admin_pass_env:
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        db_admin = models.AdminUser(
            username=current_username,
            password_hash=hash_password(req.new_password),
            full_name="HR Administrator"
        )
        db.add(db_admin)

    db.commit()
    return {"status": "success", "message": "Password updated successfully!"}

from fastapi import File, UploadFile
from fastapi.responses import FileResponse
import os

# AI Preloading disabled - using cloud API



@app.on_event("startup")
def startup_migration():
    """
    Automatically check and apply database schema migrations at startup.
    This runs every time the server boots, ensuring zero manual intervention.
    """
    from database.database import SessionLocal
    from sqlalchemy import text
    from database import models
    import datetime
    
    db = SessionLocal()
    try:
        print("Running automatic database schema migrations...")
        
        # 1. Add missing columns safely for both SQLite and PostgreSQL
        is_sqlite = "sqlite" in str(db.bind.url)
        
        column_migrations = [
            ("job_postings", "min_pay", "INTEGER"),
            ("job_postings", "max_pay", "INTEGER"),
            ("job_postings", "min_experience", "INTEGER"),
            ("job_postings", "max_experience", "INTEGER"),
            ("job_postings", "contract_period", "INTEGER"),
            ("job_postings", "job_mode", "VARCHAR(100)"),
            ("job_postings", "pay_band", "VARCHAR(50)"),
            ("job_postings", "pay_level", "VARCHAR(50)"),
            
            ("candidate_metadata", "country_code", "VARCHAR(10)"),
            ("candidate_metadata", "pincode", "VARCHAR(20)"),
            ("candidate_metadata", "age", "INTEGER"),
            ("candidate_metadata", "city", "VARCHAR(100)"),
            ("candidate_metadata", "last_salary", "FLOAT"),
            
            ("candidate_links_about", "about", "TEXT"),
            ("candidate_links_about", "sop", "TEXT"),
            ("candidate_links_about", "extracurriculars", "TEXT"),
            ("candidate_links_about", "pub_books", "INTEGER DEFAULT 0"),
            ("candidate_links_about", "pub_papers", "INTEGER DEFAULT 0"),
            ("candidate_links_about", "pub_chapters", "INTEGER DEFAULT 0"),
            ("candidate_links_about", "pub_reports", "INTEGER DEFAULT 0"),
            ("candidate_links_about", "pub_policy_briefs", "INTEGER DEFAULT 0"),
            ("candidate_links_about", "how_heard", "VARCHAR(500)"),
            
            ("candidate_resume_payload", "pdf_blob", "BLOB" if is_sqlite else "BYTEA"),
            ("application_tracking", "profile_score", "FLOAT"),
            ("candidate_schooling", "class_x_year", "INTEGER"),
            ("candidate_schooling", "class_xii_year", "INTEGER"),
            
            ("candidate_higher_education", "is_pursuing", "BOOLEAN DEFAULT FALSE"),
            ("candidate_higher_education", "duration_value", "INTEGER"),
            ("candidate_higher_education", "duration_unit", "VARCHAR(10)")
        ]
        
        if is_sqlite:
            for table, col, col_type in column_migrations:
                try:
                    res = db.execute(text(f"PRAGMA table_info({table});")).fetchall()
                    existing_cols = [r[1] for r in res]
                    if col not in existing_cols:
                        db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};"))
                        db.commit()
                        print(f"SQLite added column {col} to {table}")
                except Exception as sq_err:
                    db.rollback()
                    print(f"SQLite migration error for {table}.{col}: {sq_err}")
        else:
            for table, col, col_type in column_migrations:
                try:
                    db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                    db.commit()
                except Exception as pg_err:
                    db.rollback()
                    print(f"Postgres migration error for {table}.{col}: {pg_err}")
            
            # Automatically drop the category column from postgres
            try:
                db.execute(text("ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS category;"))
                db.commit()
                print("Postgres safely dropped category column.")
            except Exception as pg_err:
                db.rollback()
                print(f"Postgres drop error for category: {pg_err}")
        
        # 2. Automatically backfill candidate ages and categories
        try:
            candidates = db.query(models.CandidateMetadata).all()
            today = datetime.date.today()
            sample_cats = ["General (UR)", "OBC (Non-Creamy Layer)", "SC (Scheduled Caste)", "ST (Scheduled Tribe)", "EWS (Economically Weaker Section)"]
            backfilled_count = 0
            cat_count = 0
            for idx, cand in enumerate(candidates):
                if cand.dob and cand.age is None:
                    cand.age = today.year - cand.dob.year - ((today.month, today.day) < (cand.dob.month, cand.dob.day))
                    backfilled_count += 1

            if backfilled_count > 0 or cat_count > 0:
                db.commit()
                print(f"Auto-backfilled ages for {backfilled_count} and categories for {cat_count} candidates.")
        except Exception as e:
            print(f"Error backfilling candidate metadata: {e}")
            db.rollback()

        # 3. Auto-seed if the compliant G20 Professor job doesn't exist
        try:
            target_job = db.query(models.JobPosting).filter(
                models.JobPosting.title == "Professor (Trade & Investment Policy)"
            ).first()
            if not target_job:
                print("New G20/Blue Economy jobs not found in database. Triggering automatic database re-seed...")
                from scratch.seed_final_portal_data import main as run_seeder
                run_seeder()
        except Exception as e:
            print(f"Error checking/running automatic database seeder: {e}")
            
        print("Automatic database migrations completed successfully.")
    except Exception as e:
        print(f"Automatic migration critical error: {e}")
    finally:
        db.close()


# ─────────────────────────────────────────────
# DATABASE SYSTEM MIGRATION (TEMPORARY)
# ─────────────────────────────────────────────
@app.get("/api/v1/system/upgrade")
def upgrade_db():
    """
    Manual migration to add pdf_blob column to existing table.
    """
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE candidate_resume_payload ADD COLUMN IF NOT EXISTS pdf_blob BYTEA;"))
            conn.commit()
        return {"status": "success", "message": "Column 'pdf_blob' added to CandidateResumePayload table."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/system/migrate-job-terms")
def migrate_job_terms(db: Session = Depends(get_db)):
    """Temporary endpoint to migrate the job_postings table on Vercel."""
    from sqlalchemy import text
    try:
        queries = [
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS min_pay INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS max_pay INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS min_experience INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS max_experience INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS contract_period INTEGER;",
            "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS job_mode VARCHAR(50);"
        ]
        for q in queries:
            try:
                db.execute(text(q))
            except Exception as e:
                print(f"Migration step error: {e}")
        db.commit()
        return {"status": "success", "message": "Successfully migrated job_postings table"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/system/migrate-v2")
def migrate_v2_endpoint(db: Session = Depends(get_db)):
    """Temporary endpoint to migrate candidate tables for City/Pincode/Extracurriculars/Age on Vercel."""
    from sqlalchemy import text
    try:
        # 1. candidate_metadata pincode
        try:
            db.execute(text("ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);"))
        except Exception as e:
            print(f"Postgres migration metadata warning: {e}")
        
        # 2. candidate_links_about extracurriculars
        try:
            db.execute(text("ALTER TABLE candidate_links_about ADD COLUMN IF NOT EXISTS extracurriculars TEXT;"))
        except Exception as e:
            print(f"Postgres migration links warning: {e}")
            
        # 3. candidate_metadata age
        try:
            db.execute(text("ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS age INTEGER;"))
        except Exception as e:
            print(f"Postgres migration age warning: {e}")
            
        db.commit()
        
        # 4. Backfill calculated ages for existing candidates
        try:
            candidates = db.query(models.CandidateMetadata).all()
            today = datetime.date.today()
            for cand in candidates:
                if cand.dob and cand.age is None:
                    cand.age = today.year - cand.dob.year - ((today.month, today.day) < (cand.dob.month, cand.dob.day))
            db.commit()
        except Exception as e:
            print(f"Postgres migration age backfill warning: {e}")
            db.rollback()

        return {"status": "success", "message": "Successfully migrated candidate_metadata and candidate_links_about tables to V2, and populated candidate ages."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/system/backfill-scores")
def backfill_candidate_scores(db: Session = Depends(get_db)):
    """
    Backfill scores for all existing candidate applications in the database.
    """
    from sqlalchemy import text
    from utils.scoring import calculate_candidate_score
    try:
        # Ensure column exists (safety fallback)
        try:
            db.execute(text("ALTER TABLE application_tracking ADD COLUMN IF NOT EXISTS profile_score FLOAT;"))
            db.commit()
        except Exception as schema_err:
            print(f"Schema change warning: {schema_err}")
            db.rollback()

        # Query all application trackers
        trackers = db.query(models.ApplicationTracking).all()
        updated_count = 0

        for t in trackers:
            candidate = db.query(models.CandidateMetadata).filter(
                models.CandidateMetadata.id == t.candidate_id
            ).first()
            if not candidate:
                continue

            job_posting = db.query(models.JobPosting).filter(
                models.JobPosting.id == t.job_id
            ).first()
            min_exp = job_posting.min_experience if job_posting else 1.0

            score_res = calculate_candidate_score(candidate, min_exp)
            t.profile_score = score_res["total_score"]
            updated_count += 1

        db.commit()
        return {
            "status": "success",
            "message": f"Successfully backfilled profile scores for {updated_count} application records."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/system/resume-health")
def resume_health(db: Session = Depends(get_db)):
    """
    Diagnostic tool to verify Resume storage health.
    """
    total = db.query(models.CandidateResumePayload).count()
    with_blob = db.query(models.CandidateResumePayload).filter(models.CandidateResumePayload.pdf_blob != None).count()
    with_text = db.query(models.CandidateResumePayload).filter(models.CandidateResumePayload.raw_resume_text != None).count()
    
    return {
        "total_resumes": total,
        "with_binary_blob": with_blob,
        "with_extracted_text": with_text,
        "health_score": f"{(with_blob/total*100 if total > 0 else 0):.1f}%"
    }

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

@app.get("/api/v1/system/seed-5-per-job")
def seed_5_per_job(db: Session = Depends(get_db)):
    """
    Internal trigger to inject 5 candidates for every active job posting.
    """
    try:
        from inject_5_per_job import inject_candidates
        inject_candidates()
        return {"status": "success", "message": "Successfully injected 5 diverse candidates per job posting into PostgreSQL!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/wipe-c")
def wipe_candidates(db: Session = Depends(get_db)):
    """
    Safely purges all candidates and their related data (Metadata, Apps, Resumes) 
    while preserving the Job Postings.
    """
    try:
        # Deleting from CandidateMetadata triggers cascading deletes for all related tables
        count = db.query(models.CandidateMetadata).delete()
        db.commit()
        return {"status": "success", "message": f"Successfully wiped {count} candidates and all associated records."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/seed-c")
def seed_candidates(db: Session = Depends(get_db)):
    """
    Final, schema-perfect seeder with Full Name support.
    """
    import os
    import random
    from datetime import date, datetime
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
    arjun_path = os.path.join(os.path.dirname(__file__), "sample_resume_arjun.pdf")
    
    all_resumes = [{"path": arjun_path, "domain": "International Trade & G20 Policy", "name": "Arjun Subramanian"}]
    for rf in resume_files:
        domain_name = random.choice(list(job_map.keys()))
        # FIX: Capture FULL NAME including surname from filename logic (CV_idx_First_Last.pdf)
        full_name_raw = " ".join(rf.split("_")[2:]).replace(".pdf", "").replace("_", " ")
        all_resumes.append({"path": os.path.join(resume_dir, rf), "domain": domain_name, "name": full_name_raw})

    created_count = 0
    for idx, res in enumerate(all_resumes):
        email = f"{res['name'].lower().replace(' ', '.')}.{idx}@policy-res.in"
        if db.query(models.CandidateMetadata).filter(models.CandidateMetadata.email == email).first(): continue

        # READ THE ACTUAL PDF BYTES
        pdf_data = None
        try:
            with open(res['path'], "rb") as f:
                pdf_data = f.read()
        except:
            pass

        tier = random.choice(['phd', 'postgrad', 'undergrad'])
        
        meta = models.CandidateMetadata(
            full_name=res['name'],
            email=email,
            mobile_no=f"9{random.randint(100000000, 999999999)}",
            dob=date(1995, 5, 20),
            gender=random.choice(["Male", "Female"]),
            city=random.choice(["New Delhi", "Mumbai", "Bengaluru", "Chennai"]),
            state=random.choice(["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu"]),
            pincode=random.choice(["110001", "400001", "560001", "600001"]),
            years_of_experience=float(random.randint(1, 12))
        )
        db.add(meta)
        db.flush()

        links_about = models.CandidateLinksAbout(
            candidate_id=meta.id,
            about=f"Initial record for {res['name']}",
            google_scholar="https://scholar.google.com/citations?user=xyz",
            linkedin="https://linkedin.com/in/xyz"
        )
        db.add(links_about)

        app_track = models.ApplicationTracking(
            candidate_id=meta.id,
            job_id=job_map.get(res['domain']),
            position_applied="Consultant" if tier == 'phd' else "Research Assistant",
            current_status='received'
        )
        db.add(app_track)

        # 3. Resume Payload (Persistent Binary Storage)
        payload = models.CandidateResumePayload(
            candidate_id=meta.id,
            resume_path=f"uploads/{os.path.basename(res['path'])}",
            pdf_blob=pdf_data,
            raw_resume_text=f"Initial record for {res['name']}"
        )
        db.add(payload)
        db.flush()

        if tier == 'phd':
            db.add(models.CandidateHigherEducation(candidate_id=meta.id, level='phd', degree_name='Ph.D. Economics', university='JNU', score_type='CGPA', score_value=9.0, grad_year=2021, entry_order=1))
        if tier in ['phd', 'postgrad']:
            db.add(models.CandidateHigherEducation(candidate_id=meta.id, level='postgrad', degree_name='M.A. Economics', university='DSE', score_type='Percentage', score_value=80.0, grad_year=2016, entry_order=2))
        
        db.add(models.CandidateHigherEducation(candidate_id=meta.id, level='undergrad', degree_name='B.A. Economics', university='DU', score_type='Percentage', score_value=75.0, grad_year=2014, entry_order=3))

        db.add(models.CandidateWorkExperience(
            candidate_id=meta.id, 
            role="Research Fellow", 
            company_name="Policy Institute", 
            start_date=date(2018, 1, 1),
            entry_order=1
        ))

        db.add(models.CandidatePublication(
            candidate_id=meta.id, 
            pub_type='paper', 
            title=f"Strategic Analysis of {res['domain']}", 
            entry_order=1
        ))

        created_count += 1

    db.commit()
    return {"status": "success", "message": f"Successfully injected {created_count} candidates with FULL NAMES into Normalized Schema."}

# ─────────────────────────────────────────────
# Public Job Board Access

# ─────────────────────────────────────────────
# Public Job Board Access

# ─────────────────────────────────────────────
# Public Job Board Access
# ─────────────────────────────────────────────

@app.get("/api/v1/public/jobs")
@app.get("/v1/public/jobs")
@app.get("/public/jobs")
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
        "requirements": j.requirements,
        "min_pay": j.min_pay,
        "max_pay": j.max_pay,
        "min_experience": j.min_experience,
        "max_experience": j.max_experience,
        "contract_period": j.contract_period,
        "job_mode": j.job_mode
    } for j in jobs]

@app.get("/api/v1/public/jobs/{job_id}")
def get_public_job_detail(job_id: str, db: Session = Depends(get_db)):
    """
    Returns full public details for a specific job if it is open.
    """
    job = db.query(models.JobPosting).filter(
        models.JobPosting.id == job_id,
        models.JobPosting.status == 'open',
        models.JobPosting.is_deleted == False
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or closed")
        
    return {
        "id": job.id,
        "title": job.title,
        "position": job.position,
        "division": job.division,
        "description": job.description,
        "requirements": job.requirements,
        "deadline": job.deadline,
        "min_pay": job.min_pay,
        "max_pay": job.max_pay,
        "min_experience": job.min_experience,
        "max_experience": job.max_experience,
        "contract_period": job.contract_period,
        "job_mode": job.job_mode
    }

def async_score_candidate_bg(candidate_id: str, app_tracking_id: str, job_id: Optional[str]):
    db = SessionLocal()
    try:
        candidate = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.id == candidate_id).first()
        app_tracking = db.query(models.ApplicationTracking).filter(models.ApplicationTracking.id == app_tracking_id).first()
        if candidate and app_tracking:
            job_posting = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first() if job_id else None
            min_exp = job_posting.min_experience if job_posting else 1.0
            from utils.scoring import calculate_candidate_score
            score_res = calculate_candidate_score(candidate, min_exp)
            app_tracking.profile_score = score_res["total_score"]
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Async Scoring Error] {e}")
    finally:
        db.close()

# ─────────────────────────────────────────────
# Candidate Application Submission
# ─────────────────────────────────────────────
@app.post(
    "/api/v1/applications",
    response_model=schemas.CandidateResponse,
    status_code=status.HTTP_201_CREATED
)
def create_application(payload: schemas.CandidateCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Validate that the job is open and accepts applications
    if payload.job_id:
        job = db.query(models.JobPosting).filter(
            models.JobPosting.id == payload.job_id,
            models.JobPosting.is_deleted == False
        ).first()
        if not job or job.status != 'open':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job posting is closed or no longer accepting applications."
            )

    try:
        # Check if candidate email already exists (Error prevention & hassle-free submission)
        candidate = db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.email == payload.email
        ).first()
        
        is_new_candidate = False
        if candidate:
            # Update existing candidate details
            candidate.full_name = payload.full_name
            candidate.country_code = payload.country_code
            candidate.mobile_no = payload.mobile_no
            candidate.dob = payload.dob
            candidate.gender = payload.gender
            candidate.city = payload.city
            candidate.state = payload.state
            candidate.pincode = payload.pincode
            candidate.years_of_experience = payload.years_of_experience
            candidate.last_salary = payload.last_salary
            
            # Clean up old relations to prevent duplicates
            if candidate.schooling:
                db.delete(candidate.schooling)
            if candidate.links_about:
                db.delete(candidate.links_about)
            
            db.query(models.CandidateHigherEducation).filter_by(candidate_id=candidate.id).delete()
            db.query(models.CandidatePublication).filter_by(candidate_id=candidate.id).delete()
            db.query(models.CandidateWorkExperience).filter_by(candidate_id=candidate.id).delete()
            db.flush()
        else:
            is_new_candidate = True
            # Create new candidate record
            candidate = models.CandidateMetadata(
                full_name           = payload.full_name,
                email               = payload.email,
                country_code        = payload.country_code,
                mobile_no           = payload.mobile_no,
                dob                 = payload.dob,
                gender              = payload.gender,
                city                = payload.city,
                state               = payload.state,
                pincode             = payload.pincode,
                years_of_experience = payload.years_of_experience,
                last_salary         = payload.last_salary
            )
            db.add(candidate)
            db.flush()

        # Create or update application tracking record
        app_tracking = None
        if not is_new_candidate:
            app_tracking = db.query(models.ApplicationTracking).filter_by(
                candidate_id=candidate.id,
                job_id=payload.job_id
            ).first()
            
        if app_tracking:
            app_tracking.position_applied = payload.position_applied
            app_tracking.admin_department = payload.admin_department
            app_tracking.current_status = 'received'
            app_tracking.updated_at = datetime.datetime.utcnow()
        else:
            app_tracking = models.ApplicationTracking(
                candidate_id     = candidate.id,
                job_id           = payload.job_id,
                position_applied = payload.position_applied,
                admin_department = payload.admin_department,
                current_status   = 'received'
            )
            db.add(app_tracking)
        db.flush()

        # Re-add relations (schooling, links_about, higher_education, publications, work_experiences)
        # 3. Candidate Links & About
        links_about = models.CandidateLinksAbout(
            candidate_id   = candidate.id,
            about          = payload.about,
            sop            = payload.sop,
            google_scholar = payload.google_scholar,
            linkedin       = payload.linkedin,
            pub_books      = payload.pub_books,
            pub_papers     = payload.pub_papers,
            pub_chapters   = payload.pub_chapters,
            pub_reports    = payload.pub_reports,
            pub_policy_briefs = payload.pub_policy_briefs,
            how_heard      = getattr(payload, 'how_heard', None)
        )
        db.add(links_about)

        # 4. Schooling (1:1)
        db.add(models.CandidateSchooling(
            candidate_id          = candidate.id,
            class_x_school        = payload.schooling.class_x_school,
            class_x_board         = payload.schooling.class_x_board,
            class_x_score_type    = payload.schooling.class_x_score_type.value if hasattr(payload.schooling.class_x_score_type, 'value') else payload.schooling.class_x_score_type,
            class_x_score_value   = payload.schooling.class_x_score_value,
            class_x_year          = payload.schooling.class_x_year,
            class_xii_school       = payload.schooling.class_xii_school,
            class_xii_board        = payload.schooling.class_xii_board,
            class_xii_score_type   = payload.schooling.class_xii_score_type.value if hasattr(payload.schooling.class_xii_score_type, 'value') else payload.schooling.class_xii_score_type,
            class_xii_score_value  = payload.schooling.class_xii_score_value,
            class_xii_year         = payload.schooling.class_xii_year,
        ))

        # 5. Higher Education (1:N)
        for edu in payload.higher_education:
            db.add(models.CandidateHigherEducation(
                candidate_id   = candidate.id,
                level          = edu.level,
                university     = edu.university,
                degree_name    = edu.degree_name,
                score_type     = edu.score_type,
                score_value    = edu.score_value,
                grad_year      = edu.grad_year,
                is_pursuing    = getattr(edu, 'is_pursuing', False) or False,
                duration_value = getattr(edu, 'duration_value', None),
                duration_unit  = getattr(edu, 'duration_unit', None),
                entry_order    = edu.entry_order,
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

        db.flush()

        # 8. Seed status history
        db.add(models.ApplicationStatusHistory(
            application_tracking_id = app_tracking.id,
            status                 = 'received',
            changed_by             = 'SYSTEM',
            notes                  = 'Application updated/resubmitted' if not is_new_candidate else 'Application submitted',
        ))

        db.commit()
        db.refresh(candidate)
        
        # 9. Offload AI Scoring & Tokenization to BackgroundTasks (Ultra-fast <30ms submission!)
        background_tasks.add_task(async_score_candidate_bg, candidate.id, app_tracking.id, payload.job_id)
        background_tasks.add_task(tokenize_candidate_bg, candidate.id, payload.job_id)
        
        # 10. Trigger n8n webhook event in background
        from utils.webhooks import trigger_n8n_event
        trigger_n8n_event(background_tasks, "candidate-applied", {
            "candidate_id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "mobile_no": candidate.mobile_no,
            "position_applied": payload.position_applied,
            "admin_department": payload.admin_department,
            "job_id": payload.job_id,
            "how_heard": getattr(payload, 'how_heard', None)
        })

        return candidate
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


def tokenize_candidate(db: Session, candidate: models.CandidateMetadata):
    """
    Tokenizes candidate education, work experience, and publications to populate the TokenRegistry.
    This provides autocomplete suggestions for the HR filter interface.
    """
    # Get all applications to know which jobs to register these tokens for
    applications = db.query(models.ApplicationTracking).filter(
        models.ApplicationTracking.candidate_id == candidate.id
    ).all()
    
    job_ids = [app.job_id for app in applications if app.job_id]
    if not job_ids:
        return

    # Extract raw values and map to token types
    tokens_to_add = []
    
    # 1. Higher Education
    if candidate.higher_education:
        for edu in candidate.higher_education:
            if edu.university:
                tokens_to_add.append(('university', edu.university))
            if edu.degree_name:
                tokens_to_add.append(('degree', edu.degree_name))
                
    # 2. Work Experience
    if candidate.work_experiences:
        for exp in candidate.work_experiences:
            if exp.company_name:
                tokens_to_add.append(('company', exp.company_name))
            if exp.role:
                tokens_to_add.append(('role', exp.role))
                
    # 3. Publications
    if candidate.publications:
        for pub in candidate.publications:
            if pub.title:
                tokens_to_add.append(('pub_title', pub.title))

    for job_id in job_ids:
        for token_type, value in tokens_to_add:
            if not value or not value.strip():
                continue
            val_clean = value.strip()
            val_norm = val_clean.lower()
            
            # Check if this token already exists for this job and type
            existing = db.query(models.TokenRegistry).filter(
                models.TokenRegistry.job_id == job_id,
                models.TokenRegistry.token_type == token_type,
                models.TokenRegistry.normalized == val_norm
            ).first()
            
            if existing:
                existing.frequency += 1
            else:
                db.add(models.TokenRegistry(
                    job_id=job_id,
                    token_type=token_type,
                    token_value=val_clean,
                    normalized=val_norm,
                    frequency=1
                ))
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving tokens in tokenize_candidate: {e}")


def tokenize_candidate_bg(candidate_id: str, job_id: Optional[str] = None):
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
    dependencies=[Depends(get_current_admin)],
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


@app.get("/api/v1/jobs/{job_id}", response_model=schemas.JobPostingResponse, dependencies=[Depends(get_current_admin)])
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
@app.get("/api/v1/hr/stats", dependencies=[Depends(get_current_admin)])
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

@app.get("/api/v1/hr/analytics/global", dependencies=[Depends(get_current_admin)])
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

@app.get("/api/v1/jobs/{job_id}/analytics", dependencies=[Depends(get_current_admin)])
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

@app.get("/api/v1/candidates/{candidate_id}/full_profile", dependencies=[Depends(get_current_admin)])
def get_full_profile(candidate_id: str, job_id: Optional[str] = None, db: Session = Depends(get_db)):
    candidate = db.query(models.CandidateMetadata).options(
        joinedload(models.CandidateMetadata.schooling),
        joinedload(models.CandidateMetadata.higher_education),
        joinedload(models.CandidateMetadata.publications),
        joinedload(models.CandidateMetadata.work_experiences),
        joinedload(models.CandidateMetadata.links_about),
        joinedload(models.CandidateMetadata.applications),
    ).filter(
        models.CandidateMetadata.id == candidate_id
    ).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    min_exp = 1.0
    if job_id:
        job_posting = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
        if job_posting and job_posting.min_experience is not None:
            min_exp = job_posting.min_experience
    else:
        # Fallback: check if they have applied to any job, use the latest application's min_experience
        latest_app = db.query(models.ApplicationTracking).filter(
            models.ApplicationTracking.candidate_id == candidate_id
        ).order_by(models.ApplicationTracking.submitted_at.desc()).first()
        if latest_app and latest_app.job_id:
            job_posting = db.query(models.JobPosting).filter(models.JobPosting.id == latest_app.job_id).first()
            if job_posting and job_posting.min_experience is not None:
                min_exp = job_posting.min_experience

    from utils.scoring import calculate_candidate_score
    score_res = calculate_candidate_score(candidate, min_exp)

    schooling_data = None
    if candidate.schooling:
        schooling_data = {
            "class_x_school": candidate.schooling.class_x_school,
            "class_x_board": candidate.schooling.class_x_board,
            "class_x_score_type": candidate.schooling.class_x_score_type,
            "class_x_score_value": candidate.schooling.class_x_score_value,
            "class_x_year": getattr(candidate.schooling, "class_x_year", None),
            "class_xii_school": candidate.schooling.class_xii_school,
            "class_xii_board": candidate.schooling.class_xii_board,
            "class_xii_score_type": candidate.schooling.class_xii_score_type,
            "class_xii_score_value": candidate.schooling.class_xii_score_value,
            "class_xii_year": getattr(candidate.schooling, "class_xii_year", None)
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
        "pincode": candidate.pincode,
        "age": candidate.age or (
            (datetime.date.today().year - candidate.dob.year - ((datetime.date.today().month, datetime.date.today().day) < (candidate.dob.month, candidate.dob.day)))
            if candidate.dob else None
        ),
        "years_of_experience": candidate.years_of_experience,
        "profile_score": score_res["total_score"],
        "profile_score_breakdown": score_res["breakdown"],
        "about": candidate.links_about.about if candidate.links_about else None,
        "google_scholar": candidate.links_about.google_scholar if candidate.links_about else None,
        "linkedin": candidate.links_about.linkedin if candidate.links_about else None,
        "pub_books": candidate.links_about.pub_books if candidate.links_about else 0,
        "pub_papers": candidate.links_about.pub_papers if candidate.links_about else 0,
        "pub_chapters": candidate.links_about.pub_chapters if candidate.links_about else 0,
        "pub_reports": candidate.links_about.pub_reports if candidate.links_about else 0,
        "pub_policy_briefs": candidate.links_about.pub_policy_briefs if candidate.links_about else 0,
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
        } for app in candidate.applications]
    }


@app.get("/api/v1/applications/{candidate_id}/resume/download", dependencies=[Depends(get_current_admin)])
def download_resume(candidate_id: str, preview: bool = False, db: Session = Depends(get_db)):
    from fastapi.responses import RedirectResponse, Response
    payload = db.query(models.CandidateResumePayload).filter(
        models.CandidateResumePayload.candidate_id == candidate_id
    ).first()
    
    if not payload or not payload.resume_path:
        raise HTTPException(status_code=404, detail="Resume record not found for candidate")
        
    filename = os.path.basename(payload.resume_path)
    
    # ── Single Source of Truth: Pure AWS S3 Storage ──
    S3_BUCKET = os.getenv("S3_BUCKET_NAME")
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "ap-south-1")

    if S3_BUCKET:
        try:
            import boto3
            from botocore.client import Config
            s3_kwargs = {"region_name": aws_region, "config": Config(signature_version='s3v4')}
            if aws_access_key and aws_secret_key:
                s3_kwargs["aws_access_key_id"] = aws_access_key
                s3_kwargs["aws_secret_access_key"] = aws_secret_key

            s3_client = boto3.client('s3', **s3_kwargs)
            disposition = "inline" if preview else "attachment"
            
            # Generate secure temporary presigned download URL directly from S3
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': payload.resume_path,
                    'ResponseContentDisposition': f'{disposition}; filename="{filename}"'
                },
                ExpiresIn=900
            )
            return RedirectResponse(url=presigned_url)
        except Exception as e:
            print(f"[S3 Download Error] Failed to generate S3 pre-signed URL: {e}")
            raise HTTPException(status_code=500, detail=f"S3 Download Failed: {str(e)}")

    # Local fallback if S3 bucket is not configured
    if payload.resume_path and os.path.exists(payload.resume_path):
        headers = {"Content-Disposition": f'{"inline" if preview else "attachment"}; filename="{filename}"'}
        return FileResponse(path=payload.resume_path, headers=headers, media_type="application/pdf")
        
    raise HTTPException(status_code=404, detail="S3 bucket not configured or resume file missing")


def process_and_save_resume(db: Session, candidate_id: str, file_bytes: bytes, filename: str, job_id: Optional[str] = None):
    candidate = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.id == candidate_id).first()
    if not candidate:
        raise ValueError(f"Candidate {candidate_id} not found")

    # ── Job Categorization Folder Naming ──
    job_folder_name = "general_applications"
    app_rec = None
    if job_id:
        app_rec = db.query(models.ApplicationTracking).filter_by(candidate_id=candidate_id, job_id=job_id).first()
    if not app_rec:
        app_rec = db.query(models.ApplicationTracking).filter_by(candidate_id=candidate_id).order_by(models.ApplicationTracking.submitted_at.desc()).first()

    if app_rec:
        raw_title = "general_applications"
        if app_rec.job and app_rec.job.title:
            raw_title = app_rec.job.title
        elif app_rec.position_applied:
            raw_title = app_rec.position_applied
            
        import re
        job_folder_name = re.sub(r'[^a-zA-Z0-9_-]', '_', raw_title).strip('_')
        job_folder_name = re.sub(r'_+', '_', job_folder_name)

    content_type = get_resume_media_type(filename)
    S3_BUCKET = os.getenv("S3_BUCKET_NAME")
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "ap-south-1")
    
    # Categorized S3 Path Structure: jobs/{job_folder}/resumes/{candidate_id}_{filename}
    s3_key = f"jobs/{job_folder_name}/resumes/{candidate_id}_{filename}"

    if not S3_BUCKET:
        raise ValueError("AWS S3 bucket is not configured. Please set S3_BUCKET_NAME in environment.")

    # ── Direct AWS S3 Categorized Upload ──
    try:
        import boto3
        from botocore.client import Config
        s3_kwargs = {"region_name": aws_region, "config": Config(signature_version='s3v4')}
        if aws_access_key and aws_secret_key:
            s3_kwargs["aws_access_key_id"] = aws_access_key
            s3_kwargs["aws_secret_access_key"] = aws_secret_key

        s3_client = boto3.client('s3', **s3_kwargs)
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )
        print(f"✅ [S3 Categorized Upload] Saved under job folder: '{s3_key}'")
    except Exception as e:
        print(f"❌ [S3 Upload Error] Failed to upload resume to S3: {e}")
        raise ValueError(f"S3 Upload Failed: {str(e)}")

    # Store ONLY S3 path reference in PostgreSQL
    payload = db.query(models.CandidateResumePayload).filter(models.CandidateResumePayload.candidate_id == candidate_id).first()
    if payload:
        payload.resume_path = s3_key
        payload.pdf_blob = None
    else:
        payload = models.CandidateResumePayload(
            candidate_id=candidate_id, 
            resume_path=s3_key, 
            pdf_blob=None
        )
        db.add(payload)

    db.commit()
    return s3_key, s3_key

@app.post("/api/v1/applications/{candidate_id}/resume")
async def upload_resume(candidate_id: str, job_id: Optional[str] = None, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        validate_resume_upload(file.filename, file.content_type, len(content))
        saved_path, file_path = process_and_save_resume(db, candidate_id, content, file.filename, job_id=job_id)
        return {"status": "success", "resume_path": saved_path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
    min_reports: Optional[int] = None
    min_policy_briefs: Optional[int] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    min_x_score: Optional[float] = None
    min_xii_score: Optional[float] = None
    role_keyword: Optional[str] = None
    company_keyword: Optional[str] = None
    # Score type awareness for education and schooling filters
    ug_score_type: Optional[str] = None    # 'Percentage' or 'CGPA'
    pg_score_type: Optional[str] = None
    phd_score_type: Optional[str] = None
    x_score_type: Optional[str] = None
    xii_score_type: Optional[str] = None


@app.get("/api/v1/universities")
def get_universities():
    from utils.scoring import UNIVERSITIES_DB
    return sorted(list(UNIVERSITIES_DB.keys()))


class ExportRequest(BaseModel):
    filters: CandidateFilter
    format: str # 'csv' or 'xlsx'
    columns: List[str]
    report_type: Optional[str] = 'detailed'


@app.post("/api/v1/jobs/{job_id}/candidates/export", dependencies=[Depends(get_current_admin)])
def export_job_candidates(job_id: str, req: ExportRequest, db: Session = Depends(get_db)):
    from io import StringIO, BytesIO
    import csv
    from fastapi.responses import StreamingResponse
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill, Border, Side

    try:
        # 1. Fetch filtered candidates using the existing engine
        candidates_data = filter_job_candidates(job_id, req.filters, db)
        if not candidates_data:
            # Return empty response with headers
            if req.format == 'csv':
                return StreamingResponse(iter(["No candidates found"]), media_type="text/csv")
            else:
                output = BytesIO()
                wb = Workbook()
                wb.save(output)
                output.seek(0)
                return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        def format_score(value, score_type):
            if not value:
                return ""
            stype = str(score_type).strip().lower() if score_type else ""
            if "percent" in stype:
                if value == int(value):
                    return f"{int(value)}%"
                return f"{value}%"
            elif "cgpa" in stype:
                if value == int(value):
                    return f"{int(value)} CGPA"
                return f"{value} CGPA"
            else:
                suffix = f" {score_type}" if score_type else ""
                if value == int(value):
                    return f"{int(value)}{suffix}"
                return f"{value}{suffix}"

        def format_schooling_score(schooling, level):
            if not schooling:
                return ""
            if level == 'x':
                val = getattr(schooling, 'class_x_score_value', None)
                stype = getattr(schooling, 'class_x_score_type', '')
            else:
                val = getattr(schooling, 'class_xii_score_value', None)
                stype = getattr(schooling, 'class_xii_score_type', '')
                
            if val is None:
                return ""
            val_str = f"{int(val)}" if val == int(val) else f"{val}"
            if stype == 'Percentage':
                return f"{val_str}%"
            elif stype == 'CGPA':
                return f"{val_str} CGPA"
            return val_str

        def calculate_age(dob):
            if not dob:
                return ""
            try:
                import datetime
                if isinstance(dob, str):
                    dob_date = datetime.date.fromisoformat(dob[:10])
                else:
                    dob_date = dob
                today = datetime.date.today()
                return today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
            except Exception:
                return ""

        # 2. Build Headers and Rows based on report type
        if req.report_type == 'standardized':
            headers = [
                "Full Name", "Date of Birth", "Age", "Email", "Mobile No", "Gender", "City / State",
                "Position Applied", "Admin Department", "Current Status", "Source",
                "LinkedIn Link", "Class X Score", "Class X Year", "Class XII Score", "Class XII Year", 
                "Bachelors (UG)", "Bachelors Score", "Bachelors Year",
                "Masters (PG)", "Masters Score", "Masters Year",
                "Doctorate (PhD)", "Doctorate Score", "Doctorate Year",
                "Total Exp (Yrs)", "Latest Employment"
            ]
            
            rows_to_write = []
            for c in candidates_data:
                full_c = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.id == c['id']).first()
                if not full_c: continue
                
                # Fetch qualifications
                ug = next((e for e in full_c.higher_education if e.level == 'undergrad'), None)
                pg = next((e for e in full_c.higher_education if e.level == 'postgrad'), None)
                phd = next((e for e in full_c.higher_education if e.level == 'phd'), None)
                
                # Get latest work experience (by date or highest order)
                latest_work = None
                if full_c.work_experiences:
                    latest_work = max(full_c.work_experiences, key=lambda x: x.start_date)
                
                ug_text = ""
                if ug:
                    ug_text = f"{ug.degree_name} ({ug.university})" if ug.university else ug.degree_name
                
                pg_text = ""
                if pg:
                    pg_text = f"{pg.degree_name} ({pg.university})" if pg.university else pg.degree_name
                
                phd_text = ""
                if phd:
                    phd_text = f"{phd.degree_name} ({phd.university})" if phd.university else phd.degree_name
                
                latest_work_text = ""
                if latest_work:
                    latest_work_text = f"{latest_work.role} ({latest_work.company_name})"
                
                latest_app = full_c.applications[-1] if getattr(full_c, 'applications', None) else None
                pos_applied = (latest_app.position_applied if latest_app else None) or c.get('position_applied', '') or ""
                admin_dept = (latest_app.admin_department if latest_app else None) or c.get('admin_department', '') or ""
                current_stat = (latest_app.current_status if latest_app else None) or c.get('current_status', 'received')

                row = [
                    full_c.full_name,
                    str(full_c.dob) if full_c.dob else "",
                    calculate_age(full_c.dob) if full_c.dob else (full_c.age or ""),
                    full_c.email,
                    f"{full_c.country_code or ''} {full_c.mobile_no}".strip(),
                    full_c.gender or "",
                    f"{full_c.city or ''} / {full_c.state or ''}".strip(" /"),
                    pos_applied,
                    admin_dept,
                    current_stat,
                    (full_c.links_about.how_heard if full_c.links_about else "") or "",
                    (full_c.links_about.linkedin if full_c.links_about else "") or "",
                    format_schooling_score(full_c.schooling, "x"),
                    full_c.schooling.class_x_year if (full_c.schooling and full_c.schooling.class_x_year) else "",
                    format_schooling_score(full_c.schooling, "xii"),
                    full_c.schooling.class_xii_year if (full_c.schooling and full_c.schooling.class_xii_year) else "",
                    ug_text,
                    format_score(ug.score_value, ug.score_type) if ug else "",
                    ug.grad_year if ug else "",
                    pg_text,
                    format_score(pg.score_value, pg.score_type) if pg else "",
                    pg.grad_year if pg else "",
                    phd_text,
                    format_score(phd.score_value, phd.score_type) if phd else "",
                    phd.grad_year if phd else "",
                    full_c.years_of_experience or 0.0,
                    latest_work_text
                ]
                rows_to_write.append(row)
                
            merge_ranges = []
            candidate_groups = []
            single_line_rows = []
        else:
            # Detailed Report (Grouped Roster with Complete Input Fields & Booleans)
            headers = [
                # Personal & Contact (1-10)
                "Full Name", "Email", "Country Code", "Mobile No", "Date of Birth", "Age", "Gender", "State", "City", "Pincode",
                # Application & Source (11-15)
                "Position Applied", "Admin Department", "Current Status", "Submitted Date", "Source (Where heard)",
                # Profiles & SOP (16-18)
                "Statement of Purpose (SOP)", "Google Scholar Link", "LinkedIn Link",
                # Boolean Indicator Flags (19-27)
                "Has Work Experience", "Currently Working", "Has Higher Education", "Currently Pursuing Degree", 
                "Has Doctorate (PhD)", "Has Master Degree (PG)", "Has Bachelor Degree (UG)", "Has Diploma", "Has Publications",
                # Schooling Class X & XII (28-35)
                "Class X School", "Class X Board", "Class X Score", "Class X Year",
                "Class XII School", "Class XII Board", "Class XII Score", "Class XII Year",
                # Graduation (36-40)
                "Graduation Univ", "Graduation Degree", "Graduation Score", "Graduation Year", "Graduation Pursuing",
                # Postgrad (41-45)
                "Postgrad Univ", "Postgrad Degree", "Postgrad Score", "Postgrad Year", "Postgrad Pursuing",
                # PhD (46-50)
                "PhD Univ", "PhD Thesis / Spec", "PhD Score", "PhD Year", "PhD Pursuing",
                # Diploma (51-55)
                "Diploma Institute", "Diploma Degree / Type", "Diploma Score", "Diploma Year", "Diploma Pursuing",
                # Experience & Salary (56-61)
                "Total Exp (Yrs)", "Last Salary (LPA)", "Work Organization", "Work Designation", "Work Start Date", "Work End Date",
                # Publications (62-67)
                "Books Count", "Peer-Reviewed Papers Count", "Preprints / Chapters Count", "Research Reports Count", "Policy Briefs Count", "Publication Validation Links"
            ]
            
            rows_to_write = []
            merge_ranges = []
            candidate_groups = []
            single_line_rows = []
            current_r = 2 # Row 1 is headers
            
            for c in candidates_data:
                full_c = db.query(models.CandidateMetadata).filter(models.CandidateMetadata.id == c['id']).first()
                if not full_c: continue
                
                undergrads = [e for e in full_c.higher_education if e.level == 'undergrad']
                postgrads = [e for e in full_c.higher_education if e.level == 'postgrad']
                phds = [e for e in full_c.higher_education if e.level == 'phd']
                diplomas = [e for e in full_c.higher_education if e.level == 'diploma']
                works = sorted(full_c.work_experiences, key=lambda x: x.entry_order)
                
                max_rows = max(len(undergrads), len(postgrads), len(phds), len(diplomas), len(works), 1)
                
                candidate_groups.append((current_r, current_r + max_rows - 1))
                
                if max_rows == 1:
                    single_line_rows.append(current_r)
                
                if max_rows > 1:
                    # Merge candidate static metadata columns (1 to 35) and overall publication count columns (62 to 67)
                    for col in list(range(1, 36)) + list(range(62, 68)):
                        merge_ranges.append((current_r, current_r + max_rows - 1, col))
                
                val_links = []
                if full_c.publications:
                    for p in full_c.publications:
                        if p.title and p.title.strip():
                            val_links.append(f"{p.pub_type}: {p.title}")
                val_links_text = "; ".join(val_links) if val_links else ""

                latest_app = full_c.applications[-1] if getattr(full_c, 'applications', None) else None
                pos_applied = (latest_app.position_applied if latest_app else None) or c.get('position_applied', '') or ""
                admin_dept = (latest_app.admin_department if latest_app else None) or c.get('admin_department', '') or ""
                current_stat = (latest_app.current_status if latest_app else None) or c.get('current_status', 'received')
                sub_date = (str(latest_app.submitted_at)[:10] if (latest_app and latest_app.submitted_at) else "") or (str(c.get('submitted_at', ''))[:10] if c.get('submitted_at') else "")

                for i in range(max_rows):
                    row = [""] * len(headers)
                    if i == 0:
                        # Personal & Contact
                        row[0] = full_c.full_name
                        row[1] = full_c.email
                        row[2] = full_c.country_code or "+91"
                        row[3] = full_c.mobile_no
                        row[4] = str(full_c.dob) if full_c.dob else ""
                        row[5] = calculate_age(full_c.dob) if full_c.dob else (full_c.age or "")
                        row[6] = full_c.gender or ""
                        row[7] = full_c.state or ""
                        row[8] = full_c.city or ""
                        row[9] = full_c.pincode or ""
                        
                        # Application & Source
                        row[10] = pos_applied
                        row[11] = admin_dept
                        row[12] = current_stat
                        row[13] = sub_date
                        row[14] = (full_c.links_about.how_heard if full_c.links_about else "") or ""
                        
                        # Profiles & SOP
                        row[15] = (full_c.links_about.sop if full_c.links_about else "") or ""
                        row[16] = (full_c.links_about.google_scholar if full_c.links_about else "") or ""
                        row[17] = (full_c.links_about.linkedin if full_c.links_about else "") or ""

                        # Boolean Indicator Flags
                        row[18] = "Yes" if works else "No"
                        row[19] = "Yes" if any(w.is_current or not w.end_date for w in works) else "No"
                        row[20] = "Yes" if full_c.higher_education else "No"
                        row[21] = "Yes" if any(e.is_pursuing for e in full_c.higher_education) else "No"
                        row[22] = "Yes" if phds else "No"
                        row[23] = "Yes" if postgrads else "No"
                        row[24] = "Yes" if undergrads else "No"
                        row[25] = "Yes" if diplomas else "No"
                        row[26] = "Yes" if (full_c.publications or (full_c.links_about and (full_c.links_about.pub_books or full_c.links_about.pub_papers or full_c.links_about.pub_chapters or full_c.links_about.pub_reports or full_c.links_about.pub_policy_briefs))) else "No"

                        # Schooling Class X & XII
                        row[27] = full_c.schooling.class_x_school if full_c.schooling else ""
                        row[28] = full_c.schooling.class_x_board if full_c.schooling else ""
                        row[29] = format_schooling_score(full_c.schooling, "x")
                        row[30] = full_c.schooling.class_x_year if (full_c.schooling and full_c.schooling.class_x_year) else ""

                        row[31] = full_c.schooling.class_xii_school if full_c.schooling else ""
                        row[32] = full_c.schooling.class_xii_board if full_c.schooling else ""
                        row[33] = format_schooling_score(full_c.schooling, "xii")
                        row[34] = full_c.schooling.class_xii_year if (full_c.schooling and full_c.schooling.class_xii_year) else ""

                        # Experience & Salary (Static Summary)
                        row[55] = full_c.years_of_experience if full_c.years_of_experience is not None else 0.0
                        row[56] = full_c.last_salary if full_c.last_salary is not None else ""

                        # Publications Summary
                        row[61] = (full_c.links_about.pub_books if full_c.links_about else 0) or 0
                        row[62] = (full_c.links_about.pub_papers if full_c.links_about else 0) or 0
                        row[63] = (full_c.links_about.pub_chapters if full_c.links_about else 0) or 0
                        row[64] = (full_c.links_about.pub_reports if full_c.links_about else 0) or 0
                        row[65] = (full_c.links_about.pub_policy_briefs if full_c.links_about else 0) or 0
                        row[66] = val_links_text
                    
                    # Graduation details (Cols 35-39 index)
                    if i < len(undergrads):
                        row[35] = undergrads[i].university or ""
                        row[36] = undergrads[i].degree_name or ""
                        row[37] = format_score(undergrads[i].score_value, undergrads[i].score_type) if undergrads[i].score_value else ""
                        row[38] = undergrads[i].grad_year or ""
                        row[39] = "Yes" if undergrads[i].is_pursuing else "No"
                    
                    # Postgrad details (Cols 40-44 index)
                    if i < len(postgrads):
                        row[40] = postgrads[i].university or ""
                        row[41] = postgrads[i].degree_name or ""
                        row[42] = format_score(postgrads[i].score_value, postgrads[i].score_type) if postgrads[i].score_value else ""
                        row[43] = postgrads[i].grad_year or ""
                        row[44] = "Yes" if postgrads[i].is_pursuing else "No"
                    
                    # PhD details (Cols 45-49 index)
                    if i < len(phds):
                        row[45] = phds[i].university or ""
                        row[46] = phds[i].degree_name or ""
                        row[47] = format_score(phds[i].score_value, phds[i].score_type) if phds[i].score_value else ""
                        row[48] = phds[i].grad_year or ""
                        row[49] = "Yes" if phds[i].is_pursuing else "No"

                    # Diploma details (Cols 50-54 index)
                    if i < len(diplomas):
                        row[50] = diplomas[i].university or ""
                        row[51] = diplomas[i].degree_name or ""
                        row[52] = format_score(diplomas[i].score_value, diplomas[i].score_type) if diplomas[i].score_value else ""
                        row[53] = diplomas[i].grad_year or ""
                        row[54] = "Yes" if diplomas[i].is_pursuing else "No"
                    
                    # Work Experience details (Cols 57-60 index)
                    if i < len(works):
                        row[57] = works[i].company_name or ""
                        row[58] = works[i].role or ""
                        row[59] = str(works[i].start_date) if works[i].start_date else ""
                        row[60] = str(works[i].end_date or "Present") if works[i].start_date else ""
                    
                    rows_to_write.append(row)
                    current_r += 1

        # 3. Generate Output
        if req.format == 'csv':
            si = StringIO()
            cw = csv.writer(si)
            cw.writerow(headers)
            cw.writerows(rows_to_write)
            si.seek(0)
            return StreamingResponse(
                iter([si.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=applicants_{job_id}.csv"}
            )
        else:
            # XLSX using openpyxl directly
            output = BytesIO()
            wb = Workbook()
            ws = wb.active
            ws.title = "Applicants"
            
            # Styling
            header_fill = PatternFill(start_color='1E3A8A', end_color='1E3A8A', fill_type='solid')
            header_font = Font(bold=True, color='FFFFFF')
            
            divider_cols = [10, 15, 18, 27, 35, 40, 45, 50, 55, 61]

            # Write Headers
            for col_idx, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col_idx, value=header)
                cell.fill = header_fill
                cell.font = header_font
                
                # Header vertical dividers for detailed view
                r_style = 'medium' if (req.report_type == 'detailed' and col_idx in divider_cols) else 'thin'
                r_color = '1E3A8A' if (req.report_type == 'detailed' and col_idx in divider_cols) else 'CBD5E1'
                
                cell.border = Border(
                    left=Side(style='thin', color='CBD5E1'),
                    right=Side(style=r_style, color=r_color),
                    top=Side(style='thin', color='CBD5E1'),
                    bottom=Side(style='thin', color='CBD5E1')
                )
                cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

            ws.row_dimensions[1].height = 28

            # Write Data
            for r_idx, row_data in enumerate(rows_to_write, 2):
                for c_idx, value in enumerate(row_data, 1):
                    cell = ws.cell(row=r_idx, column=c_idx, value=value)
                    
                    # Right border vertical dividers
                    r_style = 'medium' if (req.report_type == 'detailed' and c_idx in divider_cols) else 'thin'
                    r_color = '1E3A8A' if (req.report_type == 'detailed' and c_idx in divider_cols) else 'CBD5E1'
                    
                    cell.border = Border(
                        left=Side(style='thin', color='CBD5E1'),
                        right=Side(style=r_style, color=r_color),
                        top=Side(style='thin', color='CBD5E1'),
                        bottom=Side(style='thin', color='CBD5E1')
                    )
                    
                    # Alignments
                    if req.report_type == 'standardized':
                        if c_idx in [2, 3, 5, 6, 7, 10, 13, 14, 15, 16, 18, 19, 21, 22, 24, 25, 26]:
                            cell.alignment = Alignment(horizontal='center', vertical='center')
                        else:
                            cell.alignment = Alignment(horizontal='left', vertical='center')
                    else:
                        # Detailed aligns
                        if c_idx in [3, 4, 5, 6, 7, 10, 13, 14, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 34, 35, 38, 39, 40, 43, 44, 45, 48, 49, 50, 53, 54, 55, 56, 57, 59, 60, 62, 63, 64, 65, 66]:
                            cell.alignment = Alignment(horizontal='center', vertical='top', wrap_text=True)
                        else:
                            cell.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)

            # Apply merges (only for detailed report type)
            if req.report_type == 'detailed':
                for start_r, end_r, col in merge_ranges:
                    ws.merge_cells(start_row=start_r, start_column=col, end_row=end_r, end_column=col)
                    h_align = 'center' if col in [3, 4, 5, 6, 7, 10, 13, 14, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 34, 35, 62, 63, 64, 65, 66] else 'left'
                    ws.cell(row=start_r, column=col).alignment = Alignment(vertical='top', horizontal=h_align, wrap_text=True)

                # Set bottom boundaries borders for groups (preserving vertical dividers)
                for start_r, end_r in candidate_groups:
                    for col in range(1, len(headers) + 1):
                        cell = ws.cell(row=end_r, column=col)
                        r_style = 'medium' if col in divider_cols else 'thin'
                        r_color = '1E3A8A' if col in divider_cols else 'CBD5E1'
                        cell.border = Border(
                            left=Side(style='thin', color='CBD5E1'),
                            right=Side(style=r_style, color=r_color),
                            top=cell.border.top or Side(style='thin', color='CBD5E1'),
                            bottom=Side(style='medium', color='1E3A8A')
                        )
                
                # Apply row heights for single line rows (26px height)
                for row_idx in single_line_rows:
                    ws.row_dimensions[row_idx].height = 26

            # Auto-adjust column widths based on report type
            from openpyxl.utils import get_column_letter
            for col_idx in range(1, len(headers) + 1):
                col_letter = get_column_letter(col_idx)
                header_name = headers[col_idx - 1]
                
                if "SOP" in header_name or "Statement" in header_name or "Validation" in header_name:
                    ws.column_dimensions[col_letter].width = 40
                elif "Univ" in header_name or "Degree" in header_name or "Title" in header_name or "Organization" in header_name or "Institute" in header_name:
                    ws.column_dimensions[col_letter].width = 30
                elif "Bachelors" in header_name or "Masters" in header_name or "Doctorate" in header_name or "Name" in header_name or "Email" in header_name or "Thesis" in header_name or "Source" in header_name or "Employment" in header_name or "Designation" in header_name:
                    ws.column_dimensions[col_letter].width = 24
                else:
                    ws.column_dimensions[col_letter].width = 16

            wb.save(output)
            output.seek(0)
            return StreamingResponse(
                output,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=applicants_{job_id}.xlsx"}
            )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Autocomplete Suggestion Endpoint ──
@app.get("/api/v1/jobs/{job_id}/suggest", dependencies=[Depends(get_current_admin)])
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

@app.post("/api/v1/jobs/{job_id}/candidates/filter", dependencies=[Depends(get_current_admin)])
def filter_job_candidates(job_id: str, filters: CandidateFilter, db: Session = Depends(get_db)):
    try:
        clean_job_id = str(job_id).strip()
        
        # 1. Base query for IDs joining application_tracking
        id_query = db.query(models.CandidateMetadata.id).join(
            models.ApplicationTracking, models.ApplicationTracking.candidate_id == models.CandidateMetadata.id
        )
        if clean_job_id not in ['all', 'all_jobs', '']:
            id_query = id_query.filter(models.ApplicationTracking.job_id == clean_job_id)

        # Apply personal filters
        if filters.states and len(filters.states) > 0:
            id_filters = [models.CandidateMetadata.state.ilike(f"%{s}%") for s in filters.states]
            id_query = id_query.filter(or_(*id_filters))
        
        if filters.genders and len(filters.genders) > 0:
            id_query = id_query.filter(models.CandidateMetadata.gender.in_(filters.genders))

        if filters.min_experience_years is not None:
            id_query = id_query.filter(models.CandidateMetadata.years_of_experience >= float(filters.min_experience_years))

        if filters.min_age is not None:
            id_query = id_query.filter(models.CandidateMetadata.age >= filters.min_age)

        if filters.max_age is not None:
            id_query = id_query.filter(models.CandidateMetadata.age <= filters.max_age)

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
            sub = db.query(models.CandidateSchooling.candidate_id).filter(
                models.CandidateSchooling.class_x_score_value >= float(filters.min_x_score)
            )
            if filters.x_score_type:
                sub = sub.filter(models.CandidateSchooling.class_x_score_type == filters.x_score_type)
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub.subquery()))

        if filters.min_xii_score is not None:
            sub = db.query(models.CandidateSchooling.candidate_id).filter(
                models.CandidateSchooling.class_xii_score_value >= float(filters.min_xii_score)
            )
            if filters.xii_score_type:
                sub = sub.filter(models.CandidateSchooling.class_xii_score_type == filters.xii_score_type)
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub.subquery()))

        # Work Experience Filters
        if filters.role_keyword:
            sub = db.query(models.CandidateWorkExperience.candidate_id).filter(models.CandidateWorkExperience.role.ilike(f"%{filters.role_keyword}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        if filters.company_keyword:
            sub = db.query(models.CandidateWorkExperience.candidate_id).filter(models.CandidateWorkExperience.company_name.ilike(f"%{filters.company_keyword}%")).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub))

        # Publication Filters (now tracked in CandidateLinksAbout)
        if any(v is not None and v > 0 for v in [filters.min_papers, filters.min_books, filters.min_chapters, filters.min_reports, filters.min_policy_briefs]):
            sub = db.query(models.CandidateLinksAbout.candidate_id)
            if filters.min_papers and filters.min_papers > 0:
                sub = sub.filter(models.CandidateLinksAbout.pub_papers >= filters.min_papers)
            if filters.min_books and filters.min_books > 0:
                sub = sub.filter(models.CandidateLinksAbout.pub_books >= filters.min_books)
            if filters.min_chapters and filters.min_chapters > 0:
                sub = sub.filter(models.CandidateLinksAbout.pub_chapters >= filters.min_chapters)
            if filters.min_reports and filters.min_reports > 0:
                sub = sub.filter(models.CandidateLinksAbout.pub_reports >= filters.min_reports)
            if filters.min_policy_briefs and filters.min_policy_briefs > 0:
                sub = sub.filter(models.CandidateLinksAbout.pub_policy_briefs >= filters.min_policy_briefs)
            
            id_query = id_query.filter(models.CandidateMetadata.id.in_(sub.subquery()))

        # 2. Get the final list of matching IDs
        matching_ids = [r[0] for r in id_query.all()]

        if not matching_ids:
            return []

        # 3. Fetch full objects with joinedload only for those IDs
        candidates = db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.id.in_(matching_ids)
        ).options(
            joinedload(models.CandidateMetadata.higher_education),
            joinedload(models.CandidateMetadata.schooling),
            joinedload(models.CandidateMetadata.publications),
            joinedload(models.CandidateMetadata.work_experiences)
        ).all()

        # Fetch matching application trackers for status
        trackers = db.query(models.ApplicationTracking).filter(
            models.ApplicationTracking.candidate_id.in_(matching_ids),
            models.ApplicationTracking.job_id == clean_job_id
        ).all()
        tracker_map = {t.candidate_id: t for t in trackers}

        job_posting = db.query(models.JobPosting).filter(models.JobPosting.id == clean_job_id).first()
        min_exp = job_posting.min_experience if job_posting else 1.0

        from utils.scoring import calculate_candidate_score

        result = []
        for c in candidates:
            score_res = calculate_candidate_score(c, min_exp)
            profile_score = score_res["total_score"]
            profile_score_breakdown = score_res["breakdown"]

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
                "age": c.age or (
                    (datetime.date.today().year - c.dob.year - ((datetime.date.today().month, datetime.date.today().day) < (c.dob.month, c.dob.day)))
                    if c.dob else None
                ),
                "years_of_experience": c.years_of_experience,
                "highest_education": highest_edu,
                "current_status": track.current_status if track else 'received',
                "profile_score": profile_score,
                "profile_score_breakdown": profile_score_breakdown,
                "graduation": [{"degree_name": g.degree_name, "university": g.university, "score": f"{g.score_value} {g.score_type}"} for g in grad],
                "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score": f"{p.score_value} {p.score_type}"} for p in postgrad],
                "doctorate": [{"university": d.university, "thesis_title": d.degree_name, "score": f"{d.score_value} {d.score_type}"} for d in phd],
                "work_experiences": [{"role": w.role, "company_name": w.company_name} for w in c.work_experiences],
                "books_count": books_ct,
                "papers_count": papers_ct,
                "chapters_count": chapters_ct
            }
            result.append(d)
        
        result.sort(key=lambda x: x['full_name'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs/{job_id}/filter-options", dependencies=[Depends(get_current_admin)])
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

@app.get("/api/v1/jobs/{job_id}/candidates", dependencies=[Depends(get_current_admin)])
def get_job_candidates(job_id: str, db: Session = Depends(get_db)):
    trackers = db.query(models.ApplicationTracking).filter(
        models.ApplicationTracking.job_id == job_id
    ).order_by(models.ApplicationTracking.submitted_at.desc()).all()
    
    if not trackers:
        return []

    job_posting = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    min_exp = job_posting.min_experience if job_posting else 1.0

    candidate_ids = [t.candidate_id for t in trackers]
    candidates = db.query(models.CandidateMetadata).filter(
        models.CandidateMetadata.id.in_(candidate_ids)
    ).options(
        joinedload(models.CandidateMetadata.higher_education),
        joinedload(models.CandidateMetadata.schooling),
        joinedload(models.CandidateMetadata.publications),
        joinedload(models.CandidateMetadata.work_experiences)
    ).all()
    
    # Map for sorting order preservation
    cand_map = {c.id: c for c in candidates}
    
    from utils.scoring import calculate_candidate_score

    result = []
    for t in trackers:
        c = cand_map.get(t.candidate_id)
        if not c:
            continue
            
        score_res = calculate_candidate_score(c, min_exp)

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
            "age": c.age or (
                (datetime.date.today().year - c.dob.year - ((datetime.date.today().month, datetime.date.today().day) < (c.dob.month, c.dob.day)))
                if c.dob else None
            ),
            "years_of_experience": c.years_of_experience,
            "highest_education": highest_edu,
            "current_status": t.current_status,
            "profile_score": score_res["total_score"],
            "profile_score_breakdown": score_res["breakdown"],
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
@app.get("/api/v1/jobs", dependencies=[Depends(get_current_admin)])
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
            "min_pay":        job.min_pay,
            "max_pay":        job.max_pay,
            "min_experience": job.min_experience,
            "max_experience": job.max_experience,
            "contract_period": job.contract_period,
            "job_mode":       job.job_mode,
            "pay_band":       job.pay_band,
            "pay_level":      job.pay_level,
        })
    return result


# ─────────────────────────────────────────────
# Create Job
# ─────────────────────────────────────────────
@app.post("/api/v1/jobs", dependencies=[Depends(get_current_admin)])
def create_job(payload: schemas.JobPostingCreate, db: Session = Depends(get_db)):
    job_data = payload.model_dump(exclude_unset=True)
    new_job = models.JobPosting(**job_data)
    try:
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        return {"status": "created", "id": new_job.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────
# Update Job (Edit)
# ─────────────────────────────────────────────
@app.patch("/api/v1/jobs/{job_id}", dependencies=[Depends(get_current_admin)])
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
@app.patch("/api/v1/jobs/{job_id}/publish", dependencies=[Depends(get_current_admin)])
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
@app.patch("/api/v1/jobs/{job_id}/archive", dependencies=[Depends(get_current_admin)])
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
@app.patch("/api/v1/jobs/{job_id}/close", dependencies=[Depends(get_current_admin)])
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
@app.delete("/api/v1/jobs/{job_id}", dependencies=[Depends(get_current_admin)])
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


# Schooling Schema Migration Endpoint (Vercel-compatible)
# ─────────────────────────────────────────────
@app.post("/api/v1/debug/drop-ai")
def drop_ai_columns(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE candidate_resume_payload DROP COLUMN IF EXISTS raw_resume_text;"))
        db.execute(text("ALTER TABLE candidate_resume_payload DROP COLUMN IF EXISTS resume_embedding;"))
        db.commit()
        return {"status": "success", "message": "AI columns dropped successfully!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/debug/drop-cgpa-constraint")
def drop_cgpa_constraint(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE candidate_higher_education DROP CONSTRAINT IF EXISTS chk_edu_score_type;"))
        db.commit()
        return {"status": "success", "message": "Constraint dropped successfully!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/debug/migrate-schooling")
def migrate_schooling_endpoint():
    try:
        from migrate_schooling import run_migration
        success = run_migration()
        if success:
            return {"status": "success", "message": "Schooling schema migration completed successfully!"}
        else:
            return {"status": "error", "message": "Schooling schema migration failed. Check server logs."}
    except Exception as e:
        return {"status": "error", "message": f"Exception occurred during migration: {str(e)}"}


# Fix DAKSHIN Candidate Data Debug Route
# ─────────────────────────────────────────────
@app.post("/api/v1/debug/fix-dakshin-candidates")
def fix_dakshin_candidates(db: Session = Depends(get_db)):
    try:
        # Find the job posting
        job = db.query(models.JobPosting).filter(
            models.JobPosting.title.ilike('%Research Assistant (Development Finance)%')
        ).first()
        
        if not job:
            # Try a broader search
            job = db.query(models.JobPosting).filter(
                models.JobPosting.title.ilike('%Research Assistant%')
            ).first()
            
        if not job:
            return {"status": "error", "message": "Job posting 'Research Assistant (Development Finance)' not found"}
        
        # Get application trackers for this job
        trackers = db.query(models.ApplicationTracking).filter(
            models.ApplicationTracking.job_id == job.id
        ).all()
        
        candidate_ids = [t.candidate_id for t in trackers]
        
        # Get candidate metadata
        candidates = db.query(models.CandidateMetadata).filter(
            models.CandidateMetadata.id.in_(candidate_ids)
        ).all()
        
        # Filter out Viraal Saini
        candidates_to_fix = [c for c in candidates if not c.full_name.lower().startswith("viraal")]
        
        # Profiles definitions
        profiles = [
            {
                "email_domain": "nipfp.org.in",
                "grad_uni": "Delhi University (St. Stephen's)", "grad_deg": "B.A. (Hons) Economics", "grad_score": 8.5, "grad_score_type": "CGPA", "grad_year": 2021,
                "pg_uni": "Jawaharlal Nehru University (JNU)", "pg_deg": "M.A. Economics", "pg_score": 78.5, "pg_score_type": "Percentage", "pg_year": 2023,
                "phd_uni": "Jawaharlal Nehru University", "phd_thesis": "Public Debt and Fiscal Sustainability in Developing Nations", "phd_score": 8.0, "phd_score_type": "CGPA", "phd_year": 2026,
                "work": [{"role": "Research Assistant", "comp": "National Institute of Public Finance and Policy (NIPFP)", "start": datetime.date(2023, 7, 1), "end": datetime.date(2025, 6, 30)}],
                "pubs": [{"pub_type": "paper", "title": "Financing Green Infrastructure in Indian Cities: Challenges and Opportunities", "parent": None}],
                "extracurriculars": "Avid debater and classical music enthusiast.",
                "exp": 2.0, "dob": datetime.date(2001, 8, 15), "city": "New Delhi", "pincode": "110001", "state": "Delhi"
            },
            {
                "email_domain": "igidr.ac.in",
                "grad_uni": "St. Xavier's College, Mumbai", "grad_deg": "B.Sc. Economics", "grad_score": 79.0, "grad_score_type": "Percentage", "grad_year": 2020,
                "pg_uni": "Indira Gandhi Institute of Development Research (IGIDR)", "pg_deg": "M.Sc. Development Finance", "pg_score": 8.2, "pg_score_type": "CGPA", "pg_year": 2022,
                "phd_uni": "Indira Gandhi Institute of Development Research (IGIDR)", "phd_thesis": "Empirical Essays on Micro-credit and Rural Development", "phd_score": 0.0, "phd_score_type": "Percentage", "phd_year": 2025,
                "work": [{"role": "Research Associate", "comp": "Centre for Monitoring Indian Economy (CMIE)", "start": datetime.date(2022, 8, 15), "end": datetime.date(2024, 5, 31)}],
                "pubs": [{"pub_type": "paper", "title": "Determinants of Microfinance Repayment Rates in Rural Maharashtra", "parent": None}],
                "extracurriculars": "Volunteered at local NGOs teaching financial literacy.",
                "exp": 1.8, "dob": datetime.date(1999, 3, 12), "city": "Mumbai", "pincode": "400001", "state": "Maharashtra"
            },
            {
                "email_domain": "rbi.org.in",
                "grad_uni": "Christ University, Bengaluru", "grad_deg": "B.A. Economics", "grad_score": 8.8, "grad_score_type": "CGPA", "grad_year": 2022,
                "pg_uni": "Madras School of Economics", "pg_deg": "M.Sc. Economics", "pg_score": 8.0, "pg_score_type": "CGPA", "pg_year": 2024,
                "work": [{"role": "Finance Intern", "comp": "Reserve Bank of India (RBI)", "start": datetime.date(2024, 6, 1), "end": datetime.date(2024, 12, 31)}],
                "pubs": [{"pub_type": "paper", "title": "Assessing the Impact of Digital Financial Inclusion on Rural Households in Karnataka", "parent": None}],
                "extracurriculars": "Enjoys photography and trekking.",
                "exp": 0.5, "dob": datetime.date(2002, 11, 20), "city": "Bengaluru", "pincode": "560001", "state": "Karnataka"
            },
            {
                "email_domain": "hdfc.com",
                "grad_uni": "Madras Christian College", "grad_deg": "B.A. Corporate Secretaryship", "grad_score": 82.0, "grad_score_type": "Percentage", "grad_year": 2019,
                "pg_uni": "Anna University", "pg_deg": "MBA Finance", "pg_score": 8.1, "pg_score_type": "CGPA", "pg_year": 2021,
                "work": [
                    {"role": "Credit Analyst", "comp": "HDFC Bank", "start": datetime.date(2021, 8, 1), "end": datetime.date(2023, 12, 31)},
                    {"role": "Research Analyst", "comp": "IFMR Lead", "start": datetime.date(2024, 1, 15), "end": None}
                ],
                "pubs": [{"pub_type": "chapter", "title": "Fintech Innovations in Rural Banking", "parent": "Financial inclusion in the Global South"}],
                "extracurriculars": "State-level badminton player.",
                "exp": 3.5, "dob": datetime.date(1998, 5, 14), "city": "Chennai", "pincode": "600001", "state": "Tamil Nadu"
            },
            {
                "email_domain": "jindal.edu.in",
                "grad_uni": "Lucknow University", "grad_deg": "B.Com (Hons)", "grad_score": 75.0, "grad_score_type": "Percentage", "grad_year": 2021,
                "pg_uni": "Jindal School of Government and Public Policy", "pg_deg": "M.A. Public Policy", "pg_score": 7.9, "pg_score_type": "CGPA", "pg_year": 2023,
                "work": [{"role": "Project Assistant", "comp": "Centre for Development Finance", "start": datetime.date(2023, 8, 1), "end": datetime.date(2025, 4, 30)}],
                "pubs": [],
                "extracurriculars": "Blogger writing about policy and public affairs.",
                "exp": 1.7, "dob": datetime.date(2001, 1, 25), "city": "Lucknow", "pincode": "226001", "state": "Uttar Pradesh"
            },
            {
                "email_domain": "presidency.edu",
                "grad_uni": "Presidency University, Kolkata", "grad_deg": "B.Sc. Economics", "grad_score": 8.6, "grad_score_type": "CGPA", "grad_year": 2020,
                "pg_uni": "Calcutta University", "pg_deg": "M.Sc. Economics", "pg_score": 77.0, "pg_score_type": "Percentage", "pg_year": 2022,
                "phd_uni": "London School of Economics (LSE)", "phd_thesis": "Essays on Development Finance and Fiscal Federalism", "phd_score": 0.0, "phd_score_type": "Percentage", "phd_year": 2025,
                "work": [{"role": "Junior Economist", "comp": "National Institute of Public Finance and Policy", "start": datetime.date(2022, 7, 1), "end": datetime.date(2024, 6, 30)}],
                "pubs": [{"pub_type": "paper", "title": "Municipal Bonds as an Alternative Source of Development Finance in India", "parent": None}],
                "extracurriculars": "Plays chess competitively.",
                "exp": 2.0, "dob": datetime.date(2000, 9, 8), "city": "Kolkata", "pincode": "700001", "state": "West Bengal"
            },
            {
                "email_domain": "cds.edu",
                "grad_uni": "St. Teresa's College, Ernakulam", "grad_deg": "B.A. Economics", "grad_score": 91.0, "grad_score_type": "Percentage", "grad_year": 2021,
                "pg_uni": "Centre for Development Studies (CDS)", "pg_deg": "M.A. Economics", "pg_score": 8.4, "pg_score_type": "CGPA", "pg_year": 2023,
                "work": [
                    {"role": "Research Intern", "comp": "Kerala State Planning Board", "start": datetime.date(2023, 6, 1), "end": datetime.date(2023, 11, 30)},
                    {"role": "Research Assistant", "comp": "Gulati Institute of Finance and Taxation (GIFT)", "start": datetime.date(2023, 12, 1), "end": None}
                ],
                "pubs": [{"pub_type": "paper", "title": "Fiscal Decentralization and Development Spending: Evidence from Kerala's Local Bodies", "parent": None}],
                "extracurriculars": "Enjoys reading historical fiction and volunteering.",
                "exp": 2.2, "dob": datetime.date(2001, 4, 30), "city": "Thiruvananthapuram", "pincode": "695001", "state": "Kerala"
            }
        ]
        
        # Sort candidates to ensure deterministic assignment
        candidates_to_fix.sort(key=lambda x: x.id)
        
        updated_candidates = []
        for idx, c in enumerate(candidates_to_fix):
            p = profiles[idx % len(profiles)]
            
            # 1. Determine and correct gender based on name
            name_lower = c.full_name.lower()
            if any(k in name_lower for k in ["arjun", "rohan", "vikram", "kabir", "siddharth", "rahul", "amit", "deepak", "suresh", "vijay", "rajesh", "manish", "anil", "sunil", "ravi", "aarav", "amitav", "iyer", "ghosh"]):
                c.gender = "Male"
            elif any(k in name_lower for k in ["aditi", "sanya", "isha", "meera", "ananya", "priya", "kavita", "riya", "neeta", "sunita", "pooja", "shweta", "geeta", "asha", "lata", "ishani", "zara", "williams", "sharma", "nair", "kulkarni"]):
                c.gender = "Female"
            else:
                c.gender = "Male" # Default
            
            # 2. Update basic fields
            c.dob = p["dob"]
            c.years_of_experience = p["exp"]
            c.state = p["state"]
            c.city = p["city"]
            c.pincode = p["pincode"]
            
            # Keep original name, but update email to be varied using profile domain
            prefix = c.full_name.lower().replace(" ", ".").replace("dr.", "").replace("ms.", "").replace("mr.", "").replace("prof.", "")
            c.email = f"{prefix}@{p['email_domain']}"
            
            # Recalculate age field
            today = datetime.date.today()
            c.age = today.year - c.dob.year - ((today.month, today.day) < (c.dob.month, c.dob.day))
            
            # 3. Clear existing sub-records
            db.query(models.CandidateHigherEducation).filter(models.CandidateHigherEducation.candidate_id == c.id).delete()
            db.query(models.CandidatePublication).filter(models.CandidatePublication.candidate_id == c.id).delete()
            db.query(models.CandidateWorkExperience).filter(models.CandidateWorkExperience.candidate_id == c.id).delete()
            db.query(models.CandidateSchooling).filter(models.CandidateSchooling.candidate_id == c.id).delete()
            
            # Schooling Seeding
            import random
            sch_rec = models.CandidateSchooling(
                candidate_id=c.id,
                class_x_school="Model Secondary School",
                class_x_board="CBSE",
                class_x_score_type="Percentage",
                class_x_score_value=round(random.uniform(80.0, 98.0), 1),
                class_xii_school="Model Senior Secondary School",
                class_xii_board="CBSE",
                class_xii_score_type="Percentage",
                class_xii_score_value=round(random.uniform(80.0, 98.0), 1)
            )
            db.add(sch_rec)
            
            # 4. Insert new qualifications
            # UG
            ug_rec = models.CandidateHigherEducation(
                candidate_id=c.id,
                level='undergrad',
                university=p["grad_uni"],
                degree_name=p["grad_deg"],
                score_type=p["grad_score_type"],
                score_value=p["grad_score"],
                grad_year=p["grad_year"],
                entry_order=1
            )
            db.add(ug_rec)
            
            # PG
            pg_rec = models.CandidateHigherEducation(
                candidate_id=c.id,
                level='postgrad',
                university=p["pg_uni"],
                degree_name=p["pg_deg"],
                score_type=p["pg_score_type"],
                score_value=p["pg_score"],
                grad_year=p["pg_year"],
                entry_order=2
            )
            db.add(pg_rec)
            
            # PhD
            if "phd_uni" in p:
                phd_rec = models.CandidateHigherEducation(
                    candidate_id=c.id,
                    level='phd',
                    university=p["phd_uni"],
                    degree_name=p["phd_thesis"],
                    score_type=p["phd_score_type"],
                    score_value=p["phd_score"],
                    grad_year=p["phd_year"],
                    entry_order=3
                )
                db.add(phd_rec)
            
            # 5. Insert new work experiences
            for w_idx, w in enumerate(p["work"], 1):
                work_rec = models.CandidateWorkExperience(
                    candidate_id=c.id,
                    company_name=w["comp"],
                    role=w["role"],
                    start_date=w["start"],
                    end_date=w["end"],
                    is_current=(w["end"] is None),
                    entry_order=w_idx
                )
                db.add(work_rec)
                
            # 6. Insert new publications
            for p_idx, pub in enumerate(p["pubs"], 1):
                pub_rec = models.CandidatePublication(
                    candidate_id=c.id,
                    pub_type=pub["pub_type"],
                    title=pub["title"],
                    parent_book=pub["parent"],
                    entry_order=p_idx
                )
                db.add(pub_rec)
                
            # 7. Update Links & About
            links = db.query(models.CandidateLinksAbout).filter(models.CandidateLinksAbout.candidate_id == c.id).first()
            if not links:
                links = models.CandidateLinksAbout(candidate_id=c.id)
                db.add(links)
            links.about = f"Passionate research professional specializing in development finance. Deployed research outputs on green infrastructure, microfinance, and policy analysis."
            links.google_scholar = f"https://scholar.google.com/citations?user={c.id[:8]}"
            links.linkedin = f"https://linkedin.com/in/{prefix}"
            
            updated_candidates.append({
                "id": c.id,
                "name": c.full_name,
                "gender": c.gender,
                "email": c.email,
                "city": c.city,
                "state": c.state,
                "has_phd": ("phd_uni" in p),
                "class_x_percentage": sch_rec.class_x_score_value,
                "class_xii_percentage": sch_rec.class_xii_score_value
            })
            
        db.commit()
        return {
            "status": "success",
            "message": f"Successfully updated {len(updated_candidates)} candidates for job '{job.title}'",
            "updated_candidates": updated_candidates
        }
        
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

