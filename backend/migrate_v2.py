import os
import sqlite3
import psycopg2
from dotenv import load_dotenv

# Load env variables from local .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def migrate_postgres(db_url):
    print("Connecting to Postgres database...")
    # Fix for connection URL format
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add pincode to candidate_metadata
    try:
        cursor.execute("ALTER TABLE candidate_metadata ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);")
        print("Postgres: Added column 'pincode' to 'candidate_metadata'")
    except Exception as e:
        print(f"Postgres Error adding pincode: {e}")
        
    # 2. Add extracurriculars to candidate_links_about
    try:
        cursor.execute("ALTER TABLE candidate_links_about ADD COLUMN IF NOT EXISTS extracurriculars TEXT;")
        print("Postgres: Added column 'extracurriculars' to 'candidate_links_about'")
    except Exception as e:
        print(f"Postgres Error adding extracurriculars: {e}")
        
    conn.close()

def migrate_sqlite(db_path):
    print(f"Connecting to SQLite database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Add pincode to candidate_metadata
    try:
        cursor.execute("ALTER TABLE candidate_metadata ADD COLUMN pincode VARCHAR(20);")
        print("SQLite: Added column 'pincode' to 'candidate_metadata'")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("SQLite: Column 'pincode' already exists in 'candidate_metadata'.")
        else:
            print(f"SQLite Error adding pincode: {e}")
            
    # 2. Add extracurriculars to candidate_links_about
    try:
        cursor.execute("ALTER TABLE candidate_links_about ADD COLUMN extracurriculars TEXT;")
        print("SQLite: Added column 'extracurriculars' to 'candidate_links_about'")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("SQLite: Column 'extracurriculars' already exists in 'candidate_links_about'.")
        else:
            print(f"SQLite Error adding extracurriculars: {e}")
            
    conn.commit()
    conn.close()

def main():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        if db_url.startswith("sqlite"):
            path = db_url.replace("sqlite:///", "")
            migrate_sqlite(path)
        else:
            migrate_postgres(db_url)
    
    # Also migrate local sqlite ris_app.db if it exists in backend/ directory
    local_sqlite = os.path.join(os.path.dirname(__file__), "ris_app.db")
    if os.path.exists(local_sqlite):
        migrate_sqlite(local_sqlite)

if __name__ == "__main__":
    main()
