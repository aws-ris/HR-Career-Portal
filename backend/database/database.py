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

# SQLite requires check_same_thread=False, Postgres gets connection pool tuning!
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    try:
        # High-concurrency connection pool tuning for 1,000+ simultaneous submissions
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_size=30,
            max_overflow=50,
            pool_timeout=60,
            pool_recycle=1800,
            pool_pre_ping=True
        )
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
        yield db
    finally:
        db.close()
