-- =============================================================
-- RIS Portal — Full Schema Migration
-- Run this against your local PostgreSQL ris_db database.
-- Migrates all existing data and restructures into new schema.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- STEP 1: Create job_postings (referenced by candidate_metadata)
-- -------------------------------------------------------------
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
);

-- -------------------------------------------------------------
-- STEP 2: Create candidate_metadata from applicants
-- Migrates all existing data, renames description → about,
-- adds new columns with safe defaults.
-- -------------------------------------------------------------
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
                     CHECK (current_status IN (
                         'received','under_review','shortlisted','rejected','offered'
                     )),
    submitted_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

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
    description,   -- description → about
    google_scholar_link,
    'received',
    NOW()
FROM applicants
ON CONFLICT (id) DO NOTHING;

-- Add UNIQUE constraint after data is loaded
ALTER TABLE candidate_metadata
    DROP CONSTRAINT IF EXISTS uq_email_job;
ALTER TABLE candidate_metadata
    ADD CONSTRAINT uq_email_job UNIQUE (email, job_id);

-- Indexes for HR dashboard performance
CREATE INDEX IF NOT EXISTS idx_candidate_job_id     ON candidate_metadata(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_status     ON candidate_metadata(current_status);
CREATE INDEX IF NOT EXISTS idx_candidate_ai_score   ON candidate_metadata(ai_score);
CREATE INDEX IF NOT EXISTS idx_candidate_submitted  ON candidate_metadata(submitted_at);

-- -------------------------------------------------------------
-- STEP 3: Create schooling from class_x/xii columns
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schooling (
    id                   TEXT  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id         TEXT  NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    class_x_percentage   FLOAT NOT NULL,
    class_xii_percentage FLOAT NOT NULL
);

INSERT INTO schooling (candidate_id, class_x_percentage, class_xii_percentage)
SELECT id, class_x_percentage::float, class_xii_percentage::float
FROM applicants
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 4: Create graduation from higher_education (Bachelors)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS graduation (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    university   VARCHAR(200) NOT NULL,
    degree_name  VARCHAR(200) NOT NULL,
    score_type   VARCHAR(20)  NOT NULL DEFAULT 'Percentage'
                 CHECK (score_type IN ('Percentage','CGPA')),
    score_value  FLOAT        NOT NULL,
    entry_order  INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO graduation (candidate_id, university, degree_name, score_type, score_value, entry_order)
SELECT applicant_id, university, COALESCE(degree_name, 'N/A'), score_type::text, score_value::float, entry_order
FROM higher_education
WHERE level = 'Bachelors'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 5: Create postgraduate from higher_education (Masters)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS postgraduate (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    university   VARCHAR(200),
    degree_name  VARCHAR(200),
    score_type   VARCHAR(20)  DEFAULT 'Percentage'
                 CHECK (score_type IN ('Percentage','CGPA')),
    score_value  FLOAT,
    entry_order  INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO postgraduate (candidate_id, university, degree_name, score_type, score_value, entry_order)
SELECT applicant_id, university, degree_name, score_type::text, score_value::float, entry_order
FROM higher_education
WHERE level = 'Masters'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 6: Create doctorate from higher_education (Doctorate)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctorate (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    university   VARCHAR(200),
    thesis_title VARCHAR(500),
    score_type   VARCHAR(20)  DEFAULT 'Percentage'
                 CHECK (score_type IN ('Percentage','CGPA')),
    score_value  FLOAT,
    entry_order  INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO doctorate (candidate_id, university, thesis_title, score_type, score_value, entry_order)
SELECT applicant_id, university, thesis_title, score_type::text, score_value::float, entry_order
FROM higher_education
WHERE level = 'Doctorate'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 7: Create books from publications (Book)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    entry_order  INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO books (candidate_id, title, entry_order)
SELECT applicant_id, title, entry_order
FROM publications
WHERE type = 'Book'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 8: Create chapters from publications (Chapter)
-- parent_title → corresponding_book
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapters (
    id                 TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id       TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    chapter_name       VARCHAR(500) NOT NULL,
    corresponding_book VARCHAR(500) NOT NULL,
    entry_order        INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO chapters (candidate_id, chapter_name, corresponding_book, entry_order)
SELECT applicant_id, title, COALESCE(parent_title, 'Unknown'), entry_order
FROM publications
WHERE type = 'Chapter'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 9: Create papers from publications (Paper)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS papers (
    id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT         NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    entry_order  INTEGER      NOT NULL DEFAULT 1
);

INSERT INTO papers (candidate_id, title, entry_order)
SELECT applicant_id, title, entry_order
FROM publications
WHERE type = 'Paper'
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 10: Create new work_experiences_v2
-- Renames applicant_id → candidate_id, adds is_current column
-- -------------------------------------------------------------
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
);

INSERT INTO work_experiences_v2 (
    id, candidate_id, company_name, role,
    start_date, end_date, is_current, description, entry_order
)
SELECT
    id,
    applicant_id,
    company_name,
    role,
    start_date,
    end_date,
    CASE WHEN end_date IS NULL THEN TRUE ELSE FALSE END,
    description,
    entry_order
FROM work_experiences
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 11: Create application_status_history (new table)
-- Seed one 'received' entry for all migrated candidates.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_status_history (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
    candidate_id TEXT        NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
    status       VARCHAR(30) NOT NULL
                 CHECK (status IN ('received','under_review','shortlisted','rejected','offered')),
    changed_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    changed_by   VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    notes        TEXT
);

INSERT INTO application_status_history (candidate_id, status, changed_by, notes)
SELECT id, 'received', 'SYSTEM', 'Migrated from legacy applicants table'
FROM candidate_metadata
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- STEP 12: Swap work_experiences → work_experiences_v2
-- Drop old table, rename new one
-- -------------------------------------------------------------
DROP TABLE IF EXISTS work_experiences CASCADE;
ALTER TABLE work_experiences_v2 RENAME TO work_experiences;

-- -------------------------------------------------------------
-- STEP 13: Drop legacy tables (data is fully migrated)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS higher_education CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
-- NOTE: applicants table is kept temporarily as a backup.
-- Verify data integrity, then run: DROP TABLE applicants;

-- -------------------------------------------------------------
-- STEP 14: Verify row counts match
-- -------------------------------------------------------------
DO $$
DECLARE
    orig_count   INTEGER;
    new_count    INTEGER;
BEGIN
    SELECT COUNT(*) INTO orig_count FROM applicants;
    SELECT COUNT(*) INTO new_count  FROM candidate_metadata;
    IF orig_count <> new_count THEN
        RAISE EXCEPTION 'Row count mismatch! applicants=% candidate_metadata=%', orig_count, new_count;
    END IF;
    RAISE NOTICE 'Migration verified: % candidate records migrated successfully.', new_count;
END $$;

COMMIT;
