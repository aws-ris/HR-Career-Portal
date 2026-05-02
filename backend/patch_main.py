import sys

with open('main.py', 'r') as f:
    content = f.read()

# 1. Add endpoint for resume upload
upload_endpoint = """
from fastapi import UploadFile, File
@app.post("/api/v1/applications/{candidate_id}/resume")
async def upload_resume(candidate_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    from ai_service import process_and_save_resume
    try:
        content = await file.read()
        saved_path = process_and_save_resume(db, candidate_id, content, file.filename)
        return {"status": "success", "resume_path": saved_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CandidateFilter(BaseModel):
"""

content = content.replace("class CandidateFilter(BaseModel):", upload_endpoint, 1)

# 2. Add semantic query to schema
schema_target = """    publication_keyword: Optional[str] = None"""
schema_replacement = """    publication_keyword: Optional[str] = None
    semantic_query: Optional[str] = None
    ai_match_threshold: Optional[float] = 0.0"""
content = content.replace(schema_target, schema_replacement, 1)

# 3. Add AI Service logic to filter_job_candidates
filter_logic_target = """        # 2. Get the final list of matching IDs
        res_ids = id_query.all()
        matching_ids = [r[0] for r in res_ids]"""

filter_logic_replacement = """        # 2. Get the final list of matching IDs
        res_ids = id_query.all()
        matching_ids = [r[0] for r in res_ids]
        
        ai_score_map = {}
        if filters.semantic_query and matching_ids:
            from ai_service import semantic_search_candidates
            ai_results = semantic_search_candidates(db, clean_job_id, filters.semantic_query, filters.ai_match_threshold or 0.0)
            ai_score_map = {c.id: score for c, score in ai_results}
            matching_ids = [cid for cid in matching_ids if cid in ai_score_map]"""
content = content.replace(filter_logic_target, filter_logic_replacement, 1)

# 4. Return ai_match_score and total_experience_years
dict_target = """                "highest_education": c.highest_education,
                "current_status": c.current_status,"""
dict_replacement = """                "highest_education": c.highest_education,
                "current_status": c.current_status,
                "total_experience_years": c.total_experience_years,
                "ai_match_score": ai_score_map.get(c.id, None),"""
content = content.replace(dict_target, dict_replacement, 1)

# 5. Sort by ai_match_score
sort_target = """        result.sort(key=lambda x: x['full_name'])
        return result"""
sort_replacement = """        if filters.semantic_query:
            result.sort(key=lambda x: x['ai_match_score'] or 0, reverse=True)
        else:
            result.sort(key=lambda x: x['full_name'])
        return result"""
content = content.replace(sort_target, sort_replacement, 1)

with open('main.py', 'w') as f:
    f.write(content)
print("main.py successfully patched.")
