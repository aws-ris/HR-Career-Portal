import os

src_dir = r"c:\Users\Viraal\Desktop\HRForm\src"

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".jsx", ".js", ".html", ".css")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                if "Company Name" in content or "Position Held" in content:
                    print(f"Match in file: {path}")
                    # Print matching lines
                    lines = content.split("\n")
                    for idx, line in enumerate(lines):
                        if "Company Name" in line or "Position Held" in line:
                            print(f"  L{idx+1}: {line.strip()}")
            except Exception as e:
                pass
