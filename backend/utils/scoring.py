import json
import os
import math

# Load universities database
UNIVERSITIES_DB = {}
universities_json_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 
    "database", 
    "universities.json"
)

if os.path.exists(universities_json_path):
    try:
        with open(universities_json_path, "r", encoding="utf-8") as f:
            UNIVERSITIES_DB = json.load(f)
    except Exception as e:
        print(f"Error loading universities.json: {e}")

def calculate_candidate_score(candidate, min_experience: float = 1.0) -> dict:
    """
    Calculate candidate score out of 85 marks according to the official general candidate scoring rubric.
    
    Rubric:
    1. Schooling: Class X (max 5) + Class XII (max 5) = max 10
    2. Essential Qualification (EQ): max 30 (Percentage * 0.3)
    3. Desirable Qualification (DQ): max 10 (Percentage * 0.1)
    4. University Brand: max 10 (Tier-1 = 10, Central = 7, NIRF < 50 = 3, Other = 0)
    5. Domain Experience: max 25 (Meeting min req = 15; +2 per extra year above min, capped at +10)
    
    Total score = 85 marks.
    """
    
    # 1. Schooling Scores
    school_x_score = 0.0
    school_xii_score = 0.0
    
    if candidate.schooling:
        # Class X
        x_val = candidate.schooling.class_x_score_value or 0.0
        x_type = candidate.schooling.class_x_score_type
        x_pct = x_val * 9.5 if str(x_type).upper() == "CGPA" else x_val
        school_x_score = min(5.0, x_pct * 0.05)
        
        # Class XII
        xii_val = candidate.schooling.class_xii_score_value or 0.0
        xii_type = candidate.schooling.class_xii_score_type
        xii_pct = xii_val * 9.5 if str(xii_type).upper() == "CGPA" else xii_val
        school_xii_score = min(5.0, xii_pct * 0.05)
        
    schooling_total = school_x_score + school_xii_score
    
    # 2. Education Degrees (EQ & DQ)
    undergrad = [e for e in candidate.higher_education if e.level == 'undergrad']
    postgrad = [e for e in candidate.higher_education if e.level == 'postgrad']
    phd = [e for e in candidate.higher_education if e.level == 'phd']
    
    eq_degree = None
    dq_degree = None
    
    if phd:
        dq_degree = phd[0]
        eq_degree = postgrad[0] if postgrad else (undergrad[0] if undergrad else None)
    elif postgrad and undergrad:
        eq_degree = postgrad[0]
        dq_degree = undergrad[0]
    elif postgrad:
        eq_degree = postgrad[0]
    elif undergrad:
        eq_degree = undergrad[0]
        
    # Calculate EQ Score
    eq_score = 0.0
    if eq_degree:
        eq_val = eq_degree.score_value or 0.0
        eq_type = eq_degree.score_type
        eq_pct = eq_val * 10.0 if str(eq_type).upper() == "CGPA" else eq_val
        eq_score = min(30.0, eq_pct * 0.3)
        
    # Calculate DQ Score
    dq_score = 0.0
    if dq_degree:
        dq_val = dq_degree.score_value or 0.0
        dq_type = dq_degree.score_type
        dq_pct = dq_val * 10.0 if str(dq_type).upper() == "CGPA" else dq_val
        dq_score = min(10.0, dq_pct * 0.1)
        
    # 3. University Brand Score (mapped from EQ degree)
    brand_score = 0.0
    brand_classification = "Other College"
    
    if eq_degree and eq_degree.university:
        univ_name = eq_degree.university.strip()
        univ_lower = univ_name.lower()
        
        # Check database for exact match (case-insensitive)
        matched = False
        for k, v in UNIVERSITIES_DB.items():
            if k.lower() == univ_lower:
                brand_score = float(v["points"])
                brand_classification = v["classification"]
                matched = True
                break
                
        if not matched:
            # Apply fuzzy fallback rules
            if any(term in univ_lower for term in ["iit", "nit", "iim", "national importance", "technology act", "indian institute of technology", "indian institute of management", "national institute of technology"]):
                brand_score = 10.0
                brand_classification = "Tier-1 (Auto-Detected INI)"
            elif any(term in univ_lower for term in ["central", "central university"]):
                brand_score = 7.0
                brand_classification = "Central University (Auto-Detected CU)"
            else:
                brand_score = 0.0
                brand_classification = "Other College"
                
    # 4. Domain Experience Score
    candidate_exp = candidate.years_of_experience or 0.0
    min_exp_req = float(min_experience) if min_experience is not None else 1.0
    
    exp_score = 0.0
    exp_desc = ""
    if candidate_exp >= min_exp_req:
        base_score = 15.0
        extra_years = max(0.0, candidate_exp - min_exp_req)
        # 2 points per extra year above requirement, capped at +10
        additional_score = min(10.0, math.floor(extra_years) * 2.0)
        exp_score = base_score + additional_score
        exp_desc = f"Met requirement of {min_exp_req} yrs (+15). Plus {math.floor(extra_years)} extra yrs x 2 = +{additional_score:.1f} additional."
    else:
        exp_score = 0.0
        exp_desc = f"Does not meet minimum required experience of {min_exp_req} years."
        
    # Total Calculation
    total_score = schooling_total + eq_score + dq_score + brand_score + exp_score
    
    return {
        "total_score": round(total_score, 2),
        "breakdown": {
            "schooling": round(schooling_total, 2),
            "school_x": round(school_x_score, 2),
            "school_xii": round(school_xii_score, 2),
            "eq": round(eq_score, 2),
            "dq": round(dq_score, 2),
            "brand": round(brand_score, 2),
            "brand_classification": brand_classification,
            "experience": round(exp_score, 2),
            "experience_desc": exp_desc,
            "candidate_exp": candidate_exp,
            "min_exp_req": min_exp_req
        }
    }
