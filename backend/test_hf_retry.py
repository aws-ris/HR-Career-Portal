
import os
import time
from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("HF_TOKEN")
client = InferenceClient(api_key=token)

max_retries = 3
for attempt in range(max_retries):
    try:
        print(f"Attempt {attempt + 1}")
        res = client.feature_extraction("test", model="sentence-transformers/all-MiniLM-L6-v2")
        print(f"Success! Shape: {res.shape if hasattr(res, 'shape') else len(res)}")
        break
    except HfHubHTTPError as e:
        if e.response.status_code == 503:
            try:
                data = e.response.json()
                wait_time = data.get("estimated_time", 15.0)
            except:
                wait_time = 15.0
            print(f"Model loading (503). Waiting {wait_time}s...")
            time.sleep(min(wait_time, 10))
        else:
            print(f"HTTP Error: {e}")
            break
    except Exception as e:
        print(f"Other Error: {e}")
        break
