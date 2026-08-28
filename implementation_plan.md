# Deployment Implementation Plan — AWS EC2 (`t3.large`) + S3

This document details the production deployment execution plan for the **RIS HR & Career Portal** on your **`t3.large` EC2 instance (8 GB RAM)** with **Self-Hosted PostgreSQL**, **AWS S3** for resume PDFs/backups, and **Nginx + Gunicorn** for high-concurrency applicant processing.

---

## User Review Required

> [!IMPORTANT]
> **Selected Architecture:**
> - **Server:** Existing AWS EC2 `t3.large` Instance (Ubuntu / Linux, 2 vCPUs, 8 GB RAM).
> - **Database:** PostgreSQL 15+ installed directly on EC2 (`ris_db` on port 5432).
> - **File Storage:** AWS S3 Bucket (`ris-hr-portal-resumes-prod`) for PDF resumes & automated daily database backup `.sql.gz` snapshots.
> - **Process Supervisor:** Systemd managing Gunicorn with 4 Uvicorn ASGI workers.
> - **Web Server & SSL:** Nginx reverse proxy with Certbot (Let's Encrypt HTTPS).

---

## Target Deployment Architecture

```mermaid
flowchart TD
    subgraph Applicants["Applicants & HR Admins"]
        Users["📱 / 💻 Web Browser"]
    end

    subgraph AWS_EC2["Your EC2 t3.large Instance (8 GB RAM)"]
        Nginx["Nginx Web Server (Port 80 / 443 HTTPS)"]
        ReactDist["React Static Frontend Build (/dist)"]
        Gunicorn["Gunicorn + 4 Uvicorn Workers (Port 8000)"]
        Systemd["Systemd Service Supervisor"]
        Postgres[("Local PostgreSQL Engine (ris_db)")]
        BackupCron["Daily Midnight Cron Script"]

        Nginx -->|Serves Static Files| ReactDist
        Nginx -->|Proxy /api/*| Gunicorn
        Systemd -->|Supervises| Gunicorn
        Gunicorn -->|Local Sockets < 1ms| Postgres
    end

    subgraph AWS_S3["AWS S3 Bucket (ris-hr-portal-resumes-prod)"]
        PDFs["Candidate Resume PDFs"]
        Backups["Daily DB Snapshots (.sql.gz)"]
    end

    Users -->|HTTPS| Nginx
    Gunicorn -->|Upload Resumes| PDFs
    BackupCron -->|Upload Snapshots| Backups
```

---

## Step-by-Step Deployment Phases

### Phase 1: Repository Configuration Files Preparation (Local Workspace)

Create operational scripts and configuration files in the project repository:
1. `backend/scripts/backup_db_to_s3.sh` — Automated database dump & S3 backup script.
2. `backend/scripts/hr_backend.service` — Systemd service unit file.
3. `backend/scripts/nginx_hr_portal.conf` — Nginx reverse proxy configuration.
4. `backend/.env.production.example` — Environment variable template.

---

### Phase 2: AWS S3 Bucket & IAM Security Role Setup

1. **S3 Bucket Creation:**
   - Create S3 bucket: `ris-hr-portal-resumes-prod` in `ap-south-1` region.
   - Block all public internet access (access managed securely via IAM).
2. **IAM Instance Profile Role:**
   - Create IAM Role: `EC2-S3-HR-Portal-Role` with `AmazonS3FullAccess` policy for bucket `ris-hr-portal-resumes-prod`.
   - Attach IAM Role to your `t3.large` EC2 instance (**EC2 Console $\rightarrow$ Actions $\rightarrow$ Security $\rightarrow$ Modify IAM role**).

---

### Phase 3: EC2 Server Initialization & PostgreSQL Provisioning

Connect to EC2 instance via SSH:
```bash
ssh -i your-key.pem ubuntu@<your-ec2-ip>
```

1. **Install Packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y postgresql postgresql-contrib python3-pip python3-venv nginx git curl certbot python3-certbot-nginx awscli
   ```

2. **Configure Local PostgreSQL Database:**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE ris_db;"
   sudo -u postgres psql -c "CREATE USER hr_user WITH PASSWORD 'YourSecurePassword123!';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ris_db TO hr_user;"
   sudo -u postgres psql -d ris_db -c "GRANT ALL ON SCHEMA public TO hr_user;"
   ```

3. **Deploy Backend Application Code:**
   ```bash
   cd /var/www
   sudo git clone https://github.com/your-org/HR_RIS.git
   sudo chown -R ubuntu:ubuntu /var/www/HR_RIS
   cd /var/www/HR_RIS/backend

   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn uvicorn psycopg2-binary boto3 openpyxl
   ```

4. **Environment Variables (`/var/www/HR_RIS/backend/.env`):**
   ```env
   DATABASE_URL=postgresql://hr_user:YourSecurePassword123!@localhost:5432/ris_db
   S3_BUCKET_NAME=ris-hr-portal-resumes-prod
   AWS_REGION=ap-south-1
   JWT_SECRET=production_jwt_secret_key_change_me_12345
   ALLOWED_ORIGINS=https://your-domain.org,http://your-ec2-ip
   ```

---

### Phase 4: Process Supervision & Web Server Setup

1. **Gunicorn Systemd Service:**
   Copy `hr_backend.service` to `/etc/systemd/system/hr_backend.service`:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable hr_backend
   sudo systemctl start hr_backend
   sudo systemctl status hr_backend
   ```

2. **React Frontend Build:**
   Compile React static production bundle:
   ```bash
   cd /var/www/HR_RIS
   npm run build
   ```

3. **Nginx Web Server & SSL Configuration:**
   Copy `nginx_hr_portal.conf` to `/etc/nginx/sites-available/hr_portal`:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hr_portal /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   
   # SSL Certificate:
   sudo certbot --nginx -d your-domain.org
   ```

---

### Phase 5: Automated Daily Backups & Verification

1. **Schedule S3 Database Backup Cron Job:**
   ```bash
   sudo cp /var/www/HR_RIS/backend/scripts/backup_db_to_s3.sh /usr/local/bin/backup_db_to_s3.sh
   sudo chmod +x /usr/local/bin/backup_db_to_s3.sh
   
   # Schedule midnight backup:
   (crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/backup_db_to_s3.sh > /dev/null 2>&1") | crontab -
   ```

2. **End-to-End Verification Checklist:**
   - [ ] Verify `HTTP 200 OK` on `https://your-domain.org`.
   - [ ] Submit candidate application form & check resume PDF in S3 bucket.
   - [ ] Log in to HR Admin portal & inspect candidate profile.
   - [ ] Download candidate roster 67-column Detailed Excel export (`.xlsx`).
   - [ ] Test manual backup script execution (`sudo /usr/local/bin/backup_db_to_s3.sh`).
