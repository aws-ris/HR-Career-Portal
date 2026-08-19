path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(2275, 2435):
    line = lines[idx]
    line_num = idx + 1
    # Print lines that define headers or layout groups
    if "resume-section" in line or "h3" in line or "h4" in line or "Section" in line:
        print(f"L{line_num}: {line.strip().encode('ascii', errors='replace').decode('ascii')}")
