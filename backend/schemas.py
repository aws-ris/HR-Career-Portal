from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import List, Optional
from datetime import date, datetime
from enum import Enum


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────
class PositionType(str, Enum):
    Professor           = 'Professor'
    Associate_Professor = 'Associate Professor'
    Assistant_Professor = 'Assistant Professor'
    Consultant          = 'Consultant'
    Research_Assistant  = 'Research Assistant'
    Assistant           = 'Assistant'
    Director            = 'Director'
    Officer             = 'Officer'
    Multi_Tasking_Staff = 'Multi Tasking Staff'
    Associate           = 'Associate'

class AdminDept(str, Enum):
    IT      = 'IT'
    HR      = 'HR'
    Finance = 'Finance'
    Library = 'Library'
    Other   = 'Other'

class ScoreType(str, Enum):
    Percentage = 'Percentage'
    CGPA       = 'CGPA'
    CGPA_10    = 'CGPA (Out of 10)'
    CGPA_4     = 'CGPA (Out of 4)'

class GenderType(str, Enum):
    Male       = 'Male'
    Female     = 'Female'
    Other      = 'Other'
    Prefer_not = 'Prefer not to say'

class CandidateStatus(str, Enum):
    received      = 'received'
    under_review  = 'under_review'
    shortlisted   = 'shortlisted'
    rejected      = 'rejected'
    offered       = 'offered'

class JobStatus(str, Enum):
    draft    = 'draft'
    open     = 'open'
    closed   = 'closed'
    archived = 'archived'

class DivisionType(str, Enum):
    RIS               = 'RIS'
    CMEC              = 'CMEC'
    FITM              = 'FITM'
    DAKSHIN           = 'DAKSHIN'
    AIC               = 'AIC'
    Admin_HR          = 'Admin - HR'
    Admin_IT          = 'Admin - IT'
    Admin_Finance     = 'Admin - Finance'
    Admin_Publication = 'Admin - Publication'
    Admin_MTS         = 'Admin - MTS'
    Admin_Library     = 'Admin - Library'
    General_Admin     = 'General Admin'

class EducationLevel(str, Enum):
    undergrad = 'undergrad'
    postgrad  = 'postgrad'
    phd       = 'phd'
    diploma   = 'diploma'

class PublicationType(str, Enum):
    book    = 'book'
    chapter = 'chapter'
    paper   = 'paper'
    thesis  = 'thesis'
    journal = 'journal'
    article = 'article'


# ─────────────────────────────────────────────
# Schooling
# ─────────────────────────────────────────────
class SchoolingCreate(BaseModel):
    class_x_school:       str = Field(default='')
    class_x_board:        str = Field(default='Other')
    class_x_score_type:   ScoreType = Field(default=ScoreType.Percentage)
    class_x_score_value:  float = Field(..., ge=0)
    class_x_year:         int = Field(..., ge=1950, le=2030)
    class_xii_school:     Optional[str] = Field(default='')
    class_xii_board:      Optional[str] = Field(default='Other')
    class_xii_score_type: Optional[ScoreType] = Field(default=ScoreType.Percentage)
    class_xii_score_value: Optional[float] = Field(default=None, ge=0)
    class_xii_year:        Optional[int] = Field(default=None, ge=1950, le=2030)

    @field_validator('class_x_score_value')
    @classmethod
    def validate_x_score(cls, v, info):
        score_type = info.data.get('class_x_score_type')
        if score_type == ScoreType.Percentage and v > 100:
            raise ValueError('Percentage score_value must be <= 100')
        elif score_type in (ScoreType.CGPA_10, ScoreType.CGPA) and v > 10:
            raise ValueError('CGPA (10) score_value must be <= 10')
        elif score_type == ScoreType.CGPA_4 and v > 4:
            raise ValueError('CGPA (4) score_value must be <= 4')
        return v

    @field_validator('class_xii_score_value')
    @classmethod
    def validate_xii_score(cls, v, info):
        if v is None:
            return v
        score_type = info.data.get('class_xii_score_type')
        if score_type == ScoreType.Percentage and v > 100:
            raise ValueError('Percentage score_value must be <= 100')
        elif score_type in (ScoreType.CGPA_10, ScoreType.CGPA) and v > 10:
            raise ValueError('CGPA (10) score_value must be <= 10')
        elif score_type == ScoreType.CGPA_4 and v > 4:
            raise ValueError('CGPA (4) score_value must be <= 4')
        return v

class SchoolingResponse(SchoolingCreate):
    id: str
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Higher Education (replaces Graduation/PG/Doctorate/Diploma)
# ─────────────────────────────────────────────
class HigherEducationCreate(BaseModel):
    level:          EducationLevel
    university:     Optional[str]       = None
    degree_name:    Optional[str]       = None
    phd_domain:     Optional[str]       = None
    score_type:     Optional[ScoreType] = None
    score_value:    Optional[float]     = Field(None, ge=0)
    grad_year:      Optional[int]       = Field(None, ge=1950, le=2035)
    is_pursuing:    Optional[bool]      = False
    duration_value: Optional[int]       = Field(None, ge=1, le=60)
    duration_unit:  Optional[str]       = None
    entry_order:    int                 = Field(..., ge=1, le=10)

    @field_validator('score_value')
    @classmethod
    def validate_score(cls, v, info):
        if v is None:
            return v
        score_type = info.data.get('score_type')
        if score_type == ScoreType.Percentage and v > 100:
            raise ValueError('Percentage score_value must be <= 100')
        if score_type in (ScoreType.CGPA_10, ScoreType.CGPA) and v > 10:
            raise ValueError('CGPA (10) score_value must be <= 10')
        if score_type == ScoreType.CGPA_4 and v > 4:
            raise ValueError('CGPA (4) score_value must be <= 4')
        return v

class HigherEducationResponse(HigherEducationCreate):
    id: str
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Publication (replaces Books/Chapters/Papers)
# ─────────────────────────────────────────────
class PublicationCreate(BaseModel):
    pub_type:    PublicationType
    title:       str             = Field(..., min_length=1, max_length=500)
    parent_book: Optional[str]  = None
    entry_order: int             = Field(..., ge=1, le=20)

class PublicationResponse(PublicationCreate):
    id: str
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Work Experience (description removed)
# ─────────────────────────────────────────────
class WorkExperienceCreate(BaseModel):
    company_name: str
    role:         str
    start_date:   date
    end_date:     Optional[date] = None
    is_current:   bool           = False
    entry_order:  int            = Field(..., ge=1, le=10)

    @model_validator(mode='after')
    def validate_dates(self):
        if self.is_current:
            self.end_date = None
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValueError('end_date must be after start_date')
        return self


class WorkExperienceResponse(WorkExperienceCreate):
    id: str
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Application Status History
# ─────────────────────────────────────────────
class StatusHistoryResponse(BaseModel):
    id:         str
    status:     str
    changed_at: datetime
    changed_by: str
    notes:      Optional[str] = None
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Application Tracking
# ─────────────────────────────────────────────
class ApplicationTrackingResponse(BaseModel):
    id:               str
    job_id:           Optional[str]
    position_applied: Optional[str]
    admin_department: Optional[str]
    current_status:   str
    submitted_at:     datetime
    updated_at:       Optional[datetime]
    status_history:   List[StatusHistoryResponse] = []
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Links & About
# ─────────────────────────────────────────────
class LinksAboutCreate(BaseModel):
    about:          Optional[str] = Field(None, max_length=3000)
    sop:            Optional[str] = Field(None, max_length=5000)
    google_scholar: Optional[str] = None
    linkedin:       Optional[str] = None
    pub_books:      Optional[int] = 0
    pub_papers:     Optional[int] = 0
    pub_chapters:   Optional[int] = 0
    pub_reports:    Optional[int] = 0
    pub_policy_briefs: Optional[int] = 0
    how_heard:      Optional[str] = None

    @field_validator('about')
    @classmethod
    def validate_word_count(cls, v):
        if v and len(v.split()) > 150:
            raise ValueError('About must not exceed 150 words')
        return v

class LinksAboutResponse(LinksAboutCreate):
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Full Candidate Submission
# ─────────────────────────────────────────────
class CandidateCreate(BaseModel):
    # Application context (goes to application_tracking)
    job_id:           Optional[str]       = None
    position_applied: PositionType
    admin_department: Optional[AdminDept] = None

    # Personal data (goes to candidate_metadata)
    full_name:           str          = Field(..., min_length=2, max_length=200)
    email:               EmailStr
    nationality:         Optional[str] = Field(default='Indian')
    country_code:        Optional[str] = Field('+91', pattern=r'^\+\d{1,4}$')
    mobile_no:           str          = Field(..., pattern=r'^\d{4,15}$')
    dob:                 date
    gender:              Optional[GenderType] = None
    city:                Optional[str]        = None
    state:               Optional[str]        = None
    pincode:             Optional[str]        = None
    is_international_address: Optional[bool]  = False
    international_address:    Optional[str]   = None
    years_of_experience: Optional[float]      = Field(None, ge=0)
    last_salary:         Optional[float]      = Field(None, ge=0)
    worked_at_ris:       Optional[bool]       = False
    ris_designation:     Optional[str]        = None
    ris_start_date:      Optional[date]       = None
    ris_end_date:        Optional[date]       = None
    ris_is_current:      Optional[bool]       = False


    # Links & about (goes to candidate_links_about)
    about:          Optional[str] = Field(None, max_length=3000)
    sop:            Optional[str] = Field(None, max_length=5000)
    google_scholar: Optional[str] = None
    linkedin:       Optional[str] = None
    pub_books:      Optional[int] = 0
    pub_papers:     Optional[int] = 0
    pub_chapters:   Optional[int] = 0
    pub_reports:    Optional[int] = 0
    pub_policy_briefs: Optional[int] = 0
    how_heard:      Optional[str] = None

    # Nested education and experience
    schooling:        SchoolingCreate
    higher_education: List[HigherEducationCreate]   = Field(default=[], max_length=10)
    publications:     List[PublicationCreate]        = Field(default=[], max_length=20)
    work_experiences: List[WorkExperienceCreate]     = Field(default=[], max_length=10)

    @field_validator('about')
    @classmethod
    def validate_word_count(cls, v):
        if v and len(v.split()) > 150:
            raise ValueError('About must not exceed 150 words')
        return v



    @field_validator('admin_department')
    @classmethod
    def validate_admin_dept(cls, v, info):
        position = info.data.get('position_applied')
        if position and (position == 'Admin' or getattr(position, 'value', position) == 'Admin') and not v:
            raise ValueError('Admin department must be provided for Admin position')
        return v


class CandidateResponse(BaseModel):
    id:        str
    full_name: str
    model_config = {"from_attributes": True}


class CandidateFullResponse(BaseModel):
    id:                  str
    full_name:           str
    email:               str
    country_code:        Optional[str] = None
    mobile_no:           str
    dob:                 date
    age:                 Optional[int] = None
    gender:              Optional[str]
    city:                Optional[str]
    state:               Optional[str]
    pincode:             Optional[str]
    years_of_experience: Optional[float]
    schooling:           Optional[SchoolingResponse]
    higher_education:    List[HigherEducationResponse]  = []
    publications:        List[PublicationResponse]      = []
    work_experiences:    List[WorkExperienceResponse]   = []
    links_about:         Optional[LinksAboutResponse]   = None
    applications:        List[ApplicationTrackingResponse] = []
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Job Posting (unchanged)
# ─────────────────────────────────────────────
class JobPostingCreate(BaseModel):
    title:          str               = Field(..., min_length=3, max_length=200)
    position:       Optional[str]     = None
    division:       Optional[str]     = None
    description:    str
    requirements:   Optional[str]     = None
    keywords:       Optional[List[str]] = None
    status:         JobStatus         = JobStatus.draft
    total_openings: int               = Field(1, ge=1)
    deadline:       Optional[date]    = None
    created_by:     Optional[str]     = None
    
    # Dynamic Job Constraints
    min_pay:        Optional[int]     = None
    max_pay:        Optional[int]     = None
    min_experience: Optional[int]     = None
    max_experience: Optional[int]     = None
    contract_period:Optional[int]     = None
    job_mode:       Optional[str]     = None
    pay_band:       Optional[str]     = None
    pay_level:      Optional[str]     = None

    @field_validator('deadline', mode='before')
    @classmethod
    def parse_deadline(cls, v):
        if not v or v == '':
            return None
        if isinstance(v, str):
            v = v.strip()
            # Try YYYY-MM-DD
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                pass
            # Try DD-MM-YYYY
            try:
                return datetime.strptime(v, '%d-%m-%Y').date()
            except ValueError:
                pass
        return v

class JobPostingResponse(JobPostingCreate):
    id:         str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    model_config = {"from_attributes": True}
