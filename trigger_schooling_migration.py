import requests
import json
import sys

url = "https://hr-portal-ris.vercel.app/api/v1/debug/migrate-schooling"

print(f"Triggering schooling schema migration on Vercel: {url}")
try:
    response = requests.post(url, headers={"Content-Type": "application/json"})
    print(f"HTTP Status Code: {response.status_code}")
    print("Response headers:", dict(response.headers))
    try:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2))
        if data.get("status") == "success":
            print("\nSchooling database migration successfully executed on Vercel!")
        else:
            print("\nError from API endpoint:", data.get("message"))
    except Exception:
        print("Response Text (could not parse as JSON):")
        print(response.text[:2000])
except Exception as e:
    print(f"Network error: {e}")
    sys.exit(1)
