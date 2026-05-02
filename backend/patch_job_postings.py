import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
conn.autocommit = True
cur = conn.cursor()

print("Patching job_postings table...\n")

patches = [
    (
        "Rename department to division in job_postings",
        "ALTER TABLE job_postings RENAME COLUMN department TO division"
    ),
    (
        "Add position column to job_postings",
        """ALTER TABLE job_postings 
           ADD COLUMN IF NOT EXISTS position VARCHAR(50)
           CHECK (position IN (
               'Professor','Associate Professor','Assistant Professor',
               'Research Assistant','Consultant','Admin'
           ))"""
    ),
    (
        "Update division CHECK constraint (drop old, add new values)",
        "ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS job_postings_department_check"
    ),
    (
        "Add division CHECK constraint with new division values",
        """ALTER TABLE job_postings 
           ADD CONSTRAINT chk_job_division 
           CHECK (division IN ('RIS','CMEC','FITM','DAKSHIN','AIC'))"""
    ),
    (
        "Update idx_job_active index (recreate after column rename)",
        "DROP INDEX IF EXISTS idx_job_active"
    ),
    (
        "Recreate idx_job_active on status + is_deleted",
        "CREATE INDEX IF NOT EXISTS idx_job_active ON job_postings(status, is_deleted)"
    ),
]

for label, sql in patches:
    try:
        cur.execute(sql)
        print(f"  [PASS] {label}")
    except Exception as e:
        print(f"  [FAIL] {label}: {e}")

# Verify final structure
print("\nFinal job_postings columns:")
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'job_postings'
    ORDER BY ordinal_position
""")
for row in cur.fetchall():
    print(f"  {row[0]:<20} {row[1]:<20} nullable={row[2]}")

print("\nConstraints on job_postings:")
cur.execute("""
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'job_postings'
    ORDER BY constraint_type
""")
for row in cur.fetchall():
    print(f"  {row[0]} ({row[1]})")

cur.close()
conn.close()
print("\nDone.")
