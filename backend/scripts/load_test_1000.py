import asyncio
import time
import random
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

TARGET_URL = "http://13.205.216.81/api/v1/applications"
NUM_CONCURRENT_REQUESTS = 1000

names = [
    ("Ananya Sharma", "Female"), ("Rohan Verma", "Male"), ("Priya Nair", "Female"), ("Vikram Sengupta", "Male"), ("Sneha Kulkarni", "Female"),
    ("Aarav Mehta", "Male"), ("Meera Deshmukh", "Female"), ("Aditya Roy", "Male"), ("Kavya Reddy", "Female"), ("Tushar Saxena", "Male"),
    ("Divya Iyer", "Female"), ("Siddharth Rao", "Male"), ("Ishita Banerjee", "Female"), ("Karan Malhotra", "Male"), ("Nidhi Patel", "Female"),
    ("Varun Kapoor", "Male"), ("Pooja Joshi", "Female"), ("Abhinav Pandey", "Male"), ("Tanvi Agarwal", "Female"), ("Rahul Bhatia", "Male")
]

universities = [
    "Jawaharlal Nehru University (JNU)", "Delhi School of Economics (DSE)", "IIT Delhi",
    "University of Hyderabad", "Tata Institute of Social Sciences (TISS)", "St. Xavier's College, Mumbai",
    "Madras School of Economics", "Indian Institute of Foreign Trade (IIFT)", "Ashoka University"
]

companies = [
    "NITI Aayog", "NIPFP", "ICRIER", "Observer Research Foundation (ORF)", "CPR India",
    "RIS", "KPMG India", "Ernst & Young (EY)", "World Bank India", "ADB South Asia"
]

def fetch_active_jobs():
    """
    Fetches real open job postings directly from the backend API.
    """
    try:
        req = urllib.request.Request("http://13.205.216.81/api/v1/public/jobs")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                jobs = json.loads(response.read().decode('utf-8'))
                if isinstance(jobs, list) and len(jobs) > 0:
                    print(f"📋 Fetched {len(jobs)} active job postings from database for load test:")
                    for j in jobs:
                        print(f"  - '{j['title']}' | Position: {j.get('position', 'Research Assistant')} | ID: {j['id']}")
                    return jobs
    except Exception as e:
        print(f"⚠️ Could not fetch active jobs from backend ({e}), using default fallback job.")
        
    return [{
        "id": None,
        "title": "Consultant (International Trade & G20 Policy)",
        "position": "Consultant",
        "division": "RIS"
    }]

def send_single_application(args):
    request_id, selected_job = args
    name, gender = names[request_id % len(names)]
    email = f"loadtest.cand{request_id}.{random.randint(1000, 9999)}@policy-loadtest.org"
    uni1 = universities[request_id % len(universities)]
    uni2 = universities[(request_id + 1) % len(universities)]
    company = companies[request_id % len(companies)]
    
    position_val = selected_job.get("position") or "Research Assistant"
    job_id_val = selected_job.get("id")
    dept_val = selected_job.get("division")
    
    payload = {
        "job_id": job_id_val,
        "position_applied": position_val,
        "admin_department": dept_val if dept_val in ['IT', 'HR', 'Finance', 'Library', 'Other'] else None,
        "full_name": f"{name} (Load #{request_id})",
        "email": email,
        "country_code": "+91",
        "mobile_no": f"9876{random.randint(100000, 999999)}",
        "dob": f"{random.randint(1990, 1999)}-0{random.randint(1,9)}-{random.randint(10,28)}",
        "gender": gender,
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110001",
        "years_of_experience": round(random.uniform(2.0, 10.0), 1),
        "last_salary": round(random.uniform(6.0, 20.0), 1),
        "about": f"High-throughput candidate applicant specializing in {selected_job.get('title', 'Policy Research')}.",
        "sop": f"I am applying for {selected_job.get('title')} to contribute quantitative policy research expertise to RIS.",
        "how_heard": "RIS Career Portal",
        "schooling": {
            "class_x_school": "Delhi Public School",
            "class_x_board": "CBSE",
            "class_x_score_type": "Percentage",
            "class_x_score_value": round(random.uniform(82.0, 95.0), 1),
            "class_x_year": 2012,
            "class_xii_school": "Delhi Public School",
            "class_xii_board": "CBSE",
            "class_xii_score_type": "Percentage",
            "class_xii_score_value": round(random.uniform(80.0, 96.0), 1),
            "class_xii_year": 2014
        },
        "higher_education": [
            {
                "level": "undergrad",
                "degree_name": "B.A. (Hons) Economics",
                "university": uni1,
                "score_type": "Percentage",
                "score_value": round(random.uniform(75.0, 88.0), 1),
                "grad_year": 2017,
                "entry_order": 1
            },
            {
                "level": "postgrad",
                "degree_name": "M.A. Economics / Public Policy",
                "university": uni2,
                "score_type": "CGPA (Out of 10)",
                "score_value": round(random.uniform(7.8, 9.4), 2),
                "grad_year": 2019,
                "entry_order": 2
            }
        ],
        "work_experience": [
            {
                "company_name": company,
                "role": "Research Fellow",
                "start_date": "2019-06-01",
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
        with urllib.request.urlopen(req, timeout=120) as response:
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

    active_jobs = fetch_active_jobs()
    tasks_args = [(i + 1, active_jobs[i % len(active_jobs)]) for i in range(NUM_CONCURRENT_REQUESTS)]

    start_wall = time.time()

    success_count = 0
    failed_count = 0
    latencies = []
    status_codes = {}
    errors = {}

    with ThreadPoolExecutor(max_workers=30) as executor:
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
    import sys
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        NUM_CONCURRENT_REQUESTS = int(sys.argv[1])
    run_1000_load_test()
