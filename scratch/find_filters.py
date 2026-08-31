with open(r"c:\Project Code\HR_RIS\backend\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "def filter_job_candidates" in line or "score_value" in line or "min_gpa" in line or "min_cgpa" in line or "score_type" in line:
        print(f"Line {i}: {line.strip()[:100]}")
