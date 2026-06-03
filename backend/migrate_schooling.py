import os
import sys
from sqlalchemy import text, inspect

# Add backend to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine, SessionLocal

def run_migration():
    print("--- STARTING SCHOOLING SCHEMA MIGRATION ---")
    db_url = str(engine.url)
    is_sqlite = db_url.startswith("sqlite")
    
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('candidate_schooling')]
        
        # Check if the migration was already run
        if 'class_x_school' in columns:
            print("Migration already run. 'class_x_school' column already exists in 'candidate_schooling'.")
            return True
            
        print(f"Database type: {'SQLite' if is_sqlite else 'PostgreSQL'}")
        
        if is_sqlite:
            # SQLite does not support dropping columns easily or multiple ALTERS in older versions
            # We will use the standard table reconstruction method (safe for SQLite)
            print("Running SQLite migration...")
            db.execute(text("PRAGMA foreign_keys=OFF;"))
            
            # 1. Rename old table
            db.execute(text("ALTER TABLE candidate_schooling RENAME TO old_candidate_schooling;"))
            
            # 2. Create new table
            db.execute(text("""
                CREATE TABLE candidate_schooling (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    candidate_id VARCHAR(36) NOT NULL REFERENCES candidate_metadata(id) ON DELETE CASCADE,
                    class_x_school VARCHAR(250) NOT NULL DEFAULT '',
                    class_x_board VARCHAR(100) NOT NULL DEFAULT 'Other',
                    class_x_score_type VARCHAR(20) NOT NULL DEFAULT 'Percentage',
                    class_x_score_value FLOAT NOT NULL DEFAULT 0.0,
                    class_xii_school VARCHAR(250) NOT NULL DEFAULT '',
                    class_xii_board VARCHAR(100) NOT NULL DEFAULT 'Other',
                    class_xii_score_type VARCHAR(20) NOT NULL DEFAULT 'Percentage',
                    class_xii_score_value FLOAT NOT NULL DEFAULT 0.0
                );
            """))
            
            # 3. Copy and map data
            db.execute(text("""
                INSERT INTO candidate_schooling (
                    id, candidate_id, class_x_school, class_x_board, class_x_score_type, class_x_score_value,
                    class_xii_school, class_xii_board, class_xii_score_type, class_xii_score_value
                )
                SELECT 
                    id, candidate_id, '', 'Other', 'Percentage', class_x_percentage,
                    '', 'Other', 'Percentage', class_xii_percentage
                FROM old_candidate_schooling;
            """))
            
            # 4. Drop old table
            db.execute(text("DROP TABLE old_candidate_schooling;"))
            db.execute(text("PRAGMA foreign_keys=ON;"))
            db.commit()
            print("SQLite migration completed successfully!")
            
        else:
            # PostgreSQL migration using direct ALTER commands
            print("Running PostgreSQL migration...")
            
            # Start transaction
            with db.begin():
                # 1. Add new columns with NOT NULL and default values
                db.execute(text("""
                    ALTER TABLE candidate_schooling 
                    ADD COLUMN class_x_school VARCHAR(250) NOT NULL DEFAULT '',
                    ADD COLUMN class_x_board VARCHAR(100) NOT NULL DEFAULT 'Other',
                    ADD COLUMN class_x_score_type VARCHAR(20) NOT NULL DEFAULT 'Percentage',
                    ADD COLUMN class_x_score_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                    ADD COLUMN class_xii_school VARCHAR(250) NOT NULL DEFAULT '',
                    ADD COLUMN class_xii_board VARCHAR(100) NOT NULL DEFAULT 'Other',
                    ADD COLUMN class_xii_score_type VARCHAR(20) NOT NULL DEFAULT 'Percentage',
                    ADD COLUMN class_xii_score_value DOUBLE PRECISION NOT NULL DEFAULT 0.0;
                """))
                
                # 2. Backfill existing percentages into the new score_value columns
                db.execute(text("""
                    UPDATE candidate_schooling 
                    SET 
                        class_x_score_value = class_x_percentage,
                        class_xii_score_value = class_xii_percentage;
                """))
                
                # 3. Drop old columns
                db.execute(text("""
                    ALTER TABLE candidate_schooling 
                    DROP COLUMN class_x_percentage,
                    DROP COLUMN class_xii_percentage;
                """))
                
            print("PostgreSQL migration completed successfully!")
            
        return True
    except Exception as e:
        db.rollback()
        print(f"MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
