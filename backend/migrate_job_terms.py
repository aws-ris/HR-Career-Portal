import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "..", "ris_app.db")
    print(f"Connecting to database at {db_path}")
    
    conn = sqlite3.connect(db_path)
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
            cursor.execute(f"ALTER TABLE job_postings ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
