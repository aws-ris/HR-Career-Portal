import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database import models

cols = [c.name for c in models.CandidateMetadata.__table__.columns]
print("CandidateMetadata columns:", cols)
print("worked_at_ris present:", "worked_at_ris" in cols)
