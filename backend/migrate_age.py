import sqlite3

def migrate():
    conn = sqlite3.connect('ris_app.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE candidate_metadata ADD COLUMN age INTEGER")
        print("Added age column")
    except Exception as e:
        print(f"Age column might already exist: {e}")
        
    try:
        cursor.execute("ALTER TABLE candidate_metadata ADD COLUMN current_city VARCHAR(100)")
        print("Added current_city column")
    except Exception as e:
        print(f"Current_city column might already exist: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
