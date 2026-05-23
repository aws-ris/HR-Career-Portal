import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def migrate():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return

    print("Connecting to Vercel Database...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    columns_to_add = [
        ("min_pay", "INTEGER"),
        ("max_pay", "INTEGER"),
        ("min_experience", "INTEGER"),
        ("max_experience", "INTEGER"),
        ("contract_period", "INTEGER"),
        ("job_mode", "VARCHAR(50)")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
            print(f"Added column {col_name} (if it didn't exist)")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")
                
    conn.close()
    print("Vercel Migration complete!")

if __name__ == "__main__":
    migrate()
