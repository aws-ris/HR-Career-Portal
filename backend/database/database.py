import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@localhost/ris_db"
)

# Fix for SQLAlchemy 2.0 (Vercel provides postgres:// but needs postgresql://)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure SSL is enabled for cloud databases, unless local or container networks are used
if not any(h in SQLALCHEMY_DATABASE_URL for h in ["localhost", "db", "postgres", "127.0.0.1"]) and "sslmode" not in SQLALCHEMY_DATABASE_URL:
    if "?" in SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL += "&sslmode=require"
    else:
        SQLALCHEMY_DATABASE_URL += "?sslmode=require"

# SQLite requires check_same_thread=False, Postgres does not!
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    try:
        # Try connecting to configured Postgres database
        engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            pass
    except Exception as e:
        print(f"[DB Warning] Could not connect to PostgreSQL: {e}. Falling back to local SQLite DB.")
        SQLALCHEMY_DATABASE_URL = "sqlite:///./ris_dev.db"
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        # Auto-close expired jobs dynamically
        from database import models
        import datetime
        today = datetime.date.today()
        try:
            expired_jobs = db.query(models.JobPosting).filter(
                models.JobPosting.status == 'open',
                models.JobPosting.deadline != None,
                models.JobPosting.deadline < today,
                models.JobPosting.is_deleted == False
            ).all()
            if expired_jobs:
                for job in expired_jobs:
                    job.status = 'closed'
                    job.updated_at = datetime.datetime.utcnow()
                db.commit()
        except Exception as e:
            print(f"Error auto-closing expired jobs: {e}")
            db.rollback()
            
        yield db
    finally:
        db.close()
