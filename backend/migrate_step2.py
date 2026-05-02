"""
migrate_step2.py - Complete the remaining migration steps.
Drops old tables and adds mobile_no column.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ris_db")
engine = create_engine(DATABASE_URL)

def table_exists(conn, name):
    r = conn.execute(text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :t)"), {"t": name})
    return r.scalar()

def col_exists(conn, table, col):
    r = conn.execute(text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=:t AND column_name=:c)"
    ), {"t": table, "c": col})
    return r.scalar()

with engine.begin() as conn:
    print("[1] Adding mobile_no if missing...")
    if not col_exists(conn, 'candidate_metadata', 'mobile_no'):
        # Try to rename mobile_number first
        if col_exists(conn, 'candidate_metadata', 'mobile_number'):
            conn.execute(text("ALTER TABLE candidate_metadata RENAME COLUMN mobile_number TO mobile_no;"))
            print("  Renamed mobile_number -> mobile_no")
        else:
            conn.execute(text("ALTER TABLE candidate_metadata ADD COLUMN mobile_no VARCHAR(20);"))
            print("  Added mobile_no column")
    else:
        print("  mobile_no already exists, OK")

with engine.begin() as conn:
    print("[2] Dropping old tables...")
    for tbl in ['graduation', 'postgraduate', 'doctorate', 'books', 'chapters', 'papers']:
        if table_exists(conn, tbl):
            conn.execute(text(f"DROP TABLE IF EXISTS {tbl} CASCADE;"))
            print(f"  Dropped: {tbl}")
        else:
            print(f"  Already gone: {tbl}")

with engine.begin() as conn:
    if table_exists(conn, 'work_experiences') and table_exists(conn, 'candidate_work_experience'):
        conn.execute(text("DROP TABLE IF EXISTS work_experiences CASCADE;"))
        print("  Dropped: work_experiences")

    if table_exists(conn, 'schooling') and table_exists(conn, 'candidate_schooling'):
        conn.execute(text("DROP TABLE IF EXISTS schooling CASCADE;"))
        print("  Dropped: schooling")

with engine.begin() as conn:
    print("[3] Final table check...")
    expected = [
        'job_postings', 'candidate_metadata', 'application_tracking',
        'application_status_history', 'candidate_schooling', 'candidate_higher_education',
        'candidate_publications', 'candidate_work_experience', 'candidate_links_about',
        'candidate_resume_payload', 'token_registry'
    ]
    all_ok = True
    for tbl in expected:
        exists = table_exists(conn, tbl)
        mark = "OK" if exists else "MISSING"
        print(f"  [{mark}] {tbl}")
        if not exists:
            all_ok = False

    if all_ok:
        print("\nMigration 100% complete!")
    else:
        print("\nWARNING: Some tables missing, check above.")

with engine.begin() as conn:
    print("[4] Checking candidate_metadata columns...")
    r = conn.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'candidate_metadata' ORDER BY ordinal_position
    """))
    for row in r:
        print(f"  - {row[0]}")
