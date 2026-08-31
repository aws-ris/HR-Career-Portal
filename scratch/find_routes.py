import re

with open(r"c:\Project Code\HR_RIS\backend\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "@app." in line or "def " in line and "job" in line.lower():
        print(f"Line {i}: {line.strip()}")
