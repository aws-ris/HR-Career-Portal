import psycopg2
import uuid
from datetime import datetime, date

def inject_jobs():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
    conn.autocommit = True
    cur = conn.cursor()

    jobs = [
        {
            "title": "Professor - International Trade & Finance",
            "position": "Professor",
            "division": "RIS",
            "description": "Leading research initiatives in global trade patterns and financial architecture.",
            "requirements": "PhD in Economics, 15+ years of research experience, high-impact publications.",
            "deadline": date(2026, 4, 27), # Closing Soon!
            "status": "open",
            "total_openings": 1
        },
        {
            "title": "Associate Professor - Macroeconomics",
            "position": "Associate Professor",
            "division": "CMEC",
            "description": "Focusing on monetary policy and fiscal stability in emerging economies.",
            "requirements": "PhD with specialization in Macroeconomics, 8+ years experience.",
            "deadline": date(2026, 4, 28), # Closing Soon!
            "status": "open",
            "total_openings": 1
        },
        {
            "title": "Research Assistant - Digital Innovation",
            "position": "Research Assistant",
            "division": "AIC",
            "description": "Assisting in data collection and analysis for the Artificial Intelligence Center.",
            "requirements": "Masters in CS or Data Science, proficiency in Python and SQL.",
            "deadline": date(2026, 5, 15),
            "status": "open",
            "total_openings": 3
        },
        {
            "title": "Consultant - Traditional Knowledge Systems",
            "position": "Consultant",
            "division": "FITM",
            "description": "Advising on the integration of traditional medicine into modern healthcare frameworks.",
            "requirements": "Extensive experience in AYUSH or related policy research.",
            "deadline": date(2026, 5, 10),
            "status": "draft", # Saved as Draft
            "total_openings": 1
        },
        {
            "title": "Assistant Professor - South Asian Studies",
            "position": "Assistant Professor",
            "division": "DAKSHIN",
            "description": "Conducting comparative studies on regional cooperation in South Asia.",
            "requirements": "PhD in International Relations or Political Science.",
            "deadline": date(2026, 5, 20),
            "status": "draft", # Saved as Draft
            "total_openings": 1
        }
    ]

    print("Injecting 5 new job postings into ris_db...")
    
    for j in jobs:
        job_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO job_postings 
            (id, title, position, division, description, requirements, deadline, status, total_openings, created_at, updated_at, is_deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            job_id, j['title'], j['position'], j['division'], j['description'], 
            j['requirements'], j['deadline'], j['status'], j['total_openings'],
            datetime.utcnow(), datetime.utcnow(), False
        ))
        print(f"  [OK] Inserted: {j['title']} ({j['status']})")

    cur.close()
    conn.close()
    print("\nInjection complete. Refresh your HR Portal to see the updated KPIs and table.")

if __name__ == "__main__":
    inject_jobs()
