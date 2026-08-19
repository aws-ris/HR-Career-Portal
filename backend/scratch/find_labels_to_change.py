path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    line_num = idx + 1
    if "Company Name" in line or "Position Held" in line:
        print(f"L{line_num}: {line.strip()}")
