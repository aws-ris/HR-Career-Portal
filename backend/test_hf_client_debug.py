
import os
import logging
import requests
import http.client as http_client
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

http_client.HTTPConnection.debuglevel = 1
logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True

token = os.getenv("HF_TOKEN")
print(f"Token present: {bool(token)}")
client = InferenceClient(api_key=token)

try:
    print("Sending request via InferenceClient...")
    res = client.feature_extraction("test", model="sentence-transformers/all-MiniLM-L6-v2")
    print(f"Success! Type: {type(res)}")
except Exception as e:
    print(f"Failed: {e}")
