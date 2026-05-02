import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
conn.autocommit = True  # run each statement independently
cur = conn.cursor()

print("Running RIS Schema Migration...")

statements = [

# 1. job_postings
"""
CREATE TABLE IF NOT EXISTS job_postings (
    id             TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title          VARCHAR(200) NOT NULL,
    department     VARCHAR(100) NOT NULL,
    description    TEXT         NOT NULL,
    requirements   TEXT,
    keywords       TEXT[],
    status         VARCHAR(20)  NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','open','closed','archived')),
    total_openings INTEGER      NOT NULL DEFAULT 1,
    location       VARCHAR(100),
    deadline       DATE,
    created_by     VARCHAR(100),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
)
""",

# 2. candidate_metadata
"""
CREATE TABLE IF NOT EXISTS candidate_metadata (
    id               TEXT         PRIMARY KEY,
    job_id           TEXT         REFERENCES job_postings(id) ON DELETE SET NULL,
    position_applied VARCHAR(100),
    full_name        VARCHAR(200) NOT NULL,
    email            VARCHAR(200) NOT NULL,
    mobile_number    VARCHAR(15)  NOT NULL,
    dob              DATE         NOT NULL,
    gender           VARCHAR(30),
    state            VARCHAR(100),
    about            TEXT,
    cv_s3_key        VARCHAR(500),
    google_scholar_link VARCHAR(500),
    ai_score         FLOAT,
    ai_match_score   FLOAT,
    ai_summary       TEXT,
    current_status   VARCHAR(30)  NOT NULL DEFAULT 'received'
                     CHECK (current_status IN ('received','under_review','shortlisted','rejected','offered')),
    submitted_at     TIMESTAMP    NOT NULL DEFAULT NOW()
)
""",

# 3. insert applicants → candidate_metadata
"""
INSERT INTO candidate_metadata (
    id, position_applied, full_name, email, mobile_number,
    dob, about, google_scholar_link, current_status, submitted_at
)
SELECT
    id,
    position_applied::text,
    full_name,
    email,
    mobile_number,
    dob,
    description,
    google_scholar_link,
    'received',
    NOW()
FROM applicants
ON CONFLICT (id) DO NOTHING
""",

# 4. unique constraint on (email, job_id)
"ALTER TABLE candidate_metadata DROP CONSTRAINT IF EXISTS uq_email_job",
"ALTER TABLE candidate_metadata ADD CONSTRAINT uq_email_job UNIQUE (email, job_id)",

# 5. indexes
"CREATE INDEX IF NOT EXISTS idx_candidate_job_id    ON candidate_metadata(job_id)",
"CREATE INDEX IF NOT EXISTS idx_candidate_status    ON candidate_metadata(current_status)",
"CREATE INDEX IF NOT EXISTS idx_candidate_ai_score  ON candidate_metadata(ai_score)",
"CREATE INDEX IF NOT EXISTS idx_candidate_submitted ON candidate_metadata(submitted_at)",

# 6. schooling
"""
CREATE TABLE IF NOT EXISTS schooling (
    id                   TEXT  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id         TEXT  NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    class_x_percentage   FLOAT NOT NULL,
    class_xii_percentage FLOAT NOT NULL
)
""",
"""
INSERT INTO schooling (candidate_id, class_x_percentage, class_xii_percentage)
SELECT id, class_x_percentage::float, class_xii_percentage::float
FROM applicants
ON CONFLICT DO NOTHING
""",

# 7. graduation
"""
CREATE TABLE IF NOT EXISTS graduation (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    university   VARCHAR(200) NOT NULL,
    degree_name  VARCHAR(200) NOT NULL,
    score_type   VARCHAR(20)  NOT NULL DEFAULT 'Percentage'
                 CHECK (score_type IN ('Percentage','CGPA')),
    score_value  FLOAT        NOT NULL,
    entry_order  INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO graduation (candidate_id, university, degree_name, score_type, score_value, entry_order)
SELECT applicant_id, university, COALESCE(degree_name,'N/A'), score_type::text, score_value::float, entry_order
FROM higher_education WHERE level = 'Bachelors'
ON CONFLICT DO NOTHING
""",

# 8. postgraduate
"""
CREATE TABLE IF NOT EXISTS postgraduate (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    university   VARCHAR(200),
    degree_name  VARCHAR(200),
    score_type   VARCHAR(20)  DEFAULT 'Percentage'
                 CHECK (score_type IN ('Percentage','CGPA')),
    score_value  FLOAT,
    entry_order  INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO postgraduate (candidate_id, university, degree_name, score_type, score_value, entry_order)
SELECT applicant_id, university, degree_name, score_type::text, score_value::float, entry_order
FROM higher_education WHERE level = 'Masters'
ON CONFLICT DO NOTHING
""",

# 9. doctorate
"""
CREATE TABLE IF NOT EXISTS doctorate (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    university   VARCHAR(200),
    thesis_title VARCHAR(500),
    score_type   VARCHAR(20)  DEFAULT 'Percentage'
                 CHECK (score_type IN ('Percentage','CGPA')),
    score_value  FLOAT,
    entry_order  INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO doctorate (candidate_id, university, thesis_title, score_type, score_value, entry_order)
SELECT applicant_id, university, thesis_title, score_type::text, score_value::float, entry_order
FROM higher_education WHERE level = 'Doctorate'
ON CONFLICT DO NOTHING
""",

# 10. books
"""
CREATE TABLE IF NOT EXISTS books (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    entry_order  INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO books (candidate_id, title, entry_order)
SELECT applicant_id, title, entry_order
FROM publications WHERE type = 'Book'
ON CONFLICT DO NOTHING
""",

# 11. chapters
"""
CREATE TABLE IF NOT EXISTS chapters (
    id                 TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id       TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    chapter_name       VARCHAR(500) NOT NULL,
    corresponding_book VARCHAR(500) NOT NULL,
    entry_order        INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO chapters (candidate_id, chapter_name, corresponding_book, entry_order)
SELECT applicant_id, title, COALESCE(parent_title,'Unknown'), entry_order
FROM publications WHERE type = 'Chapter'
ON CONFLICT DO NOTHING
""",

# 12. papers
"""
CREATE TABLE IF NOT EXISTS papers (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    entry_order  INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO papers (candidate_id, title, entry_order)
SELECT applicant_id, title, entry_order
FROM publications WHERE type = 'Paper'
ON CONFLICT DO NOTHING
""",

# 13. work_experiences (rename applicant_id -> candidate_id, add is_current)
"""
CREATE TABLE IF NOT EXISTS work_experiences_v2 (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    role         VARCHAR(200) NOT NULL,
    start_date   DATE         NOT NULL,
    end_date     DATE,
    is_current   BOOLEAN      NOT NULL DEFAULT FALSE,
    description  TEXT,
    entry_order  INTEGER      NOT NULL DEFAULT 1
)
""",
"""
INSERT INTO work_experiences_v2 (id, candidate_id, company_name, role, start_date, end_date, is_current, description, entry_order)
SELECT id, applicant_id, company_name, role, start_date, end_date,
       CASE WHEN end_date IS NULL THEN TRUE ELSE FALSE END,
       description, entry_order
FROM work_experiences
ON CONFLICT DO NOTHING
""",

# 14. application_status_history
"""
CREATE TABLE IF NOT EXISTS application_status_history (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT        NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    status       VARCHAR(30) NOT NULL
                 CHECK (status IN ('received','under_review','shortlisted','rejected','offered')),
    changed_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    changed_by   VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    notes        TEXT
)
""",
"""
INSERT INTO application_status_history (candidate_id, status, changed_by, notes)
SELECT id, 'received', 'SYSTEM', 'Migrated from legacy applicants table'
FROM candidate_metadata
ON CONFLICT DO NOTHING
""",

# 15. Swap work_experiences
"DROP TABLE IF EXISTS work_experiences CASCADE",
"ALTER TABLE work_experiences_v2 RENAME TO work_experiences",

# 16. Drop migrated legacy tables (applicants kept as backup)
"DROP TABLE IF EXISTS higher_education CASCADE",
"DROP TABLE IF EXISTS publications CASCADE",
]

for i, stmt in enumerate(statements, 1):
    label = stmt.strip().split('\n')[0].strip()[:70]
    try:
        cur.execute(stmt)
        print(f"[OK {i:02d}] {label}")
    except Exception as e:
        print(f"[FAIL {i:02d}] {label}")
        print(f"       ERROR: {e}")

# Final verification
print("\n=== Row Counts ===")
for table in ['job_postings','candidate_metadata','schooling','graduation',
              'postgraduate','doctorate','books','chapters','papers',
              'work_experiences','application_status_history']:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    print(f"  {table}: {cur.fetchone()[0]} rows")

orig_count_q = "SELECT COUNT(*) FROM applicants"
cur.execute(orig_count_q)
orig = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM candidate_metadata")
new = cur.fetchone()[0]
print(f"\n  applicants (backup): {orig} | candidate_metadata: {new}")
if orig == new:
    print("  [PASS] Row counts match. Migration successful.")
else:
    print("  [WARN] Row count mismatch - investigate before dropping applicants!")

cur.close()
conn.close()
