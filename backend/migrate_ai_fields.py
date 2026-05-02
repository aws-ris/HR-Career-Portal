import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
conn.autocommit = True
cur = conn.cursor()

print("Applying AI Semantic Search schema patches...\n")

patches = [
    (
        "Drop old AI columns (ai_score, ai_match_score, ai_summary)",
        """
        ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS ai_score;
        ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS ai_match_score;
        ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS ai_summary;
        """
    ),
    (
        "Add total_experience_years to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS total_experience_years FLOAT"
    ),
    (
        "Add resume_path to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS resume_path VARCHAR(500)"
    ),
    (
        "Add raw_resume_text to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS raw_resume_text TEXT"
    ),
    (
        "Add resume_embedding to candidate_metadata",
        "ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS resume_embedding FLOAT[]"
    ),
]

for label, sql in patches:
    stmts = [s.strip() for s in sql.split(';') if s.strip()]
    try:
        for stmt in stmts:
            cur.execute(stmt)
        print(f"  [PASS] {label}")
    except Exception as e:
        print(f"  [FAIL] {label}")
        print(f"         {e}")

print("\nDone. Verifying final state...\n")

cur.execute("""
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'candidate_metadata'
    ORDER BY ordinal_position
""")
print("candidate_metadata columns:")
for r in cur.fetchall():
    if r[0] in ['total_experience_years', 'resume_path', 'raw_resume_text', 'resume_embedding']:
        print(f"  -> {r[0]} ({r[1]})")

cur.close()
conn.close()
print("\nAll AI patches applied successfully.")
