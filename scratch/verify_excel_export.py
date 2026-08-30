import sys
import os
import openpyxl
sys.path.append(os.path.abspath("backend"))

from database.database import SessionLocal
from database import models
from main import export_job_candidates, ExportRequest, CandidateFilter

db = SessionLocal()
jobs = db.query(models.JobPosting).all()
if not jobs:
    print("No jobs found in DB to test export.")
    sys.exit(0)

target_job_id = jobs[0].id
print(f"Testing Excel export for job_id: {target_job_id} ({jobs[0].title})...")

req = ExportRequest(
    filters=CandidateFilter(),
    format='xlsx',
    columns=[],
    report_type='detailed'
)

response = export_job_candidates(target_job_id, req, db)

with open("scratch/test_export_output.xlsx", "wb") as f:
    if hasattr(response, 'body'):
        f.write(response.body)
    else:
        for chunk in response.body_iterator:
            f.write(chunk)

wb = openpyxl.load_workbook("scratch/test_export_output.xlsx")
sheet = wb.active

headers = [cell.value for cell in sheet[1]]
print(f"\nTotal Excel Columns Exported: {len(headers)}")
print("Headers List:")
for idx, h in enumerate(headers, 1):
    print(f" {idx}. {h}")

print(f"\nTotal Candidate Data Rows Exported: {sheet.max_row - 1}")
