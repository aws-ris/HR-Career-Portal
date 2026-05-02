import psycopg2
import csv

def run():
    # Connect to PostgreSQL
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ris_db")
    cur = conn.cursor()

    # 1. Delete the specific applicant (Cascades automatically)
    target_id = 'b2154d7a-199e-441c-b38e-8215a10ad2a5'
    cur.execute("DELETE FROM applicants WHERE id = %s;", (target_id,))
    conn.commit()
    print(f"Deleted applicant: {target_id}")

    # 2. Fetch all remaining applicants
    cur.execute("SELECT * FROM applicants;")
    applicant_cols = [desc[0] for desc in cur.description]
    applicants = cur.fetchall()

    flat_data = []
    
    for app in applicants:
        app_dict = dict(zip(applicant_cols, app))
        app_id = app_dict['id']
        
        # Aggregate Education
        cur.execute("SELECT level, university, degree_name, score_value, score_type FROM higher_education WHERE applicant_id = %s ORDER BY entry_order;", (app_id,))
        edus = cur.fetchall()
        edu_str = " || ".join([f"{e[0]} in {e[2]} at {e[1]} ({e[4]}: {e[3]})" for e in edus])
        app_dict['Education_Details'] = edu_str
        
        # Aggregate Publications
        cur.execute("SELECT type, title FROM publications WHERE applicant_id = %s ORDER BY entry_order;", (app_id,))
        pubs = cur.fetchall()
        pub_str = " || ".join([f"[{p[0]}] {p[1]}" for p in pubs])
        app_dict['Publication_Details'] = pub_str
        
        # Aggregate Work Experiences
        cur.execute("SELECT role, company_name, start_date, end_date FROM work_experiences WHERE applicant_id = %s ORDER BY entry_order;", (app_id,))
        works = cur.fetchall()
        work_str = " || ".join([f"{w[0]} at {w[1]} ({w[2]} to {w[3] if w[3] else 'Present'})" for w in works])
        app_dict['Work_Experience_Details'] = work_str
        
        flat_data.append(app_dict)

    # 3. Write flat data to CSV
    filename = 'full_applications_view.csv'
    if flat_data:
        headers = list(flat_data[0].keys())
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(flat_data)
        print(f"Exported {len(flat_data)} flattened records to {filename}")
    else:
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            f.write("No applicants currently stored in the database.")
        print("Database is empty. Wrote empty placeholder.")

    cur.close()
    conn.close()

if __name__ == '__main__':
    run()
