import psycopg2

def run_smart_migration():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
    conn.autocommit = True
    cur = conn.cursor()

    print("Step 1: Adding 'highest_education' column to candidate_metadata...")
    try:
        cur.execute("ALTER TABLE candidate_metadata ADD COLUMN highest_education VARCHAR(50)")
        print("  [OK] Column added.")
    except Exception as e:
        print(f"  [INFO] Column might already exist: {e}")

    print("\nStep 2: Populating highest_education for existing candidates...")
    
    # Get all candidate IDs
    cur.execute("SELECT id FROM candidate_metadata")
    candidate_ids = [r[0] for r in cur.fetchall()]
    
    for c_id in candidate_ids:
        # Check Doctorate
        cur.execute("SELECT id FROM doctorate WHERE candidate_id = %s", (c_id,))
        if cur.fetchone():
            highest = 'PhD'
        else:
            # Check Postgraduate
            cur.execute("SELECT id FROM postgraduate WHERE candidate_id = %s", (c_id,))
            if cur.fetchone():
                highest = 'Masters'
            else:
                # Check Graduation
                cur.execute("SELECT id FROM graduation WHERE candidate_id = %s", (c_id,))
                if cur.fetchone():
                    highest = 'Bachelors'
                else:
                    highest = None
        
        if highest:
            cur.execute("UPDATE candidate_metadata SET highest_education = %s WHERE id = %s", (highest, c_id))
            print(f"  [OK] Candidate {c_id[:8]}... -> {highest}")

    cur.close()
    conn.close()
    print("\nSmart Migration Complete!")

if __name__ == "__main__":
    run_smart_migration()
