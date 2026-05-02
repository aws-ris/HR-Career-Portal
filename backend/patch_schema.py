import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
conn.autocommit = True
cur = conn.cursor()

print("Applying schema hardening patches...\n")

patches = [

    # GAP 1: Add missing admin_department column to candidate_metadata
    (
        "Add admin_department to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS admin_department VARCHAR(50)"
    ),
    # Backfill from applicants backup where applicable
    (
        "Backfill admin_department from applicants backup",
        """
        UPDATE candidate_metadata cm
        SET admin_department = a.admin_department::text
        FROM applicants a
        WHERE cm.id = a.id AND a.admin_department IS NOT NULL
        """
    ),

    # GAP 2: Add updated_at to candidate_metadata
    (
        "Add updated_at to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()"
    ),

    # GAP 3a: Add is_deleted soft delete flag to candidate_metadata
    (
        "Add is_deleted soft delete to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE"
    ),
    # GAP 3b: Add is_deleted to job_postings too
    (
        "Add is_deleted soft delete to job_postings",
        "ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE"
    ),

    # GAP 4: UNIQUE(candidate_id, entry_order) on education tables
    (
        "UNIQUE constraint on graduation (candidate_id, entry_order)",
        "ALTER TABLE graduation DROP CONSTRAINT IF EXISTS uq_grad_entry; ALTER TABLE graduation ADD CONSTRAINT uq_grad_entry UNIQUE (candidate_id, entry_order)"
    ),
    (
        "UNIQUE constraint on postgraduate (candidate_id, entry_order)",
        "ALTER TABLE postgraduate DROP CONSTRAINT IF EXISTS uq_postgrad_entry; ALTER TABLE postgraduate ADD CONSTRAINT uq_postgrad_entry UNIQUE (candidate_id, entry_order)"
    ),
    (
        "UNIQUE constraint on doctorate (candidate_id, entry_order)",
        "ALTER TABLE doctorate DROP CONSTRAINT IF EXISTS uq_doc_entry; ALTER TABLE doctorate ADD CONSTRAINT uq_doc_entry UNIQUE (candidate_id, entry_order)"
    ),
    (
        "UNIQUE constraint on books (candidate_id, entry_order)",
        "ALTER TABLE books DROP CONSTRAINT IF EXISTS uq_books_entry; ALTER TABLE books ADD CONSTRAINT uq_books_entry UNIQUE (candidate_id, entry_order)"
    ),
    (
        "UNIQUE constraint on chapters (candidate_id, entry_order)",
        "ALTER TABLE chapters DROP CONSTRAINT IF EXISTS uq_chapters_entry; ALTER TABLE chapters ADD CONSTRAINT uq_chapters_entry UNIQUE (candidate_id, entry_order)"
    ),
    (
        "UNIQUE constraint on papers (candidate_id, entry_order)",
        "ALTER TABLE papers DROP CONSTRAINT IF EXISTS uq_papers_entry; ALTER TABLE papers ADD CONSTRAINT uq_papers_entry UNIQUE (candidate_id, entry_order)"
    ),
    (
        "UNIQUE constraint on work_experiences (candidate_id, entry_order)",
        "ALTER TABLE work_experiences DROP CONSTRAINT IF EXISTS uq_work_entry; ALTER TABLE work_experiences ADD CONSTRAINT uq_work_entry UNIQUE (candidate_id, entry_order)"
    ),

    # EXTRA: Index on is_deleted for fast active-record queries
    (
        "Index on candidate_metadata.is_deleted",
        "CREATE INDEX IF NOT EXISTS idx_candidate_not_deleted ON candidate_metadata(is_deleted)"
    ),
    (
        "Index on job_postings.status + is_deleted",
        "CREATE INDEX IF NOT EXISTS idx_job_active ON job_postings(status, is_deleted)"
    ),

    # EXTRA: Index on schooling for faster join
    (
        "Index on schooling.candidate_id",
        "CREATE INDEX IF NOT EXISTS idx_schooling_candidate ON schooling(candidate_id)"
    ),
]

for label, sql in patches:
    # Handle multi-statement patches
    stmts = [s.strip() for s in sql.split(';') if s.strip()]
    try:
        for stmt in stmts:
            cur.execute(stmt)
        print(f"  [PASS] {label}")
    except Exception as e:
        print(f"  [FAIL] {label}")
        print(f"         {e}")

print("\nDone. Verifying final state...\n")

# Quick spot check
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'candidate_metadata'
    ORDER BY ordinal_position
""")
cols = [r[0] for r in cur.fetchall()]
print("candidate_metadata columns:", ", ".join(cols))

cur.execute("""
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name IN ('graduation','postgraduate','doctorate','books','chapters','papers','work_experiences')
    AND constraint_type = 'UNIQUE'
    ORDER BY table_name
""")
print("\nUnique constraints on child tables:")
for r in cur.fetchall():
    print(f"  {r[0]}")

cur.close()
conn.close()
print("\nAll patches applied successfully.")
