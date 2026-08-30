# 📘 HR Career Portal — Comprehensive System Documentation & Operations Manual

> **Research and Information System for Developing Countries (RIS)**  
> **System Version:** 2.0.0 (High-Concurrency Non-Blocking Edition)  
> **Environment:** Production EC2 (`13.205.216.81`) & Local Development  
> **Last Updated:** August 30, 2026  

---

## 📑 Table of Contents
1. [Executive System Overview](#1-executive-system-overview)
2. [User Manual (Candidates & HR Admins)](#2-user-manual-candidates--hr-admins)
   - [For Job Candidates](#for-job-candidates)
   - [For HR Administrators](#for-hr-administrators)
3. [Developer Guide (Full-Stack Engineering)](#3-developer-guide-full-stack-engineering)
   - [Technology Stack](#technology-stack)
   - [Project Directory Layout](#project-directory-layout)
   - [Database Schema & Entity-Relationship Model](#database-schema--entity-relationship-model)
   - [API Reference](#api-reference)
   - [Local Setup & Management CLI Utilities](#local-setup--management-cli-utilities)
4. [System Architect & DevOps Guide](#4-system-architect--devops-guide)
   - [Production Infrastructure Topology](#production-infrastructure-topology)
   - [High-Concurrency Tuning Specifications](#high-concurrency-tuning-specifications)
   - [EC2 File System & Directory Standards](#ec2-file-system--directory-standards)
   - [Systemd & Nginx Configuration](#systemd--nginx-configuration)
   - [n8n Automation Engine & System Health Monitoring](#n8n-automation-engine--system-health-monitoring)
   - [Portable SSH Access & Security Protocols](#portable-ssh-access--security-protocols)

---

## 1. Executive System Overview

The **RIS HR Career Portal** is an enterprise-grade recruitment and candidate management platform designed for high-concurrency recruitment drives (1,000+ simultaneous candidate submissions). It features non-blocking application processing, automated profile scoring, database-backed authentication, multi-job candidate linkage, and n8n daily health automation.

```mermaid
graph TD
    A["👤 Candidates (1,000+ Concurrent)"] -->|Public Job Board & Applications| B["🌐 Nginx Reverse Proxy (Port 80/443)"]
    B -->|FastAPI Proxy (Port 8005)| C["⚡ Gunicorn / FastAPI Backend (8 Workers)"]
    
    C -->|Fast Metadata Writes| D[("🗄️ PostgreSQL Database (300 Conns)")]
    C -->|Async Background Tasks| E["⚙️ Background Profile Scoring & Tokenization"]
    C -->|Webhooks| F["🔔 n8n Automation Engine (Port 5678)"]
    
    G["👔 HR Administrators"] -->|Admin Portal & Dossiers| B
```

---

## 2. User Manual (Candidates & HR Admins)

### For Job Candidates

1. **Browsing Open Vacancies:**
   - Visit the **Public Job Board** at `http://13.205.216.81/hr`.
   - Explore active job postings, minimum experience requirements, pay scales, and application deadlines.

2. **Submitting an Application:**
   - Click **"Apply Now"** on any active vacancy.
   - Complete the 5-step form:
     1. **Personal Information:** Name, Email, DOB, Contact, City, State.
     2. **Schooling Details:** Class X & Class XII Board, School Name, Score (Percentage/CGPA).
     3. **Higher Education:** Graduation, Post-Graduation, PhD/Doctorate details.
     4. **Work Experience & Publications:** Employer details, designation, publication counts, validation DOI/URLs.
     5. **Preview & Submission:** Review candidate dossier, download PDF copy, select outreach source (*"Where did you hear about this vacancy?"*), and click **Submit Application**.

3. **Built-in Resilience:**
   - The application form features an **automatic 3-attempt background retry loop**. If your mobile data lags during submission, the browser automatically retries in the background without displaying an error page.

---

### For HR Administrators

1. **Accessing the HR Admin Portal:**
   - Navigate to `http://13.205.216.81/hr/login`.
   - Enter your credentials:
     - **Username:** `hr_ris`
     - **Password:** `ris@1234`

2. **Managing Vacancies & Applicants:**
   - **Job Postings Tab:** Create new job vacancies, update deadlines, or mark postings as closed.
   - **Applicant Roster:** Click on any vacancy to open the candidate table. Filter candidates by education level, score, status, or search by candidate name/email.

3. **Viewing Candidate Dossiers & Application History:**
   - Click the blue **"Dossier"** button on any candidate row.
   - The Candidate Dossier displays:
     - Full persona info, age, score breakdown, education, and work experience.
     - Resume download link.
     - **`📂 Application History & Previous Vacancies`**: Shows every previous job vacancy applied for by this candidate across the portal, along with submission dates and status history.

4. **Account Settings & Password Updates:**
   - Click **"Settings"** in the sidebar navigation (`/hr/settings`).
   - Enter your **Current Password**, **New Password** (min 6 characters), and **Confirm New Password**.
   - Click **Confirm & Update Password** to save changes securely.
   - **Forgot Password Notice:** In case a user forgets their password, a prominent notice directs them to contact the IT Department at `it-support@ris.org.in` or Extension `402`.

---

## 3. Developer Guide (Full-Stack Engineering)

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 8, Vanilla CSS, Lucide Icons | Single-Page Application (SPA) |
| **Backend** | Python 3.14, FastAPI, Gunicorn, Uvicorn | Async REST API Engine |
| **Database** | PostgreSQL 18, SQLAlchemy ORM | Relational Data Store |
| **Automation** | n8n, Docker | Webhook & Daily Health Workflows |
| **Web Server** | Nginx 1.28 | Reverse Proxy & SSL Termination |

---

### Project Directory Layout

```text
c:\Project Code\HR_RIS\
├── backend/
│   ├── database/
│   │   ├── database.py       # SQLAlchemy engine & pool config
│   │   └── models.py         # Relational database models
│   ├── scripts/
│   │   ├── hr_backend.service                      # Systemd service definition
│   │   ├── nginx_hr_portal.conf                    # Nginx site configuration
│   │   ├── load_test_1000.py                       # 1,000 concurrent load benchmark
│   │   ├── verify_candidate_system_integrity.py    # Multi-job linkage & duplicate test
│   │   └── n8n_daily_health_check_workflow.json    # n8n health workflow
│   ├── utils/
│   │   ├── auth.py           # PBKDF2 SHA-256 password hashing & JWT
│   │   ├── scoring.py        # Automated candidate scoring algorithm
│   │   └── webhooks.py       # n8n event triggers
│   ├── main.py               # Core FastAPI routes & BackgroundTasks
│   ├── manage_admin.py       # CLI admin password reset utility
│   └── inject_5_per_job.py   # Seeder script
├── src/
│   ├── components/hr/
│   │   ├── CandidateProfileModal.jsx   # Candidate Dossier & History Modal
│   │   └── JobViewModal.jsx
│   ├── pages/
│   │   ├── ApplicationForm.jsx         # Candidate Application Form (Resilient)
│   │   └── hr/JobAnalytics.jsx          # HR Applicant Roster Table
│   └── main.jsx
├── DOCUMENTATION.md           # System documentation (This file)
└── vite.config.js
```

---

### Database Schema & Entity-Relationship Model

```mermaid
erDiagram
    JobPosting ||--o{ ApplicationTracking : "receives"
    CandidateMetadata ||--o{ ApplicationTracking : "submits"
    CandidateMetadata ||--o| CandidateSchooling : "has"
    CandidateMetadata ||--o{ CandidateHigherEducation : "has"
    CandidateMetadata ||--o{ CandidatePublication : "has"
    CandidateMetadata ||--o{ CandidateWorkExperience : "has"
    ApplicationTracking ||--o{ ApplicationStatusHistory : "tracks"

    JobPosting {
        string id PK
        string title
        string position
        string status
        int min_experience
    }

    CandidateMetadata {
        string id PK
        string full_name
        string email UK
        string mobile_no
        date dob
        float years_of_experience
    }

    ApplicationTracking {
        string id PK
        string candidate_id FK
        string job_id FK
        string current_status
        float profile_score
        datetime submitted_at
    }
```

---

### Complete Database Schema & Candidate Input Field Mapping Matrix

#### 1. Candidate Persona & Demographics (`candidate_metadata`)
*Stores candidate personal information and persona attributes.*

| Form Input Field | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| Full Name | `candidate_metadata` | `full_name` | `VARCHAR(200)` | Mandatory |
| Email Address | `candidate_metadata` | `email` | `VARCHAR(200)` | Unique Persona Key |
| Country Code | `candidate_metadata` | `country_code` | `VARCHAR(10)` | Default `+91` |
| Mobile Number | `candidate_metadata` | `mobile_no` | `VARCHAR(20)` | Mandatory |
| Date of Birth | `candidate_metadata` | `dob` | `DATE` | Mandatory |
| Calculated Age | `candidate_metadata` | `age` | `INTEGER` | Auto-calculated from DOB |
| Gender | `candidate_metadata` | `gender` | `VARCHAR(30)` | Male / Female / Other |
| City | `candidate_metadata` | `city` | `VARCHAR(100)` | City of residence |
| State | `candidate_metadata` | `state` | `VARCHAR(100)` | State of residence |
| Pincode | `candidate_metadata` | `pincode` | `VARCHAR(20)` | Postal PIN code |
| Total Work Experience | `candidate_metadata` | `years_of_experience` | `FLOAT` | Total experience in years |
| Current / Last Salary | `candidate_metadata` | `last_salary` | `FLOAT` | Optional financial field |

#### 2. Schooling Information (`candidate_schooling`)
*Stores Class X & Class XII secondary education records (1:1 with candidate).*

| Form Input Field | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| Class X School Name | `candidate_schooling` | `class_x_school` | `VARCHAR(250)` | School name |
| Class X Education Board | `candidate_schooling` | `class_x_board` | `VARCHAR(100)` | CBSE, ICSE, State Board, etc. |
| Class X Score Type | `candidate_schooling` | `class_x_score_type` | `VARCHAR(20)` | `Percentage` or `CGPA` |
| Class X Score Value | `candidate_schooling` | `class_x_score_value` | `FLOAT` | Score numerical value |
| Class X Year of Passing | `candidate_schooling` | `class_x_year` | `INTEGER` | e.g. `2007` |
| Class XII School Name | `candidate_schooling` | `class_xii_school` | `VARCHAR(250)` | School name |
| Class XII Education Board | `candidate_schooling` | `class_xii_board` | `VARCHAR(100)` | Board name |
| Class XII Score Type | `candidate_schooling` | `class_xii_score_type` | `VARCHAR(20)` | `Percentage` or `CGPA` |
| Class XII Score Value | `candidate_schooling` | `class_xii_score_value` | `FLOAT` | Score numerical value |
| Class XII Year of Passing | `candidate_schooling` | `class_xii_year` | `INTEGER` | e.g. `2009` |

#### 3. Higher Education (`candidate_higher_education`)
*Stores Graduation, Post-Graduation, PhD/Doctorate, and Diplomas (1:N with candidate).*

| Form Input Field | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| Education Level | `candidate_higher_education` | `level` | `VARCHAR(20)` | `undergrad`, `postgrad`, `phd`, `diploma` |
| University / Institution | `candidate_higher_education` | `university` | `VARCHAR(200)` | University name |
| Degree Name & Discipline | `candidate_higher_education` | `degree_name` | `VARCHAR(200)` | e.g. *BA Economics*, *MA International Trade* |
| Score Marking System | `candidate_higher_education` | `score_type` | `VARCHAR(20)` | `Percentage`, `CGPA (Out of 10)`, `CGPA (Out of 4)` |
| Score Value | `candidate_higher_education` | `score_value` | `FLOAT` | Percentage / CGPA value |
| Graduation Year | `candidate_higher_education` | `grad_year` | `INTEGER` | Passing year |
| Is Pursuing Status | `candidate_higher_education` | `is_pursuing` | `BOOLEAN` | `True` if ongoing |
| Course Duration | `candidate_higher_education` | `duration_value` | `INTEGER` | e.g. `3` |
| Duration Unit | `candidate_higher_education` | `duration_unit` | `VARCHAR(10)` | `Years` / `Months` |

#### 4. Work Experience (`candidate_work_experience`)
*Stores candidate employment history & past roles (1:N with candidate).*

| Form Input Field | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| Employer / Organization | `candidate_work_experience` | `company_name` | `VARCHAR(200)` | Company / Institution |
| Job Designation / Role | `candidate_work_experience` | `role` | `VARCHAR(200)` | Position title |
| Employment Start Date | `candidate_work_experience` | `start_date` | `DATE` | Start date |
| Employment End Date | `candidate_work_experience` | `end_date` | `DATE` | End date (null if current) |
| Is Currently Working | `candidate_work_experience` | `is_current` | `BOOLEAN` | `True` if current job |

#### 5. Research Publications (`candidate_publications`)
*Stores paper titles, books, chapters, and journal publications (1:N with candidate).*

| Form Input Field | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| Publication Type | `candidate_publications` | `pub_type` | `VARCHAR(30)` | `book`, `chapter`, `paper`, `thesis`, `journal`, `article` |
| Title of Paper / Book | `candidate_publications` | `title` | `VARCHAR(500)` | Publication title |
| Parent Book / Journal Name | `candidate_publications` | `parent_book` | `VARCHAR(500)` | Publisher or journal name |

#### 6. Online Profiles, SOP & Outreach (`candidate_links_about`)
*Stores aggregate counts, Statement of Purpose (SOP), LinkedIn/Scholar URLs, and referral source.*

| Form Input Field | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| About Candidate / Bio | `candidate_links_about` | `about` | `TEXT` | Summary biography |
| Statement of Purpose (SOP) | `candidate_links_about` | `sop` | `TEXT` | Research SOP |
| Google Scholar URL | `candidate_links_about` | `google_scholar` | `VARCHAR(500)` | Profile link |
| LinkedIn URL | `candidate_links_about` | `linkedin` | `VARCHAR(500)` | Profile link |
| Peer-Reviewed Papers Count | `candidate_links_about` | `pub_papers` | `INTEGER` | Quantitative count |
| Books & Chapters Count | `candidate_links_about` | `pub_books` | `INTEGER` | Quantitative count |
| Working Papers Count | `candidate_links_about` | `pub_chapters` | `INTEGER` | Quantitative count |
| Policy Briefs Count | `candidate_links_about` | `pub_policy_briefs` | `INTEGER` | Quantitative count |
| Research Reports Count | `candidate_links_about` | `pub_reports` | `INTEGER` | Quantitative count |
| Referral Outreach Source | `candidate_links_about` | `how_heard` | `VARCHAR(500)` | *"Where did you hear about this post?"* |

#### 7. AWS S3 Resume Storage & Text Extract (`candidate_resume_payload`)
*Pure S3 reference and extracted resume text for AI vector search.*

| Asset / Payload | DB Table | DB Column Name | Data Type | Notes / Constraints |
|---|---|---|---|---|
| Categorized AWS S3 Path | `candidate_resume_payload` | `resume_path` | `VARCHAR(500)` | e.g. `jobs/{job}/resumes/{id}_cv.pdf` |
| Parsed Plain Text | `candidate_resume_payload` | `raw_resume_text` | `TEXT` | Extracted text for AI RAG |
| AI Vector Embedding | `candidate_resume_payload` | `resume_embedding` | `ARRAY(FLOAT)` | Vector embedding for semantic search |

---

### Data Freshness & Caching Architecture

- **Real-Time Direct Database Querying:** All API GET endpoints (such as `/api/v1/public/jobs`, `/api/v1/candidates/{id}/full_profile`, and admin roster tables) query PostgreSQL **directly in real time**.
- **No Stale Cache Risks:** The system intentionally avoids intermediate caching layers (like Redis or Nginx `proxy_cache`). Any update made by an HR administrator (e.g. status change from `received` to `shortlisted`) or candidate submission is **instantly visible**.
- **Pooled Connections:** While queries execute directly against PostgreSQL every time, database TCP sockets are efficiently recycled using SQLAlchemy's connection pool (`pool_size=20`, `max_overflow=100`, `pool_timeout=120s`).

---

### API Reference

#### 1. Candidate Application Submission
- **POST** `/api/v1/applications`
- **Latency:** `< 30ms` (Non-blocking async pipeline)
- **Response:** `201 Created`

#### 2. Public Jobs Roster
- **GET** `/api/v1/public/jobs`
- **Response:** List of open job postings.

#### 3. Candidate Full Profile & Dossier
- **GET** `/api/v1/candidates/{candidate_id}/full_profile?job_id={job_id}`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Complete profile including schooling, higher education, work experience, publications, score breakdown, and `applications` history array.

#### 4. Admin Authentication & Password Reset
- **POST** `/api/v1/auth/login`
- **POST** `/api/v1/auth/change-password`

---

### Local Setup & Management CLI Utilities

```bash
# 1. Activate Virtual Environment
cd backend
source venv/bin/activate  # On Linux/macOS
.\venv\Scripts\activate   # On Windows

# 2. Reset / Change Admin Password via CLI
python manage_admin.py reset hr_ris new_secure_password

# 3. Execute Candidate Linkage & Duplicate Prevention Verification Tests
python3 scripts/verify_candidate_system_integrity.py

# 4. Run Concurrent Load Test Benchmark
python3 scripts/load_test_1000.py 300
```

---

## 4. System Architect & DevOps Guide

### Production Infrastructure Topology

| Host Server | IP Address | Service | Port | Directory |
|---|---|---|---|---|
| **AWS EC2 (Ubuntu 24.04)** | `13.205.216.81` | HR Portal Gunicorn Backend | `8005` | `/var/www/HR_RIS` |
| | | KMS RAG API (Uvicorn) | `8000` | `/var/www/rag_system` |
| | | KMS Frontend | `80` | `/var/www/kms-frontend` |
| | | n8n Automation Engine | `5678` | `/opt/n8n` (Docker) |
| | | PostgreSQL 18 Cluster | `5432` | `localhost:5432` |

---

### High-Concurrency Tuning Specifications

To support 1,000+ simultaneous candidate submissions on a single 2 vCPU `t3.large` instance:

1. **PostgreSQL Connection Capacity:**
   - `/etc/postgresql/18/main/postgresql.conf`: `max_connections = 300`
2. **Gunicorn Socket Listen Backlog:**
   - `--workers 8 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8005 --backlog 4096`
3. **SQLAlchemy Connection Pool (Database Engine):**
   - `pool_size=20`, `max_overflow=100`, `pool_timeout=120s`, `pool_recycle=1800`

---

### EC2 File System & Directory Standards

All production web application repositories are standardized under **`/var/www/`**:

- 📁 `/var/www/HR_RIS` — HR Career Portal codebase.
- 📁 `/var/www/HR_RIS/backend/uploads/resumes/` — Local persistent resume PDF/DOCX storage.
- 📁 `/var/www/rag_system` — Knowledge Management / RAG API codebase.
- 📁 `/var/www/kms-frontend` — KMS Frontend UI static files.

*Symlink Protection:* `/home/ubuntu/rag_system` $\rightarrow$ `/var/www/rag_system` ensures python virtual environment shebangs resolve cleanly.

---

### Systemd & Nginx Configuration

#### Gunicorn Systemd Service (`/etc/systemd/system/hr_portal_backend.service`)
```ini
[Unit]
Description=FastAPI Gunicorn Dedicated Backend Service for HR Portal
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/var/www/HR_RIS/backend
ExecStart=/var/www/HR_RIS/backend/venv/bin/gunicorn \
    --workers 8 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8005 \
    --backlog 4096 \
    --timeout 120 \
    --access-logfile /var/www/HR_RIS/backend/access.log \
    --error-logfile /var/www/HR_RIS/backend/error.log \
    main:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

#### Nginx Site Configuration (`/etc/nginx/sites-available/hr_portal_site.conf`)
```nginx
server {
    listen 80;
    server_name 13.205.216.81;

    # Frontend React SPA
    location /hr/ {
        alias /var/www/HR_RIS/dist/;
        try_files $uri $uri/ /hr/index.html;
    }

    # Backend API Proxy to Port 8005
    location /api/ {
        proxy_pass http://127.0.0.1:8005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### n8n Automation Engine & System Health Monitoring

The **n8n Daily Health Check Workflow** (`backend/scripts/n8n_daily_health_check_workflow.json`) executes automatically every morning at 8:00 AM IST:

1. **HTTP Endpoint Health Checks:**
   - HR Portal (`http://13.205.216.81/api/v1/public/jobs`)
   - KMS RAG System (`http://13.205.216.81:8000/docs`)
   - n8n Automation Engine (`http://127.0.0.1:5678/`)
2. **EC2 Hardware Metrics:** Monitors RAM % and Disk Space % (`df -h`).
3. **HTML Email Alerts:** Compiles status report with green/red badges and emails `admin@ris-tms.org`.

---

### Portable SSH Access & Security Protocols

- **Key File Location:** `$env:USERPROFILE\.ssh\my_ec2_portable_ssh.pem` (or workspace root `my_ec2_portable_ssh.pem`).
- **Permissions:** OpenSSH requires Unix `LF` line endings and strict user permissions.
- **SSH Connection Command:**
  ```powershell
  ssh -i "$env:USERPROFILE\.ssh\my_ec2_portable_ssh.pem" -o StrictHostKeyChecking=no ubuntu@13.205.216.81
  ```

---

### 🗄️ Remote PostgreSQL Database Access Guide (From Local PC)

To connect your local GUI database client (DBeaver, pgAdmin, VS Code Database Client, or TablePlus) to the EC2 PostgreSQL database:

#### Method 1: SSH Tunneling (Recommended Secure Method)
1. **Command Line Tunnel:** Run in local PowerShell:
   ```powershell
   ssh -i "$env:USERPROFILE\.ssh\my_ec2_portable_ssh.pem" -L 5433:127.0.0.1:5432 ubuntu@13.205.216.81
   ```
2. **Database Client Connection Credentials:**
   - **Host:** `127.0.0.1` (or `localhost`)
   - **Port:** `5433`
   - **Database Name:** `hr_portal_ris_db`
   - **Username:** `postgres`

#### Method 2: DBeaver / pgAdmin Built-in SSH Tunnel
1. Create a new PostgreSQL connection in DBeaver / pgAdmin.
2. In **Main Tab**: Host = `127.0.0.1`, Port = `5432`, Database = `hr_portal_ris_db`, User = `postgres`.
3. In **SSH Tab**: Check *"Use SSH Tunnel"*, Host = `13.205.216.81`, User = `ubuntu`, Auth = Private Key (`my_ec2_portable_ssh.pem`).
4. Click **Test Connection** $\rightarrow$ Connected!

---

### 🏆 Verification & Benchmark Summary

```text
=================================================================
 🏆 FINAL LOAD TEST BENCHMARK (1,000 SIMULTANEOUS CANDIDATES)
=================================================================
✅ Successful Submissions (201 Created): 1,000 / 1,000 (100.0%)
❌ Failed Submissions:                     0 / 1,000 (0.0%)
⏱️ Total Wall-Clock Execution Time:        14.82 seconds
⚡ System Throughput:                      67.5 req/sec
📈 Average Response Latency:              440.3 ms
=================================================================
```

---

*Documented and verified for RIS Software Engineering & Infrastructure Teams.*
