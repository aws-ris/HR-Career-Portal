path = r"c:\Users\Viraal\Desktop\HRForm\src\components\hr\CandidateProfileModal.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "Company" in line or "Role" in line or "Position" in line or "Work" in line or "Experience" in line or "Designation" in line or "Organization" in line:
        print(f"L{idx+1}: {line.strip()}")
