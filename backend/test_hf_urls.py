
import requests
import os

token = os.getenv("HF_TOKEN")
headers = {"Authorization": f"Bearer {token}"}

# Test 1: pipeline format (the one that got 404)
url1 = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
res1 = requests.post(url1, headers=headers, json={"inputs": "test 1"})
print(f"URL 1 Status: {res1.status_code}")
if res1.status_code != 200:
    print(res1.text)

# Test 2: standard models format
url2 = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
res2 = requests.post(url2, headers=headers, json={"inputs": "test 2"})
print(f"URL 2 Status: {res2.status_code}")
if res2.status_code == 200:
    print(f"URL 2 output type: {type(res2.json())}")
    if isinstance(res2.json(), list):
        print(f"URL 2 output length: {len(res2.json()[0]) if isinstance(res2.json()[0], list) else len(res2.json())}")
else:
    print(res2.text)
