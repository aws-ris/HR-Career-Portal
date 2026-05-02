from datetime import date
from database.database import SessionLocal
from database import models
import os

def calculate_age(born):
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

def update_ages():
    db = SessionLocal()
    candidates = db.query(models.CandidateMetadata).all()
    print(f"Found {len(candidates)} candidates")
    
    for c in candidates:
        if c.dob:
            new_age = calculate_age(c.dob)
            c.age = new_age
            print(f"Updated {c.full_name}: Age {new_age}")
            
    db.commit()
    db.close()
    print("Done")

if __name__ == "__main__":
    update_ages()
