with open(r"c:\Project Code\HR_RIS\backend\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "def create_application" in line or "CandidateMetadata(" in line:
        print(f"Line {i}: {line.strip()}")
