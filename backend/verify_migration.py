import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
cur = conn.cursor()

PASS = "  [PASS]"
FAIL = "  [FAIL]"
WARN = "  [WARN]"

def check(label, condition, detail=""):
    status = PASS if condition else FAIL
    print(f"{status} {label}" + (f" | {detail}" if detail else ""))
    return condition

all_passed = True

print("=" * 60)
print("  RIS Schema — Deep Verification Report")
print("=" * 60)

# ─────────────────────────────────────────────────────────────
print("\n[1] ALL 11 TABLES EXIST")
# ─────────────────────────────────────────────────────────────
expected_tables = [
    'job_postings', 'candidate_metadata', 'schooling',
    'graduation', 'postgraduate', 'doctorate',
    'books', 'chapters', 'papers',
    'work_experiences', 'application_status_history'
]
for t in expected_tables:
    cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s)", (t,))
    exists = cur.fetchone()[0]
    all_passed = check(f"Table '{t}' exists", exists) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[2] LEGACY TABLES DROPPED")
# ─────────────────────────────────────────────────────────────
for t in ['higher_education', 'publications', 'work_experiences_v2']:
    cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s)", (t,))
    exists = cur.fetchone()[0]
    all_passed = check(f"Legacy table '{t}' is gone", not exists) and all_passed

cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applicants')")
exists = cur.fetchone()[0]
print(f"  [INFO] 'applicants' backup table: {'EXISTS (drop when ready)' if exists else 'DROPPED'}")

# ─────────────────────────────────────────────────────────────
print("\n[3] ROW COUNTS")
# ─────────────────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) FROM applicants")
orig = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM candidate_metadata")
cand = cur.fetchone()[0]
all_passed = check("candidate_metadata matches applicants backup", orig == cand, f"{orig} -> {cand}") and all_passed

cur.execute("SELECT COUNT(*) FROM schooling")
sch = cur.fetchone()[0]
all_passed = check("schooling has 1 row per candidate", sch == cand, f"{sch} schooling vs {cand} candidates") and all_passed

for table in ['graduation','postgraduate','doctorate','books','chapters','papers','work_experiences','application_status_history']:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    cnt = cur.fetchone()[0]
    print(f"  [INFO] {table}: {cnt} rows")

# ─────────────────────────────────────────────────────────────
print("\n[4] COLUMN STRUCTURE — candidate_metadata")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'candidate_metadata'
    ORDER BY ordinal_position
""")
cols = [r[0] for r in cur.fetchall()]
required_cols = [
    'id','job_id','position_applied','full_name','email','mobile_number',
    'dob','gender','state','about','cv_s3_key','google_scholar_link',
    'ai_score','ai_match_score','ai_summary','current_status','submitted_at'
]
for col in required_cols:
    all_passed = check(f"Column '{col}' present", col in cols) and all_passed

# Make sure old 'description' column is gone
all_passed = check("Old 'description' column removed", 'description' not in cols) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[5] COLUMN STRUCTURE — work_experiences")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'work_experiences'
    ORDER BY ordinal_position
""")
we_cols = [r[0] for r in cur.fetchall()]
all_passed = check("work_experiences has 'candidate_id' (not applicant_id)", 'candidate_id' in we_cols) and all_passed
all_passed = check("work_experiences has 'is_current' column", 'is_current' in we_cols) and all_passed
all_passed = check("work_experiences old 'applicant_id' removed", 'applicant_id' not in we_cols) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[6] COLUMN STRUCTURE — schooling")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'schooling'
""")
sch_cols = [r[0] for r in cur.fetchall()]
all_passed = check("schooling has NO board column", 'class_x_board' not in sch_cols) and all_passed
all_passed = check("schooling has NO stream column", 'class_xii_stream' not in sch_cols) and all_passed
all_passed = check("schooling has class_x_percentage", 'class_x_percentage' in sch_cols) and all_passed
all_passed = check("schooling has class_xii_percentage", 'class_xii_percentage' in sch_cols) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[7] COLUMN STRUCTURE — doctorate")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'doctorate'
""")
doc_cols = [r[0] for r in cur.fetchall()]
all_passed = check("doctorate has 'thesis_title'", 'thesis_title' in doc_cols) and all_passed
all_passed = check("doctorate has NO 'degree_name'", 'degree_name' not in doc_cols) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[8] COLUMN STRUCTURE — chapters")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'chapters'
""")
ch_cols = [r[0] for r in cur.fetchall()]
all_passed = check("chapters has 'chapter_name'", 'chapter_name' in ch_cols) and all_passed
all_passed = check("chapters has 'corresponding_book'", 'corresponding_book' in ch_cols) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[9] CONSTRAINTS")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'candidate_metadata'
    AND constraint_type IN ('UNIQUE','CHECK','PRIMARY KEY')
""")
cand_constraints = [r[0] for r in cur.fetchall()]
all_passed = check("UNIQUE(email, job_id) constraint exists", 'uq_email_job' in cand_constraints) and all_passed

cur.execute("""
    SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE constraint_type = 'CHECK'
    AND table_name IN ('candidate_metadata','job_postings','application_status_history',
                       'graduation','postgraduate','doctorate')
""")
check_count = cur.fetchone()[0]
all_passed = check("CHECK constraints present on key tables", check_count >= 4, f"{check_count} total") and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[10] FOREIGN KEY REFERENCES")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.key_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name
""")
fks = cur.fetchall()
fk_tables = [r[0] for r in fks]
for expected in ['schooling','graduation','postgraduate','doctorate',
                 'books','chapters','papers','work_experiences','application_status_history']:
    all_passed = check(f"FK: {expected} -> candidate_metadata", expected in fk_tables) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[11] INDEXES")
# ─────────────────────────────────────────────────────────────
cur.execute("SELECT indexname FROM pg_indexes WHERE tablename = 'candidate_metadata'")
indexes = [r[0] for r in cur.fetchall()]
for idx in ['idx_candidate_job_id','idx_candidate_status','idx_candidate_ai_score','idx_candidate_submitted']:
    all_passed = check(f"Index '{idx}' exists", idx in indexes) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n[12] DATA INTEGRITY")
# ─────────────────────────────────────────────────────────────

# Every candidate has a schooling record
cur.execute("""
    SELECT COUNT(*) FROM candidate_metadata cm
    LEFT JOIN schooling s ON s.candidate_id = cm.id
    WHERE s.id IS NULL
""")
missing_schooling = cur.fetchone()[0]
all_passed = check("Every candidate has a schooling record", missing_schooling == 0,
                   f"{missing_schooling} missing") and all_passed

# Every candidate has at least one status_history entry
cur.execute("""
    SELECT COUNT(*) FROM candidate_metadata cm
    LEFT JOIN application_status_history ash ON ash.candidate_id = cm.id
    WHERE ash.id IS NULL
""")
missing_history = cur.fetchone()[0]
all_passed = check("Every candidate has status history", missing_history == 0,
                   f"{missing_history} missing") and all_passed

# No orphaned records in child tables
for table in ['schooling','graduation','postgraduate','doctorate','books','chapters','papers','work_experiences']:
    cur.execute(f"""
        SELECT COUNT(*) FROM {table} t
        LEFT JOIN candidate_metadata cm ON cm.id = t.candidate_id
        WHERE cm.id IS NULL
    """)
    orphans = cur.fetchone()[0]
    all_passed = check(f"No orphaned rows in {table}", orphans == 0, f"{orphans} orphans") and all_passed

# Data spot check — sample a candidate
cur.execute("""
    SELECT cm.full_name, cm.about, cm.current_status, s.class_x_percentage
    FROM candidate_metadata cm
    JOIN schooling s ON s.candidate_id = cm.id
    LIMIT 1
""")
row = cur.fetchone()
if row:
    name, about, status, class_x = row
    print(f"\n  [SAMPLE] name={name} | status={status} | class_x={class_x} | about={'present' if about else 'None'}")

# ─────────────────────────────────────────────────────────────
print("\n[13] job_postings TABLE STRUCTURE")
# ─────────────────────────────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'job_postings'
    ORDER BY ordinal_position
""")
jp_cols = [r[0] for r in cur.fetchall()]
for col in ['id','title','department','description','requirements','keywords',
            'status','total_openings','location','deadline','created_by','created_at','updated_at']:
    all_passed = check(f"job_postings.{col}", col in jp_cols) and all_passed

# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
if all_passed:
    print("  RESULT: ALL CHECKS PASSED. Migration is complete and robust.")
else:
    print("  RESULT: SOME CHECKS FAILED. Review above before proceeding.")
print("=" * 60)

cur.close()
conn.close()
