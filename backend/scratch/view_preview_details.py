path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("--- Publications Section (L2290 - L2400) ---")
for idx in range(2289, 2400):
    text = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx+1}: {text}")

print("\n--- Work Experience Section (L2401 - L2515) ---")
for idx in range(2400, min(2515, len(lines))):
    text = lines[idx].strip().encode('ascii', errors='replace').decode('ascii')
    print(f"{idx+1}: {text}")
