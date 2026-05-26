import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def migrate():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env. Please make sure it is configured.")
        return

    print("Connecting to Vercel Postgres Database...")
    # Fix postgres prefix for SQLAlchemy/Psycopg2 compatibility
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # 1. candidate_metadata
        try:
            cursor.execute("ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);")
            print("Vercel Postgres: Added column 'pincode' to 'candidate_metadata'")
        except Exception as e:
            print(f"Vercel Postgres Error adding pincode: {e}")
            
        # 2. candidate_links_about
        try:
            cursor.execute("ALTER TABLE candidate_links_about ADD COLUMN IF NOT EXISTS extracurriculars TEXT;")
            print("Vercel Postgres: Added column 'extracurriculars' to 'candidate_links_about'")
        except Exception as e:
            print(f"Vercel Postgres Error adding extracurriculars: {e}")
            
        # 3. age column
        try:
            cursor.execute("ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS age INTEGER;")
            print("Vercel Postgres: Added column 'age' to 'candidate_metadata'")
        except Exception as e:
            print(f"Vercel Postgres Error adding age: {e}")
            
        conn.close()
        print("Vercel Postgres Migration Complete!")
    except Exception as e:
        print(f"Failed to connect or migrate Vercel DB: {e}")

if __name__ == "__main__":
    migrate()
