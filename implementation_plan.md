# Full Deployment Implementation Plan — AWS S3 Frontend + AWS EC2 Backend

This document details the complete end-to-end implementation plan for deploying the **RIS HR & Career Portal** today using **AWS S3 Static Website Hosting** for the Frontend, **AWS EC2 (`t3.large`)** with **Self-Hosted PostgreSQL** for the Backend API, **AWS S3** for candidate resume storage, and **GitHub Actions** for automated CI/CD.

---

## User Review Required

> [!IMPORTANT]
> **Production Target Setup (No Custom Domain Needed Today):**
> - **Frontend Hosting:** AWS S3 Bucket Static Website Hosting (`http://ris-hr-frontend-prod.s3-website.ap-south-1.amazonaws.com`).
> - **Backend API & Database:** AWS EC2 `t3.large` Instance (`http://<YOUR-EC2-PUBLIC-IP>:8000` or Nginx proxy on port 80).
> - **Resume PDF Storage:** AWS S3 Bucket (`ris-hr-portal-resumes-prod`).
> - **Automated CI/CD Pipeline:** GitHub Actions (`.github/workflows/deploy.yml`) builds React UI, syncs static bundle directly to S3, and updates EC2 backend via SSH.

---

## Architecture & Data Flow Diagram

```mermaid
flowchart TD
    subgraph Applicants["Applicants & HR Admins"]
        Users["📱 / 💻 Web Browser"]
    end

    subgraph GitHub["GitHub Repository"]
        Actions["GitHub Actions CI/CD Pipeline (.github/workflows/deploy.yml)"]
    end

    subgraph AWS_Cloud["AWS Account (ap-south-1)"]
        subgraph Frontend_Tier["Frontend Tier (S3 Static Hosting)"]
            S3_FE["AWS S3 Bucket: ris-hr-frontend-prod\n(http://ris-hr-frontend-prod.s3-website.ap-south-1.amazonaws.com)"]
        end

        subgraph Backend_Tier["Backend & Data Tier (EC2 t3.large)"]
            Nginx["Nginx Web Server (Port 80)"]
            Gunicorn["Gunicorn + 4 Uvicorn Workers (Port 8000)"]
            Systemd["Systemd Supervisor (hr_backend.service)"]
            Postgres[("Local PostgreSQL (ris_db)")]
            BackupCron["Daily Midnight Cron Script"]
        end

        subgraph Storage_Tier["Resume Storage Tier"]
            S3_PDFs["AWS S3 Bucket: ris-hr-portal-resumes-prod\n(Private Candidate Resumes & DB Backups)"]
        end
    end

    Users -->|1. Load UI (S3 Website Domain)| S3_FE
    Users -->|2. REST API Requests| Nginx
    Nginx --> Gunicorn
    Gunicorn --> Postgres
    Gunicorn -->|Upload Resumes| S3_PDFs
    BackupCron -->|Upload Snapshots| S3_PDFs
    
    Actions -->|Sync Build dist/| S3_FE
    Actions -->|SSH Code Update| Backend_Tier
```

---

## Phase 1: Local Workspace Preparation & CI/CD Pipeline Configuration

### 1. Update Frontend API Endpoint (`.env.production`)
Create `.env.production` in project root:
```env
VITE_API_URL=http://<YOUR-EC2-PUBLIC-IP>
```

### 2. Configure GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)
The workflow handles dual deployment:
- Builds React bundle and uploads directly to S3 Frontend Bucket (`aws s3 sync`).
- SSH into EC2, pulls backend code, and restarts Gunicorn backend service.

---

## Phase 2: AWS S3 Buckets & IAM Role Setup

### 1. Create S3 Frontend Website Bucket (`ris-hr-frontend-prod`)
1. In AWS S3 Console, create bucket `ris-hr-frontend-prod`.
2. Under **Properties** $\rightarrow$ Enable **Static website hosting** (Index document: `index.html`).
3. Under **Permissions** $\rightarrow$ Turn off **Block all public access** (for static frontend bucket).
4. Add S3 Bucket Policy to allow public read:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::ris-hr-frontend-prod/*"
           }
       ]
   }
   ```

### 2. Create Private S3 Resumes & Backups Bucket (`ris-hr-portal-resumes-prod`)
1. Create bucket `ris-hr-portal-resumes-prod`.
2. Keep **Block all public access** ENABLED.
3. Configure CORS policy for frontend domain:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": ["ETag"]
       }
   ]
   ```

### 3. Attach IAM Role to EC2 (`EC2-S3-HR-Portal-Role`)
Attach IAM role with `AmazonS3FullAccess` policy to your EC2 instance so FastAPI can upload PDF resumes to S3 without hardcoded keys.

---

## Phase 3: EC2 Server Initialization & Backend Provisioning

Connect to EC2 via SSH:
```bash
ssh -i your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

1. **Install Packages:**
   ```bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib python3-pip python3-venv nginx git curl awscli
   ```

2. **Setup PostgreSQL Database:**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE ris_db;"
   sudo -u postgres psql -c "CREATE USER hr_user WITH PASSWORD 'YourSecurePassword123!';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ris_db TO hr_user;"
   sudo -u postgres psql -d ris_db -c "GRANT ALL ON SCHEMA public TO hr_user;"
   ```

3. **Deploy Backend Repository & Python Virtual Environment:**
   ```bash
   cd /var/www
   sudo git clone https://github.com/your-org/HR_RIS.git
   sudo chown -R ubuntu:ubuntu /var/www/HR_RIS
   cd /var/www/HR_RIS/backend

   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt gunicorn uvicorn psycopg2-binary boto3 openpyxl
   ```

4. **Environment Variables (`/var/www/HR_RIS/backend/.env`):**
   ```env
   DATABASE_URL=postgresql://hr_user:YourSecurePassword123!@localhost:5432/ris_db
   S3_BUCKET_NAME=ris-hr-portal-resumes-prod
   AWS_REGION=ap-south-1
   JWT_SECRET=production_jwt_secret_key_12345
   ALLOWED_ORIGINS=*
   ```

5. **Start Systemd Supervisor & Nginx Proxy:**
   ```bash
   sudo cp /var/www/HR_RIS/backend/scripts/hr_backend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now hr_backend

   sudo cp /var/www/HR_RIS/backend/scripts/nginx_hr_portal.conf /etc/nginx/sites-available/hr_portal
   sudo ln -s /etc/nginx/sites-available/hr_portal /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl restart nginx
   ```

6. **Schedule S3 Database Backup Cron:**
   ```bash
   sudo cp /var/www/HR_RIS/backend/scripts/backup_db_to_s3.sh /usr/local/bin/
   sudo chmod +x /usr/local/bin/backup_db_to_s3.sh
   (crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/backup_db_to_s3.sh > /dev/null 2>&1") | crontab -
   ```

---

## Phase 4: CI/CD Pipeline & End-to-End Verification

1. **Configure GitHub Repository Secrets:**
   - `AWS_ACCESS_KEY_ID`: AWS Access Key for S3 Sync
   - `AWS_SECRET_ACCESS_KEY`: AWS Secret Access Key for S3 Sync
   - `EC2_HOST`: `<YOUR-EC2-PUBLIC-IP>`
   - `EC2_USERNAME`: `ubuntu`
   - `EC2_SSH_KEY`: Content of `.pem` SSH Private Key

2. **Live System Testing:**
   - Open S3 static website URL in browser.
   - Complete 5-step candidate application & submit.
   - Check candidate resume PDF in private S3 bucket console.
   - Log into HR admin panel, view candidate full profile drawer, and download 67-column Detailed Excel export (`.xlsx`).
