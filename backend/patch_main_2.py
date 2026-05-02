import sys

with open('main.py', 'r') as f:
    content = f.read()

# Fix get_full_profile
target1 = """        "ai_summary": candidate.ai_summary,
        "ai_match_score": candidate.ai_match_score,"""
replace1 = """        "total_experience_years": getattr(candidate, 'total_experience_years', None),
        "resume_path": getattr(candidate, 'resume_path', None),"""
content = content.replace(target1, replace1)

# Add resume download endpoint
target2 = """@app.post("/api/v1/applications/{candidate_id}/resume")"""
replace2 = """from fastapi.responses import FileResponse
import os

@app.get("/api/v1/applications/{candidate_id}/resume/download")
def download_resume(candidate_id: str, db: Session = Depends(get_db)):
    from database.models import CandidateMetadata
    candidate = db.query(CandidateMetadata).filter(CandidateMetadata.id == candidate_id).first()
    if not candidate or not candidate.resume_path or not os.path.exists(candidate.resume_path):
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # We can determine if it's a preview or download based on query params if needed, 
    # but returning FileResponse directly works for both. Browsers will preview PDFs by default if content-disposition is inline (default for FileResponse without headers).
    return FileResponse(path=candidate.resume_path, filename=os.path.basename(candidate.resume_path), media_type='application/pdf')

@app.post("/api/v1/applications/{candidate_id}/resume")"""
content = content.replace(target2, replace2)

with open('main.py', 'w') as f:
    f.write(content)
print("main.py patched successfully!")
