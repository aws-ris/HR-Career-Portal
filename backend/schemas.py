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
    Admin               = 'Admin'

class AdminDept(str, Enum):
    IT      = 'IT'
    HR      = 'HR'
    Finance = 'Finance'
    Library = 'Library'
    Other   = 'Other'

class ScoreType(str, Enum):
    Percentage = 'Percentage'
    CGPA       = 'CGPA'

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
    RIS     = 'RIS'
    CMEC    = 'CMEC'
    FITM    = 'FITM'
    DAKSHIN = 'DAKSHIN'
    AIC     = 'AIC'

class EducationLevel(str, Enum):
    undergrad = 'undergrad'
    postgrad  = 'postgrad'
    phd       = 'phd'

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
    class_xii_school:     str = Field(default='')
    class_xii_board:      str = Field(default='Other')
    class_xii_score_type: ScoreType = Field(default=ScoreType.Percentage)
    class_xii_score_value: float = Field(..., ge=0)
    class_xii_year:        int = Field(..., ge=1950, le=2030)

    @field_validator('class_x_score_value')
    @classmethod
    def validate_x_score(cls, v, info):
        score_type = info.data.get('class_x_score_type')
        if score_type == ScoreType.Percentage and v > 100:
            raise ValueError('Percentage score_value must be <= 100')
        elif score_type == ScoreType.CGPA and v > 10:
            raise ValueError('CGPA score_value must be <= 10')
        return v

    @field_validator('class_xii_score_value')
    @classmethod
    def validate_xii_score(cls, v, info):
        score_type = info.data.get('class_xii_score_type')
        if score_type == ScoreType.Percentage and v > 100:
            raise ValueError('Percentage score_value must be <= 100')
        elif score_type == ScoreType.CGPA and v > 10:
            raise ValueError('CGPA score_value must be <= 10')
        return v

class SchoolingResponse(SchoolingCreate):
    id: str
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Higher Education (replaces Graduation/PG/Doctorate)
# ─────────────────────────────────────────────
class HigherEducationCreate(BaseModel):
    level:       EducationLevel
    university:  Optional[str]       = None
    degree_name: Optional[str]       = None
    score_type:  Optional[ScoreType] = None
    score_value: Optional[float]     = Field(None, ge=0)
    grad_year:   Optional[int]       = Field(None, ge=1950, le=2030)
    entry_order: int                 = Field(..., ge=1, le=10)

    @field_validator('score_value')
    @classmethod
    def validate_score(cls, v, info):
        if v is None:
            return v
        score_type = info.data.get('score_type')
        if score_type == ScoreType.Percentage and v > 100:
            raise ValueError('Percentage score_value must be <= 100')
        if score_type == ScoreType.CGPA and v > 10:
            raise ValueError('CGPA score_value must be <= 10')
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
        if not self.is_current and self.end_date is None:
            raise ValueError('end_date is required when is_current is False')
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
    extracurriculars: Optional[str] = Field(None, max_length=3000)
    google_scholar: Optional[str] = None
    linkedin:       Optional[str] = None
    pub_books:      Optional[int] = 0
    pub_papers:     Optional[int] = 0
    pub_chapters:   Optional[int] = 0
    pub_reports:    Optional[int] = 0
    pub_policy_briefs: Optional[int] = 0

    @field_validator('about')
    @classmethod
    def validate_word_count(cls, v):
        if v and len(v.split()) > 150:
            raise ValueError('About must not exceed 150 words')
        return v

    @field_validator('extracurriculars')
    @classmethod
    def validate_extracurriculars_word_count(cls, v):
        if v and len(v.split()) > 150:
            raise ValueError('Extracurriculars must not exceed 150 words')
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
    mobile_no:           str          = Field(..., pattern=r'^\d{10}$')
    dob:                 date
    gender:              Optional[GenderType] = None
    city:                Optional[str]        = None
    state:               Optional[str]        = None
    pincode:             Optional[str]        = Field(None, pattern=r'^\d{6}$')
    years_of_experience: Optional[float]      = Field(None, ge=0)

    # Links & about (goes to candidate_links_about)
    about:          Optional[str] = Field(None, max_length=3000)
    extracurriculars: Optional[str] = Field(None, max_length=3000)
    google_scholar: Optional[str] = None
    linkedin:       Optional[str] = None
    pub_books:      Optional[int] = 0
    pub_papers:     Optional[int] = 0
    pub_chapters:   Optional[int] = 0
    pub_reports:    Optional[int] = 0
    pub_policy_briefs: Optional[int] = 0

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

    @field_validator('extracurriculars')
    @classmethod
    def validate_extracurriculars_word_count(cls, v):
        if v and len(v.split()) > 150:
            raise ValueError('Extracurriculars must not exceed 150 words')
        return v

    @field_validator('admin_department')
    @classmethod
    def validate_admin_dept(cls, v, info):
        position = info.data.get('position_applied')
        if position == PositionType.Admin and not v:
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
    position:       PositionType
    division:       DivisionType
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

class JobPostingResponse(JobPostingCreate):
    id:         str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    model_config = {"from_attributes": True}
