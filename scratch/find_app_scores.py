with open(r"c:\Project Code\HR_RIS\src\pages\ApplicationForm.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "score_type" in line.lower() or "cgpa" in line.lower():
        print(f"Line {i}: {line.strip()[:100]}")
