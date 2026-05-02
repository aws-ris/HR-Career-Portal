import psycopg2
import uuid
from datetime import datetime, date

def inject_complex_candidates():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
    conn.autocommit = True
    cur = conn.cursor()

    # Targets
    jobs = [
        {'id': 'ec761c44-d68c-4f38-83eb-1b2bb888dbca', 'title': 'Professor - International Trade & Finance'},
        {'id': 'ad2dfc4c-4d05-49e6-980f-ee8349b84e19', 'title': 'Associate Professor - Macroeconomics'}
    ]

    candidates = [
        {"name": "Dr. Vikram Seth", "gender": "Male", "state": "Delhi", "job_idx": 0, "highest": "PhD", "pg": 2, "grad": 1, "work": 3},
        {"name": "Dr. Sanya Malhotra", "gender": "Female", "state": "Maharashtra", "job_idx": 1, "highest": "PhD", "pg": 2, "grad": 2, "work": 2},
        {"name": "Mr. Rohan Gupta", "gender": "Male", "state": "Karnataka", "job_idx": 1, "highest": "Masters", "pg": 2, "grad": 1, "work": 3},
        {"name": "Ms. Ananya Iyer", "gender": "Female", "state": "Tamil Nadu", "job_idx": 0, "highest": "PhD", "pg": 1, "grad": 3, "work": 2},
        {"name": "Mr. Arjun Singh", "gender": "Male", "state": "Punjab", "job_idx": 0, "highest": "Masters", "pg": 1, "grad": 3, "work": 1}
    ]

    print("Injecting 5 Complex Candidates...")

    for c in candidates:
        c_id = str(uuid.uuid4())
        job = jobs[c['job_idx']]
        
        # Metadata
        cur.execute("""
            INSERT INTO candidate_metadata 
            (id, job_id, position_applied, full_name, email, mobile_number, dob, gender, state, highest_education, current_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            c_id, job['id'], job['title'], c['name'], f"{c['name'].lower().replace(' ', '.')}@ris.edu", 
            "9876543210", date(1980, 1, 1), c['gender'], c['state'], c['highest'], 'under_review'
        ))

        # Graduation (Multi)
        for i in range(c['grad']):
            cur.execute("INSERT INTO graduation (candidate_id, entry_order, university, degree_name, score_type, score_value) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, i+1, f"University {i+1}", f"Bachelor Degree {i+1}", "Percentage", 85.0))

        # PG (Multi)
        for i in range(c['pg']):
            cur.execute("INSERT INTO postgraduate (candidate_id, entry_order, university, degree_name, score_type, score_value) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, i+1, f"Elite Institute {i+1}", f"Master Degree {i+1}", "CGPA", 9.0))

        # PhD
        if c['highest'] == 'PhD':
            cur.execute("INSERT INTO doctorate (candidate_id, entry_order, university, thesis_title, score_type, score_value) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, 1, "Top Global Univ", "Advanced Economics Study", "CGPA", 9.5))

        # Work Ex (Multi)
        for i in range(c['work']):
            cur.execute("INSERT INTO work_experiences (candidate_id, entry_order, company_name, role, start_date, description) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, i+1, f"Organization {i+1}", f"Senior Specialist {i+1}", date(2010+i, 1, 1), "Pivotal role in strategic development."))

        print(f"  [OK] Injected {c['name']} for {job['title']}")

    cur.close()
    conn.close()
    print("\nInjection Complete.")

if __name__ == "__main__":
    inject_complex_candidates()
