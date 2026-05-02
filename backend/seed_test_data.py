import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
conn.autocommit = True
cur = conn.cursor()

# Name-based assignments:
# Aarav Singh  → Male, Uttar Pradesh
# Shalini Iyer → Female, Tamil Nadu (user specified)
# Anil Gupta   → Male, Haryana

updates = [
    ("Aarav Singh",  "Male",   "Uttar Pradesh"),
    ("Shalini Iyer", "Female", "Tamil Nadu"),
    ("Anil Gupta",   "Male",   "Haryana"),
]

for name, gender, state in updates:
    cur.execute("""
        UPDATE candidate_metadata
        SET gender = %s, state = %s
        WHERE full_name = %s
    """, (gender, state, name))
    print(f"  Updated: {name} -> {gender}, {state}")

# Verify
print("\nFinal state:")
cur.execute("SELECT full_name, gender, state, position_applied FROM candidate_metadata ORDER BY submitted_at")
for row in cur.fetchall():
    print(f"  {row[0]:<20} | {row[1]:<8} | {row[2]:<20} | {row[3]}")

cur.close()
conn.close()
