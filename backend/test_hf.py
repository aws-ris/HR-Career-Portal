
import os
from huggingface_hub import InferenceClient

def test():
    token = os.getenv("HF_TOKEN")
    if not token:
        print("FAIL: HF_TOKEN environment variable is missing.")
        return

    print(f"Testing HF Token: {token[:4]}...")
    client = InferenceClient(api_key=token)
    
    try:
        print("Sending test request to Hugging Face...")
        # Test feature extraction
        emb = client.feature_extraction(
            "This is a test query to verify the AI matching subsystem.",
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        if emb is not None:
            print(f"SUCCESS: AI Model responded. Embedding length: {len(emb)}")
        else:
            print("FAIL: AI Model returned None.")
    except Exception as e:
        print(f"FAIL: AI API Error: {e}")

if __name__ == "__main__":
    test()
