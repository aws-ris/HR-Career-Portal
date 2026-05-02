import psycopg2
import uuid
import random
from datetime import datetime, date

def inject_30_candidates():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
    conn.autocommit = True
    cur = conn.cursor()

    # Clear previous partially failed injection
    cur.execute("DELETE FROM candidate_metadata WHERE email LIKE '%@example.com'")

    # Current open jobs
    jobs = [
        {'id': 'ec761c44-d68c-4f38-83eb-1b2bb888dbca', 'title': 'Professor - International Trade & Finance', 'pos': 'Professor'},
        {'id': 'ad2dfc4c-4d05-49e6-980f-ee8349b84e19', 'title': 'Associate Professor - Macroeconomics', 'pos': 'Associate Professor'},
        {'id': '7bbef3e9-4176-4ab3-afac-f6b162c362d1', 'title': 'Research Assistant - Digital Innovation', 'pos': 'Research Assistant'},
        {'id': 'c5aa776e-a81b-4114-bd86-f4016d5dbf4f', 'title': 'Professor - Machine Learning', 'pos': 'Professor'}
    ]

    first_names = ["Arjun", "Aditi", "Rohan", "Sanya", "Vikram", "Isha", "Kabir", "Meera", "Siddharth", "Ananya", "Rahul", "Priya", "Amit", "Kavita", "Deepak", "Riya", "Suresh", "Neeta", "Vijay", "Sunita", "Rajesh", "Pooja", "Manish", "Shweta", "Anil", "Geeta", "Sunil", "Asha", "Ravi", "Lata"]
    last_names = ["Sharma", "Verma", "Gupta", "Iyer", "Nair", "Reddy", "Patel", "Singh", "Das", "Mukherjee", "Chauhan", "Joshi", "Bose", "Kulkarni", "Deshmukh", "Choudhury"]
    states = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Punjab", "Gujarat", "Haryana", "Kerala"]
    genders = ["Male", "Female"]

    print(f"Injecting 30 candidates across {len(jobs)} jobs...")

    for i in range(30):
        c_id = str(uuid.uuid4())
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        email = f"{fname.lower()}.{lname.lower()}{i}@example.com"
        mobile = f"{random.randint(7000000000, 9999999999)}"
        gender = random.choice(genders)
        state = random.choice(states)
        job = random.choice(jobs)
        
        # Candidate Metadata
        cur.execute("""
            INSERT INTO candidate_metadata 
            (id, job_id, position_applied, full_name, email, mobile_number, dob, gender, state, about, current_status, submitted_at, updated_at, is_deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            c_id, job['id'], job['title'], full_name, email, mobile, 
            date(random.randint(1975, 1998), random.randint(1, 12), random.randint(1, 28)),
            gender, state, f"I am a passionate professional in {job['title']} with over {random.randint(2, 15)} years of experience...",
            'received', datetime.utcnow(), datetime.utcnow(), False
        ))

        # Schooling
        cur.execute("INSERT INTO schooling (candidate_id, class_x_percentage, class_xii_percentage) VALUES (%s, %s, %s)", 
                    (c_id, random.uniform(75, 98), random.uniform(75, 98)))

        # Graduation
        cur.execute("INSERT INTO graduation (candidate_id, entry_order, university, degree_name, score_type, score_value) VALUES (%s, %s, %s, %s, %s, %s)",
                    (c_id, 1, "University of " + random.choice(states), "B.Tech/B.A/B.Sc", "Percentage", random.uniform(65, 95)))

        # Postgraduate
        if job['pos'] in ['Professor', 'Associate Professor'] or random.random() > 0.5:
            cur.execute("INSERT INTO postgraduate (candidate_id, entry_order, university, degree_name, score_type, score_value) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, 1, "IIT " + random.choice(states), "M.Tech/M.A/M.Sc", "CGPA", random.uniform(7.5, 9.8)))

        # Doctorate
        if job['pos'] in ['Professor', 'Associate Professor']:
            cur.execute("INSERT INTO doctorate (candidate_id, entry_order, university, thesis_title, score_type, score_value) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, 1, "IISc/JNU/IIT", "Advanced research on " + job['title'], "CGPA", random.uniform(8.0, 9.9)))

        # Work Exp
        num_work = random.randint(1, 3)
        for w_idx in range(num_work):
            cur.execute("INSERT INTO work_experiences (candidate_id, entry_order, company_name, role, start_date, description) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c_id, w_idx+1, "Org " + str(random.randint(1,100)), "Specialist", date(2010,1,1), "Worked on strategic projects..."))

        # Publications
        num_pubs = random.randint(2, 10) if job['pos'] == 'Professor' else random.randint(0, 3)
        for p_idx in range(num_pubs):
            pub_type = random.choice(['Paper', 'Book', 'Chapter'])
            if pub_type == 'Paper':
                cur.execute("INSERT INTO papers (candidate_id, entry_order, title) VALUES (%s, %s, %s)", (c_id, p_idx+1, "Impact of " + str(random.randint(1,1000))))
            elif pub_type == 'Book':
                cur.execute("INSERT INTO books (candidate_id, entry_order, title) VALUES (%s, %s, %s)", (c_id, p_idx+1, "Research Work #" + str(random.randint(1,1000))))
            else:
                cur.execute("INSERT INTO chapters (candidate_id, entry_order, chapter_name, corresponding_book) VALUES (%s, %s, %s, %s)", (c_id, p_idx+1, "Chapter #" + str(random.randint(1,1000)), "Book of Knowledge"))

        print(f"  [OK] Added {full_name} for {job['title']}")

    cur.close()
    conn.close()
    print("\nInjection of 30 candidates complete.")

if __name__ == "__main__":
    inject_30_candidates()
