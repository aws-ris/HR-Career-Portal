    try:
        clean_job_id = str(job_id).strip()
        
        # 1. Base query for IDs
        id_query = db.query(models.CandidateMetadata.id).filter(
            models.CandidateMetadata.job_id == clean_job_id,
            models.CandidateMetadata.is_deleted == False
        )

        # Apply filters to the ID query
        if filters.states and len(filters.states) > 0:
            id_filters = [models.CandidateMetadata.state.ilike(f"%{s}%") for s in filters.states]
            id_query = id_query.filter(or_(*id_filters))
        
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

        if filters.min_papers and filters.min_papers > 0:
            p_ids = db.query(models.Paper.candidate_id).group_by(models.Paper.candidate_id).having(func.count(models.Paper.id) >= filters.min_papers).subquery()
            id_query = id_query.filter(models.CandidateMetadata.id.in_(p_ids))

        # 2. Get the final list of matching IDs
        res_ids = id_query.all()
        matching_ids = [r[0] for r in res_ids]
