path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(789, min(805, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
