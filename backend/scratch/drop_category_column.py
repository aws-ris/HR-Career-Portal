import os
import sys

# Add the backend directory to path so we can import database
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database.database import engine
from sqlalchemy import text

def drop_category_column():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE candidate_metadata DROP COLUMN IF EXISTS category;"))
            conn.commit()
            print("Successfully dropped 'category' column from candidate_metadata table.")
    except Exception as e:
        print(f"Error: {e}")
        print("Note: If the database is not running, please run this script later.")

if __name__ == "__main__":
    drop_category_column()
