import sys
import os

# Get the absolute path to the backend directory
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if path not in sys.path:
    sys.path.append(path)

try:
    from main import app
except ImportError as e:
    print(f"Import Error: {e}")
    print(f"Path: {sys.path}")
    raise e
