import sys
import os

# Add the backend directory to the path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.append(backend_path)

# Import the FastAPI app from backend/main.py
from main import app

# Explicitly expose it for Vercel
application = app
