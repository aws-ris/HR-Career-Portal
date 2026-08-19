path = r"c:\Users\Viraal\Desktop\HRForm\src\pages\ApplicationForm.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def print_function(name):
    found = False
    brace_count = 0
    for idx, line in enumerate(lines):
        if f"const {name} =" in line or f"function {name}" in line:
            found = True
            print(f"--- Function {name} starting at line {idx+1} ---")
        if found:
            print(line, end="")
            brace_count += line.count("{") - line.count("}")
            if brace_count == 0 and idx > 0 and ("}" in line or "const" in line):
                break

print_function("handleToggleEditPublications")
print_function("handleToggleEditWork")
