import sys
import os
# Add backend to path to import ai_service
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import ai_service
from dotenv import load_dotenv

# Load the env we just updated
load_dotenv('backend/.env')
ai_service.HF_TOKEN = os.getenv("HF_TOKEN")

print(f"Testing with Token: {ai_service.HF_TOKEN[:10]}...")

test_text = "Software Engineer with experience in Python and FastAPI"
try:
    embedding = ai_service.compute_embedding(test_text)
    if embedding and isinstance(embedding, list) and len(embedding) > 0:
        print(f"SUCCESS! Received embedding of length {len(embedding)}")
        print(f"First 5 values: {embedding[:5]}")
    else:
        print(f"FAILED! Result was: {embedding}")
except Exception as e:
    print(f"CRITICAL ERROR during test: {e}")
