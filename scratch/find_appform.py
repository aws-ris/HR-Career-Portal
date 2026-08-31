with open(r"c:\Project Code\HR_RIS\src\pages\ApplicationForm.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "export default function" in line or "useParams" in line or "jobId" in line:
        print(f"Line {i}: {line.strip()}")
