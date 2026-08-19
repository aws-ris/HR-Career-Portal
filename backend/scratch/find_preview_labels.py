path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Search for "Work Experience" or "Company" or "Position" in preview step
for idx in range(2200, len(lines)):
    line = lines[idx]
    line_num = idx + 1
    if any(k in line for k in ["Company", "Position Held", "Organization", "Designation", "Publications Section", "Work Experience Section", "Step 5"]):
        print(f"L{line_num}: {line.strip().encode('ascii', errors='replace').decode('ascii')}")
