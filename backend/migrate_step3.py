"""
migrate_step3.py - Final cleanup: strip dead columns from candidate_metadata.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ris_db"))

COLS_TO_DROP = [
    'job_id', 'position_applied', 'admin_department', 'current_status',
    'submitted_at', 'updated_at', 'is_deleted', 'about', 'cv_s3_key',
    'google_scholar_link', 'total_experience_years', 'resume_path',
    'raw_resume_text', 'resume_embedding', 'highest_education', 'age',
    'mobile_number',  # in case the rename didnt work
]

COLS_TO_ADD = [
    ('city',                'VARCHAR(100)'),
    ('years_of_experience', 'FLOAT'),
]

for col in COLS_TO_DROP:
    try:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS {col};"))
            print(f"Dropped: {col}")
    except Exception as e:
        print(f"Could not drop {col}: {e}")

for col, defn in COLS_TO_ADD:
    try:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS {col} {defn};"))
            print(f"Added: {col} {defn}")
    except Exception as e:
        print(f"Could not add {col}: {e}")

with engine.begin() as conn:
    r = conn.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'candidate_metadata' ORDER BY ordinal_position
    """))
    print("\nFinal candidate_metadata columns:")
    for row in r:
        print(f"  - {row[0]}")
