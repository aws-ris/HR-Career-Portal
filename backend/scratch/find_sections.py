import re

path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Search for step rendering or key headers
for idx, line in enumerate(lines):
    line_num = idx + 1
    # Check for step condition
    if "step ===" in line:
        print(f"L{line_num}: {line.strip()}")
    # Check for headers
    if "Publications" in line or "Work Experience" in line or "Company Name" in line or "Position Held" in line or "Designation" in line or "Organization" in line:
        print(f"L{line_num}: {line.strip()}")
