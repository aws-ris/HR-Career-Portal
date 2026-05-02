@app.post("/api/v1/jobs/{job_id}/candidates/filter")
def filter_job_candidates(job_id: str, filters: CandidateFilter, db: Session = Depends(get_db)):
    clean_job_id = str(job_id).strip()
    
    # 1. Base query for IDs
    id_query = db.query(models.CandidateMetadata.id).filter(
        models.CandidateMetadata.job_id == clean_job_id,
        models.CandidateMetadata.is_deleted == False
    )

    # Apply filters to the ID query
    if filters.states and len(filters.states) > 0:
        id_query = id_query.filter(or_(*[models.CandidateMetadata.state.ilike(f"%{s}%") for s in filters.states]))
    
    if filters.genders and len(filters.genders) > 0:
        id_query = id_query.filter(models.CandidateMetadata.gender.in_(filters.genders))

    if filters.ug_uni:
        grad_ids = db.query(models.Graduation.candidate_id).filter(models.Graduation.university.ilike(f"%{filters.ug_uni}%")).subquery()
        id_query = id_query.filter(models.CandidateMetadata.id.in_(grad_ids))
    
    if filters.min_ug_score is not None:
        grad_ids = db.query(models.Graduation.candidate_id).filter(models.Graduation.score_value >= float(filters.min_ug_score)).subquery()
        id_query = id_query.filter(models.CandidateMetadata.id.in_(grad_ids))

    if filters.pg_uni:
        pg_ids = db.query(models.Postgraduate.candidate_id).filter(models.Postgraduate.university.ilike(f"%{filters.pg_uni}%")).subquery()
        id_query = id_query.filter(models.CandidateMetadata.id.in_(pg_ids))

    if filters.phd_uni:
        phd_ids = db.query(models.Doctorate.candidate_id).filter(models.Doctorate.university.ilike(f"%{filters.phd_uni}%")).subquery()
        id_query = id_query.filter(models.CandidateMetadata.id.in_(phd_ids))

    if filters.phd_thesis:
        phd_ids = db.query(models.Doctorate.candidate_id).filter(models.Doctorate.thesis_title.ilike(f"%{filters.phd_thesis}%")).subquery()
        id_query = id_query.filter(models.CandidateMetadata.id.in_(phd_ids))

    if filters.min_experience_years and float(filters.min_experience_years) > 0:
        exp_sub = db.query(
            models.WorkExperience.candidate_id,
            func.sum(func.coalesce(models.WorkExperience.end_date, func.current_date()) - models.WorkExperience.start_date).label('total_days')
        ).group_by(models.WorkExperience.candidate_id).subquery()
        id_query = id_query.join(exp_sub, models.CandidateMetadata.id == exp_sub.c.candidate_id).filter(exp_sub.c.total_days >= float(filters.min_experience_years) * 365)

    if filters.min_papers and filters.min_papers > 0:
        p_ids = db.query(models.Paper.candidate_id).group_by(models.Paper.candidate_id).having(func.count(models.Paper.id) >= filters.min_papers).subquery()
        id_query = id_query.filter(models.CandidateMetadata.id.in_(p_ids))

    # 2. Get the final list of matching IDs
    matching_ids = [r[0] for r in id_query.all()]
    
    # 3. Fetch full objects with joinedload only for those IDs
    candidates = db.query(models.CandidateMetadata).filter(
        models.CandidateMetadata.id.in_(matching_ids)
    ).options(
        joinedload(models.CandidateMetadata.graduation),
        joinedload(models.CandidateMetadata.postgraduate),
        joinedload(models.CandidateMetadata.doctorate),
        joinedload(models.CandidateMetadata.work_experiences),
        joinedload(models.CandidateMetadata.books),
        joinedload(models.CandidateMetadata.papers),
        joinedload(models.CandidateMetadata.chapters)
    ).all()

    result = []
    for c in candidates:
        d = {
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "gender": c.gender,
            "state": c.state,
            "highest_education": c.highest_education,
            "current_status": c.current_status,
            "graduation": [{"degree_name": g.degree_name, "university": g.university, "score": f"{g.score_value} {g.score_type}"} for g in c.graduation],
            "postgraduate": [{"degree_name": p.degree_name, "university": p.university, "score": f"{p.score_value} {p.score_type}"} for p in c.postgraduate],
            "doctorate": [{"university": d.university, "thesis_title": d.thesis_title, "score": f"{d.score_value} {d.score_type}"} for d in c.doctorate],
            "work_experiences": [{"role": w.role, "company_name": w.company_name} for w in c.work_experiences],
            "books": [{"title": b.title} for b in c.books],
            "papers": [{"title": p.title} for p in c.papers],
            "chapters": [{"title": ch.chapter_name} for ch in c.chapters],
            "books_count": len(c.books),
            "papers_count": len(c.papers),
            "chapters_count": len(c.chapters)
        }
        result.append(d)
    
    # Sort results to match original order or by name
    result.sort(key=lambda x: x['full_name'])
    return result
