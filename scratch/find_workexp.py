with open(r"c:\Project Code\HR_RIS\src\pages\ApplicationForm.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "work" in line.lower() and ("date" in line.lower() or "exp" in line.lower() or "validation" in line.lower() or "required" in line.lower()):
        if i > 700 and i < 1600 or i > 1200 and i < 2000 or i > 3000:
            print(f"Line {i}: {line.strip()[:100]}")
