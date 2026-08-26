import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Boolean, Integer,
    Date, DateTime, ForeignKey, CheckConstraint, ARRAY, LargeBinary
)
from sqlalchemy.orm import relationship, validates
from database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────────
# Job Postings (unchanged)
# ─────────────────────────────────────────────
class JobPosting(Base):
    __tablename__ = 'job_postings'

    id             = Column(String(36),  primary_key=True, default=generate_uuid)
    title          = Column(String(200), nullable=False)
    position       = Column(String(50),  nullable=True)
    division       = Column(String(50),  nullable=False)
    description    = Column(Text,        nullable=False)
    requirements   = Column(Text,        nullable=True)
    keywords       = Column(ARRAY(Text), nullable=True)
    status         = Column(String(20),  nullable=False, default='draft')
    total_openings = Column(Integer,     nullable=False, default=1)
    location       = Column(String(100), nullable=True)
    deadline       = Column(Date,        nullable=True)
    created_by     = Column(String(100), nullable=True)
    created_at     = Column(DateTime,    nullable=False, default=datetime.utcnow)
    updated_at     = Column(DateTime,    nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted     = Column(Boolean,     nullable=False, default=False)
    
    # Dynamic Job Constraints
    min_pay        = Column(Integer,     nullable=True)
    max_pay        = Column(Integer,     nullable=True)
    min_experience = Column(Integer,     nullable=True)
    max_experience = Column(Integer,     nullable=True)
    contract_period = Column(Integer,    nullable=True)
    job_mode       = Column(String(50),  nullable=True)

    applications   = relationship("ApplicationTracking", back_populates="job", cascade="all, delete-orphan")
    token_registry = relationship("TokenRegistry",       cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('draft','open','closed','archived')", name='chk_job_status'),
    )


# ─────────────────────────────────────────────
# Candidate Metadata — lean persona record only
# No job linkage here. No statuses. No assets.
# ─────────────────────────────────────────────
class CandidateMetadata(Base):
    __tablename__ = 'candidate_metadata'

    id                   = Column(String(36),  primary_key=True, default=generate_uuid)
    full_name            = Column(String(200), nullable=False)
    email                = Column(String(200), nullable=False, unique=True)
    mobile_no            = Column(String(20),  nullable=False)
    dob                  = Column(Date,        nullable=False)
    age                  = Column(Integer,     nullable=True)
    gender               = Column(String(30),  nullable=True)
    city                 = Column(String(100), nullable=True)
    state                = Column(String(100), nullable=True)
    pincode              = Column(String(20),  nullable=True)
    years_of_experience  = Column(Float,       nullable=True)

    @validates('dob')
    def update_age(self, key, dob_value):
        if dob_value:
            import datetime
            today = datetime.date.today()
            self.age = today.year - dob_value.year - ((today.month, today.day) < (dob_value.month, dob_value.day))
        return dob_value

    # Relationships
    applications         = relationship("ApplicationTracking",    back_populates="candidate", cascade="all, delete-orphan")
    schooling            = relationship("CandidateSchooling",     back_populates="candidate", cascade="all, delete-orphan", uselist=False)
    higher_education     = relationship("CandidateHigherEducation", back_populates="candidate", cascade="all, delete-orphan", order_by="CandidateHigherEducation.grad_year, CandidateHigherEducation.entry_order")
    publications         = relationship("CandidatePublication",   back_populates="candidate", cascade="all, delete-orphan", order_by="CandidatePublication.entry_order")
    work_experiences     = relationship("CandidateWorkExperience", back_populates="candidate", cascade="all, delete-orphan", order_by="CandidateWorkExperience.entry_order")
    links_about          = relationship("CandidateLinksAbout",    back_populates="candidate", cascade="all, delete-orphan", uselist=False)
    resume_payload       = relationship("CandidateResumePayload", back_populates="candidate", cascade="all, delete-orphan", uselist=False)


# ─────────────────────────────────────────────
# Application Tracking — one row per job application
# Tracks a specific person's application to a specific job
# ─────────────────────────────────────────────
class ApplicationTracking(Base):
    __tablename__ = 'application_tracking'

    id                = Column(String(36),  primary_key=True, default=generate_uuid)
    candidate_id      = Column(String(36),  ForeignKey('candidate_metadata.id', ondelete='CASCADE'), nullable=False)
    job_id            = Column(String(36),  ForeignKey('job_postings.id',        ondelete='SET NULL'), nullable=True)
    position_applied  = Column(String(100), nullable=True)
    admin_department  = Column(String(50),  nullable=True)
    current_status    = Column(String(30),  nullable=False, default='received')
    submitted_at      = Column(DateTime,    nullable=False, default=datetime.utcnow)
    updated_at        = Column(DateTime,    nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    profile_score     = Column(Float,       nullable=True)

    # Relationships
    candidate         = relationship("CandidateMetadata",       back_populates="applications")
    job               = relationship("JobPosting",               back_populates="applications")
    status_history    = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusHistory.changed_at")

    __table_args__ = (
        CheckConstraint("current_status IN ('received','under_review','shortlisted','rejected','offered')", name='chk_app_status'),
    )


# ─────────────────────────────────────────────
# Application Status History — audit trail per application
# ─────────────────────────────────────────────
class ApplicationStatusHistory(Base):
    __tablename__ = 'application_status_history'

    id                     = Column(String(36),  primary_key=True, default=generate_uuid)
    application_tracking_id = Column(String(36), ForeignKey('application_tracking.id', ondelete='CASCADE'), nullable=False)
    status                 = Column(String(30),  nullable=False)
    changed_at             = Column(DateTime,    nullable=False, default=datetime.utcnow)
    changed_by             = Column(String(100), nullable=False, default='SYSTEM')
    notes                  = Column(Text,        nullable=True)

    application            = relationship("ApplicationTracking", back_populates="status_history")

    __table_args__ = (
        CheckConstraint("status IN ('received','under_review','shortlisted','rejected','offered')", name='chk_history_status'),
    )


# ─────────────────────────────────────────────
# Schooling — 1:1 with candidate
# ─────────────────────────────────────────────
class CandidateSchooling(Base):
    __tablename__ = 'candidate_schooling'

    id                   = Column(String(36), primary_key=True, default=generate_uuid)
    candidate_id         = Column(String(36), ForeignKey('candidate_metadata.id', ondelete='CASCADE'), nullable=False)
    class_x_school       = Column(String(250), nullable=False, default='')
    class_x_board        = Column(String(100), nullable=False, default='Other')
    class_x_score_type   = Column(String(20),  nullable=False, default='Percentage')
    class_x_score_value  = Column(Float,       nullable=False, default=0.0)
    class_xii_school     = Column(String(250), nullable=False, default='')
    class_xii_board      = Column(String(100), nullable=False, default='Other')
    class_xii_score_type = Column(String(20),  nullable=False, default='Percentage')
    class_xii_score_value = Column(Float,       nullable=False, default=0.0)
    class_x_year          = Column(Integer,     nullable=True)
    class_xii_year         = Column(Integer,     nullable=True)

    candidate = relationship("CandidateMetadata", back_populates="schooling")


# ─────────────────────────────────────────────
# Higher Education — 1:N with candidate
# Replaces: graduation + postgraduate + doctorate
# ─────────────────────────────────────────────
class CandidateHigherEducation(Base):
    __tablename__ = 'candidate_higher_education'

    id           = Column(String(36),  primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36),  ForeignKey('candidate_metadata.id', ondelete='CASCADE'), nullable=False)
    level        = Column(String(20),  nullable=False)   # 'undergrad', 'postgrad', 'phd'
    university   = Column(String(200), nullable=True)
    degree_name  = Column(String(200), nullable=True)
    score_type   = Column(String(20),  nullable=True)    # 'Percentage', 'CGPA'
    score_value  = Column(Float,       nullable=True)
    grad_year    = Column(Integer,     nullable=True)
    entry_order  = Column(Integer,     nullable=False, default=1)

    candidate = relationship("CandidateMetadata", back_populates="higher_education")

    __table_args__ = (
        CheckConstraint("level IN ('undergrad','postgrad','phd')", name='chk_edu_level'),
        CheckConstraint("score_type IN ('Percentage','CGPA (Out of 10)', 'CGPA (Out of 4)')", name='chk_edu_score_type'),
    )


# ─────────────────────────────────────────────
# Publications — 1:N with candidate
# Replaces: books + chapters + papers
# ─────────────────────────────────────────────
class CandidatePublication(Base):
    __tablename__ = 'candidate_publications'

    id           = Column(String(36),  primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36),  ForeignKey('candidate_metadata.id', ondelete='CASCADE'), nullable=False)
    pub_type     = Column(String(30),  nullable=False)   # 'book','chapter','paper','thesis','journal','article'
    title        = Column(String(500), nullable=False)
    parent_book  = Column(String(500), nullable=True)    # Only for chapters
    entry_order  = Column(Integer,     nullable=False, default=1)

    candidate = relationship("CandidateMetadata", back_populates="publications")

    __table_args__ = (
        CheckConstraint("pub_type IN ('book','chapter','paper','thesis','journal','article')", name='chk_pub_type'),
    )


# ─────────────────────────────────────────────
# Work Experience — 1:N with candidate
# description column removed
# ─────────────────────────────────────────────
class CandidateWorkExperience(Base):
    __tablename__ = 'candidate_work_experience'

    id           = Column(String(36),  primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36),  ForeignKey('candidate_metadata.id', ondelete='CASCADE'), nullable=False)
    company_name = Column(String(200), nullable=False)
    role         = Column(String(200), nullable=False)
    start_date   = Column(Date,        nullable=False)
    end_date     = Column(Date,        nullable=True)
    is_current   = Column(Boolean,     nullable=False, default=False)
    entry_order  = Column(Integer,     nullable=False, default=1)

    candidate = relationship("CandidateMetadata", back_populates="work_experiences")


# ─────────────────────────────────────────────
# Candidate Links & About — 1:1 offload
# ─────────────────────────────────────────────
class CandidateLinksAbout(Base):
    __tablename__ = 'candidate_links_about'

    candidate_id   = Column(String(36), ForeignKey('candidate_metadata.id', ondelete='CASCADE'), primary_key=True)
    about          = Column(Text,        nullable=True)
    google_scholar = Column(String(500), nullable=True)
    linkedin       = Column(String(500), nullable=True)
    pub_books      = Column(Integer,     nullable=True, default=0)
    pub_papers     = Column(Integer,     nullable=True, default=0)
    pub_chapters   = Column(Integer,     nullable=True, default=0)
    pub_reports    = Column(Integer,     nullable=True, default=0)
    pub_policy_briefs = Column(Integer,  nullable=True, default=0)

    candidate = relationship("CandidateMetadata", back_populates="links_about")


# ─────────────────────────────────────────────
# Candidate Resume Payload — 1:1 heavy asset offload
# ─────────────────────────────────────────────
class CandidateResumePayload(Base):
    __tablename__ = 'candidate_resume_payload'

    candidate_id     = Column(String(36),   ForeignKey('candidate_metadata.id', ondelete='CASCADE'), primary_key=True)
    resume_path      = Column(String(500),  nullable=True)
    pdf_blob         = Column(LargeBinary,  nullable=True)
    raw_resume_text  = Column(Text,         nullable=True)
    resume_embedding = Column(ARRAY(Float), nullable=True)

    candidate = relationship("CandidateMetadata", back_populates="resume_payload")


# ─────────────────────────────────────────────
# Token Registry — autocomplete index per job
# ─────────────────────────────────────────────
class TokenRegistry(Base):
    __tablename__ = 'token_registry'

    id          = Column(String(36),  primary_key=True, default=generate_uuid)
    job_id      = Column(String(36),  ForeignKey('job_postings.id', ondelete='CASCADE'), nullable=False)
    token_type  = Column(String(50),  nullable=False)   # 'university','degree','company','role','pub_title'
    token_value = Column(String(500), nullable=False)
    normalized  = Column(String(500), nullable=False)
    frequency   = Column(Integer,     nullable=False, default=1)
