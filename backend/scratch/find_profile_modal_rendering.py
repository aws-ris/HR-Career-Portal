path = r"c:\Users\Viraal\Desktop\HRForm\src\components\hr\CandidateProfileModal.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(369, min(440, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
