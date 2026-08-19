path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def print_around_lines(pattern, context=5):
    for idx, line in enumerate(lines):
        if pattern in line:
            print(f"--- Line {idx + 1} ({line.strip()}) ---")
            start = max(0, idx - context)
            end = min(len(lines), idx + context + 1)
            for j in range(start, end):
                print(f"{j+1}: {lines[j]}", end="")

print_around_lines("handleBack")
print_around_lines("step - 1")
print_around_lines("step + 1")
print_around_lines("setStep")
