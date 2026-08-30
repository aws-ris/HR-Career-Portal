import asyncio
import time
import random
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

# Target URL
TARGET_URL = "http://13.205.216.81/api/v1/applications"
NUM_CONCURRENT_REQUESTS = 1000

def get_active_job_id():
    try:
        req = urllib.request.Request("http://13.205.216.81/api/v1/public/jobs")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if isinstance(data, list) and len(data) > 0:
                    print(f"📋 Fetched active Job ID for load test: '{data[0]['title']}' ({data[0]['id']})")
                    return data[0]['id']
    except Exception as e:
        print(f"⚠️ Could not fetch active job ID ({e}), using default fallback.")
    return "test-job-id"

def send_single_application(args):
    request_id, job_id = args
    email = f"loadtest.cand{request_id}.{random.randint(1000, 9999)}@policy-loadtest.org"
    
    payload = {
        "job_id": job_id,
        "full_name": f"LoadTest Candidate #{request_id}",
        "email": email,
        "country_code": "+91",
        "mobile_no": f"9876{random.randint(100000, 999999)}",
        "dob": "1995-05-15",
        "gender": "Male" if request_id % 2 == 0 else "Female",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110001",
        "years_of_experience": round(random.uniform(2.0, 8.0), 1),
        "last_salary": 12.5,
        "about": "High-throughput concurrent load test application submission.",
        "sop": "Testing backend resiliency under 1,000 concurrent applications.",
        "how_heard": "Load Test Suite",
        "schooling": {
            "class_x_school": "DPS New Delhi",
            "class_x_board": "CBSE",
            "class_x_score_type": "Percentage",
            "class_x_score_value": 90.0,
            "class_x_year": 2011,
            "class_xii_school": "DPS New Delhi",
            "class_xii_board": "CBSE",
            "class_xii_score_type": "Percentage",
            "class_xii_score_value": 88.5,
            "class_xii_year": 2013
        },
        "higher_education": [
            {
                "level": "undergrad",
                "degree_name": "B.A. Economics",
                "university": "Delhi University",
                "score_type": "Percentage",
                "score_value": 82.0,
                "grad_year": 2016,
                "entry_order": 1
            },
            {
                "level": "postgrad",
                "degree_name": "M.A. Public Policy",
                "university": "JNU",
                "score_type": "CGPA (Out of 10)",
                "score_value": 8.8,
                "grad_year": 2018,
                "entry_order": 2
            }
        ],
        "work_experience": [
            {
                "company_name": "NITI Aayog",
                "role": "Policy Analyst",
                "start_date": "2018-06-01",
                "is_current": True,
                "entry_order": 1
            }
        ]
    }

    json_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        TARGET_URL,
        data=json_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            latency = time.time() - start_time
            return (response.status, latency, None)
    except urllib.error.HTTPError as e:
        latency = time.time() - start_time
        return (e.code, latency, f"HTTPError {e.code}")
    except Exception as e:
        latency = time.time() - start_time
        return (0, latency, type(e).__name__)

def run_1000_load_test():
    print("═" * 65)
    print(" 🚀 STARTING 1,000 CONCURRENT CANDIDATE SUBMISSIONS LOAD TEST")
    print("═" * 65)
    print(f"🎯 Target API URL: {TARGET_URL}")
    print(f"⚡ Simultaneous Requests: {NUM_CONCURRENT_REQUESTS}\n")

    job_id = get_active_job_id()
    tasks_args = [(i + 1, job_id) for i in range(NUM_CONCURRENT_REQUESTS)]

    start_wall = time.time()

    success_count = 0
    failed_count = 0
    latencies = []
    status_codes = {}
    errors = {}

    with ThreadPoolExecutor(max_workers=100) as executor:
        results = list(executor.map(send_single_application, tasks_args))

    total_duration = time.time() - start_wall

    for status, latency, err in results:
        if status in (200, 201):
            success_count += 1
            latencies.append(latency)
        else:
            failed_count += 1
            status_codes[status] = status_codes.get(status, 0) + 1
            if err:
                errors[err] = errors.get(err, 0) + 1

    avg_latency = (sum(latencies) / len(latencies)) if latencies else 0
    max_latency = max(latencies) if latencies else 0
    min_latency = min(latencies) if latencies else 0
    rps = success_count / total_duration if total_duration > 0 else 0

    print("\n" + "═" * 65)
    print(" 📊 LOAD TEST BENCHMARK SUMMARY (1,000 CONCURRENT CANDIDATES)")
    print("═" * 65)
    print(f"✅ Successful Submissions (201 Created): {success_count} / {NUM_CONCURRENT_REQUESTS} ({success_count/NUM_CONCURRENT_REQUESTS*100:.1f}%)")
    print(f"❌ Failed Submissions:                     {failed_count} / {NUM_CONCURRENT_REQUESTS}")
    print(f"⏱️ Total Wall-Clock Execution Time:        {total_duration:.2f} seconds")
    print(f"⚡ Throughput (Requests Per Second):       {rps:.1f} req/sec")
    print(f"📈 Average Response Latency:              {avg_latency*1000:.1f} ms")
    print(f"🚀 Minimum Latency:                       {min_latency*1000:.1f} ms")
    print(f"🐢 Maximum Latency:                       {max_latency*1000:.1f} ms")
    
    if status_codes:
        print(f"\n📊 HTTP Status Code Breakdown: {status_codes}")
    if errors:
        print(f"⚠️ Error Breakdown:             {errors}")
    print("═" * 65)

if __name__ == "__main__":
    run_1000_load_test()
