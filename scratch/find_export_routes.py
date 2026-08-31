with open(r"c:\Project Code\HR_RIS\backend\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "export" in line.lower() or "csv" in line.lower() or "excel" in line.lower() or "openpyxl" in line.lower():
        print(f"Line {i}: {line.strip()[:100]}")
