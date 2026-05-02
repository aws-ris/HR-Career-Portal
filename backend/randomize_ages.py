
import random
from database.database import SessionLocal
from database import models

db = SessionLocal()
try:
    candidates = db.query(models.CandidateMetadata).all()
    for c in candidates:
        # Random age between 24 and 58
        new_age = random.randint(24, 58)
        c.age = new_age
        print(f"Randomized {c.full_name}: {new_age}")
    db.commit()
    print("Done randomizing ages.")
finally:
    db.close()
