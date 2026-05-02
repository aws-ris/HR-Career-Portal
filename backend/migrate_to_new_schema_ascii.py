"""
migrate_to_new_schema.py
========================
Production-safe data migration from old 10-table schema ??? new 11-table schema.

Run this ONCE after models.py and schemas.py have been updated.
It will:
  1. Create all new tables (if not exists)
  2. Migrate data from old tables to new tables
  3. Drop old tables cleanly

Safe to run even if partially run before ??? uses INSERT WHERE NOT EXISTS logic.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ris_db")
engine = create_engine(DATABASE_URL)


def run():
    with engine.begin() as conn:
        print("=" * 60)
        print("RIS Schema Migration: v1 -> v2")
        print("=" * 60)

        # ?????? STEP 1: Create new tables ??????????????????????????????????????????????????????????????????????????????????????????
        print("\n[1/6] Creating new tables...")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS application_tracking (
                id               VARCHAR(36) PRIMARY KEY,
                candidate_id     VARCHAR(36) REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                job_id           VARCHAR(36) REFERENCES job_postings(id) ON DELETE SET NULL,
                position_applied VARCHAR(100),
                admin_department VARCHAR(50),
                current_status   VARCHAR(30) NOT NULL DEFAULT 'received',
                submitted_at     TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT chk_app_status CHECK (current_status IN ('received','under_review','shortlisted','rejected','offered'))
            );
        """))
        print("  ??? application_tracking")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_higher_education (
                id           VARCHAR(36) PRIMARY KEY,
                candidate_id VARCHAR(36) REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                level        VARCHAR(20) NOT NULL,
                university   VARCHAR(200),
                degree_name  VARCHAR(200),
                score_type   VARCHAR(20),
                score_value  FLOAT,
                grad_year    INTEGER,
                entry_order  INTEGER NOT NULL DEFAULT 1,
                CONSTRAINT chk_edu_level CHECK (level IN ('undergrad','postgrad','phd')),
                CONSTRAINT chk_edu_score_type CHECK (score_type IN ('Percentage','CGPA'))
            );
        """))
        print("  ??? candidate_higher_education")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_publications (
                id           VARCHAR(36) PRIMARY KEY,
                candidate_id VARCHAR(36) REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                pub_type     VARCHAR(30) NOT NULL,
                title        VARCHAR(500) NOT NULL,
                parent_book  VARCHAR(500),
                entry_order  INTEGER NOT NULL DEFAULT 1,
                CONSTRAINT chk_pub_type CHECK (pub_type IN ('book','chapter','paper','thesis','journal','article'))
            );
        """))
        print("  ??? candidate_publications")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_links_about (
                candidate_id   VARCHAR(36) PRIMARY KEY REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                about          TEXT,
                google_scholar VARCHAR(500),
                linkedin       VARCHAR(500)
            );
        """))
        print("  ??? candidate_links_about")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_resume_payload (
                candidate_id     VARCHAR(36) PRIMARY KEY REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                resume_path      VARCHAR(500),
                raw_resume_text  TEXT,
                resume_embedding FLOAT[]
            );
        """))
        print("  ??? candidate_resume_payload")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_work_experience (
                id           VARCHAR(36) PRIMARY KEY,
                candidate_id VARCHAR(36) REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                company_name VARCHAR(200) NOT NULL,
                role         VARCHAR(200) NOT NULL,
                start_date   DATE NOT NULL,
                end_date     DATE,
                is_current   BOOLEAN NOT NULL DEFAULT FALSE,
                entry_order  INTEGER NOT NULL DEFAULT 1
            );
        """))
        print("  ??? candidate_work_experience (new name)")

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS candidate_schooling (
                id                   VARCHAR(36) PRIMARY KEY,
                candidate_id         VARCHAR(36) REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                class_x_percentage   FLOAT NOT NULL,
                class_xii_percentage FLOAT NOT NULL
            );
        """))
        print("  ??? candidate_schooling (new name)")

        # ?????? STEP 2: Add new columns to candidate_metadata ???????????????????????????
        print("\n[2/6] Adding new columns to candidate_metadata...")

        for col, definition in [
            ("city", "VARCHAR(100)"),
            ("years_of_experience", "FLOAT"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS {col} {definition};"))
                print(f"  ??? Added candidate_metadata.{col}")
            except Exception as e:
                print(f"  ??? Skipped {col}: {e}")

        # ?????? STEP 3: Migrate data ?????????????????????????????????????????????????????????????????????????????????????????????????????????
        print("\n[3/6] Migrating data from old tables...")

        # 3a. application_tracking from candidate_metadata
        result = conn.execute(text("""
            INSERT INTO application_tracking (id, candidate_id, job_id, position_applied, admin_department, current_status, submitted_at, updated_at)
            SELECT
                gen_random_uuid()::text,
                cm.id,
                cm.job_id,
                cm.position_applied,
                cm.admin_department,
                cm.current_status,
                cm.submitted_at,
                cm.updated_at
            FROM candidate_metadata cm
            WHERE NOT EXISTS (
                SELECT 1 FROM application_tracking at WHERE at.candidate_id = cm.id
            )
            AND cm.job_id IS NOT NULL;
        """))
        print(f"  ??? Migrated {result.rowcount} rows ??? application_tracking")

        # 3b. candidate_higher_education from graduation
        if _table_exists(conn, 'graduation'):
            result = conn.execute(text("""
                INSERT INTO candidate_higher_education (id, candidate_id, level, university, degree_name, score_type, score_value, grad_year, entry_order)
                SELECT gen_random_uuid()::text, candidate_id, 'undergrad', university, degree_name, score_type, score_value, NULL, entry_order
                FROM graduation
                WHERE NOT EXISTS (
                    SELECT 1 FROM candidate_higher_education che WHERE che.candidate_id = graduation.candidate_id AND che.level = 'undergrad'
                );
            """))
            print(f"  ??? Migrated {result.rowcount} graduation rows ??? candidate_higher_education (undergrad)")

        # 3c. from postgraduate
        if _table_exists(conn, 'postgraduate'):
            result = conn.execute(text("""
                INSERT INTO candidate_higher_education (id, candidate_id, level, university, degree_name, score_type, score_value, grad_year, entry_order)
                SELECT gen_random_uuid()::text, candidate_id, 'postgrad', university, degree_name, score_type, score_value, NULL, entry_order
                FROM postgraduate
                WHERE NOT EXISTS (
                    SELECT 1 FROM candidate_higher_education che WHERE che.candidate_id = postgraduate.candidate_id AND che.level = 'postgrad'
                );
            """))
            print(f"  ??? Migrated {result.rowcount} postgraduate rows ??? candidate_higher_education (postgrad)")

        # 3d. from doctorate
        if _table_exists(conn, 'doctorate'):
            result = conn.execute(text("""
                INSERT INTO candidate_higher_education (id, candidate_id, level, university, degree_name, score_type, score_value, grad_year, entry_order)
                SELECT gen_random_uuid()::text, candidate_id, 'phd', university, thesis_title, score_type, score_value, NULL, entry_order
                FROM doctorate
                WHERE NOT EXISTS (
                    SELECT 1 FROM candidate_higher_education che WHERE che.candidate_id = doctorate.candidate_id AND che.level = 'phd'
                );
            """))
            print(f"  ??? Migrated {result.rowcount} doctorate rows ??? candidate_higher_education (phd)")

        # 3e. candidate_publications from books
        if _table_exists(conn, 'books'):
            result = conn.execute(text("""
                INSERT INTO candidate_publications (id, candidate_id, pub_type, title, parent_book, entry_order)
                SELECT gen_random_uuid()::text, candidate_id, 'book', title, NULL, entry_order
                FROM books;
            """))
            print(f"  ??? Migrated {result.rowcount} book rows ??? candidate_publications")

        # 3f. from chapters
        if _table_exists(conn, 'chapters'):
            result = conn.execute(text("""
                INSERT INTO candidate_publications (id, candidate_id, pub_type, title, parent_book, entry_order)
                SELECT gen_random_uuid()::text, candidate_id, 'chapter', chapter_name, corresponding_book, entry_order
                FROM chapters;
            """))
            print(f"  ??? Migrated {result.rowcount} chapter rows ??? candidate_publications")

        # 3g. from papers
        if _table_exists(conn, 'papers'):
            result = conn.execute(text("""
                INSERT INTO candidate_publications (id, candidate_id, pub_type, title, parent_book, entry_order)
                SELECT gen_random_uuid()::text, candidate_id, 'paper', title, NULL, entry_order
                FROM papers;
            """))
            print(f"  ??? Migrated {result.rowcount} paper rows ??? candidate_publications")

        # 3h. candidate_links_about from candidate_metadata
        result = conn.execute(text("""
            INSERT INTO candidate_links_about (candidate_id, about, google_scholar, linkedin)
            SELECT cm.id, cm.about, cm.google_scholar_link, NULL
            FROM candidate_metadata cm
            WHERE NOT EXISTS (
                SELECT 1 FROM candidate_links_about cla WHERE cla.candidate_id = cm.id
            )
            AND (cm.about IS NOT NULL OR cm.google_scholar_link IS NOT NULL);
        """))
        print(f"  ??? Migrated {result.rowcount} rows ??? candidate_links_about")

        # 3i. candidate_resume_payload from candidate_metadata
        result = conn.execute(text("""
            INSERT INTO candidate_resume_payload (candidate_id, resume_path, raw_resume_text, resume_embedding)
            SELECT cm.id, cm.resume_path, cm.raw_resume_text, cm.resume_embedding
            FROM candidate_metadata cm
            WHERE NOT EXISTS (
                SELECT 1 FROM candidate_resume_payload crp WHERE crp.candidate_id = cm.id
            )
            AND cm.resume_path IS NOT NULL;
        """))
        print(f"  ??? Migrated {result.rowcount} rows ??? candidate_resume_payload")

        # 3j. work_experience (old name ??? new name)
        if _table_exists(conn, 'work_experiences'):
            result = conn.execute(text("""
                INSERT INTO candidate_work_experience (id, candidate_id, company_name, role, start_date, end_date, is_current, entry_order)
                SELECT id, candidate_id, company_name, role, start_date, end_date, is_current, entry_order
                FROM work_experiences
                WHERE NOT EXISTS (
                    SELECT 1 FROM candidate_work_experience cwe WHERE cwe.id = work_experiences.id
                );
            """))
            print(f"  ??? Migrated {result.rowcount} rows ??? candidate_work_experience")

        # 3k. candidate_schooling (old name ??? new name)
        if _table_exists(conn, 'schooling'):
            result = conn.execute(text("""
                INSERT INTO candidate_schooling (id, candidate_id, class_x_percentage, class_xii_percentage)
                SELECT id, candidate_id, class_x_percentage, class_xii_percentage
                FROM schooling
                WHERE NOT EXISTS (
                    SELECT 1 FROM candidate_schooling cs WHERE cs.id = schooling.id
                );
            """))
            print(f"  ??? Migrated {result.rowcount} rows ??? candidate_schooling")

        # 3l. Migrate total_experience_years ??? years_of_experience
        try:
            conn.execute(text("""
                UPDATE candidate_metadata
                SET years_of_experience = total_experience_years
                WHERE total_experience_years IS NOT NULL
                AND years_of_experience IS NULL;
            """))
            print("  ??? Migrated total_experience_years ??? years_of_experience")
        except Exception as e:
            print(f"  ??? Skipped experience migration: {e}")

        # 3m. Migrate application_status_history (update FK from candidate_id to application_tracking_id)
        # First add the new column if the table exists with old schema
        conn.execute(text("""
            ALTER TABLE application_status_history
            ADD COLUMN IF NOT EXISTS application_tracking_id VARCHAR(36)
            REFERENCES application_tracking(id) ON DELETE CASCADE;
        """))
        # Populate it from the join
        conn.execute(text("""
            UPDATE application_status_history ash
            SET application_tracking_id = at.id
            FROM application_tracking at
            WHERE at.candidate_id = ash.candidate_id
            AND ash.application_tracking_id IS NULL;
        """))
        print("  ??? Updated application_status_history.application_tracking_id")

        # ?????? STEP 4: Strip dead columns from candidate_metadata ???????????????
        print("\n[4/6] Stripping redundant columns from candidate_metadata...")

        for col in ['job_id', 'position_applied', 'admin_department', 'current_status',
                    'submitted_at', 'updated_at', 'is_deleted', 'about', 'cv_s3_key',
                    'google_scholar_link', 'total_experience_years', 'resume_path',
                    'raw_resume_text', 'resume_embedding', 'highest_education', 'age',
                    'mobile_number']:
            try:
                conn.execute(text(f"ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS {col};"))
                print(f"  ??? Dropped candidate_metadata.{col}")
            except Exception as e:
                print(f"  ??? Could not drop {col}: {e}")

        # Rename mobile_number if it still exists, or confirm mobile_no exists
        try:
            conn.execute(text("ALTER TABLE candidate_metadata RENAME COLUMN mobile_number TO mobile_no;"))
            print("  ??? Renamed mobile_number ??? mobile_no")
        except Exception as e:
            # It was dropped above or already renamed
            try:
                conn.execute(text("ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(20);"))
                print("  ??? Added mobile_no column")
            except Exception as e2:
                print(f"  ??? mobile_no: {e2}")

        # ?????? STEP 5: Drop old redundant tables ???????????????????????????????????????????????????????????????
        print("\n[5/6] Dropping old tables...")

        old_tables = ['graduation', 'postgraduate', 'doctorate', 'books', 'chapters', 'papers']
        for tbl in old_tables:
            if _table_exists(conn, tbl):
                conn.execute(text(f"DROP TABLE IF EXISTS {tbl} CASCADE;"))
                print(f"  ??? Dropped: {tbl}")
            else:
                print(f"  - Already gone: {tbl}")

        # Drop old work_experiences if new table exists
        if _table_exists(conn, 'work_experiences') and _table_exists(conn, 'candidate_work_experience'):
            conn.execute(text("DROP TABLE IF EXISTS work_experiences CASCADE;"))
            print("  ??? Dropped: work_experiences (replaced by candidate_work_experience)")

        # Drop old schooling if new table exists
        if _table_exists(conn, 'schooling') and _table_exists(conn, 'candidate_schooling'):
            conn.execute(text("DROP TABLE IF EXISTS schooling CASCADE;"))
            print("  ??? Dropped: schooling (replaced by candidate_schooling)")

        # ?????? STEP 6: Final verification ???????????????????????????????????????????????????????????????????????????????????????
        print("\n[6/6] Verification...")
        expected = [
            'job_postings', 'candidate_metadata', 'application_tracking',
            'application_status_history', 'candidate_schooling', 'candidate_higher_education',
            'candidate_publications', 'candidate_work_experience', 'candidate_links_about',
            'candidate_resume_payload', 'token_registry'
        ]
        for tbl in expected:
            exists = _table_exists(conn, tbl)
            mark = "???" if exists else "??? MISSING"
            print(f"  {mark} {tbl}")

        print("\n??? Migration complete.")


def _table_exists(conn, table_name: str) -> bool:
    result = conn.execute(text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :t)"
    ), {"t": table_name})
    return result.scalar()


if __name__ == "__main__":
    run()
