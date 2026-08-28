# AWS EC2 + AWS S3 + AWS RDS Production Deployment Guide

This guide details how to deploy the **RIS HR & Career Portal** using your **AWS Account**, utilizing **AWS EC2**, **AWS S3**, and **AWS RDS PostgreSQL** for a cost-effective, high-performance production environment capable of serving 1,000+ applicants.

---

## AWS Infrastructure Architecture

```mermaid
flowchart TD
    subgraph Internet["Public Internet"]
        Users["Applicants & HR Admins"]
    end

    subgraph AWS_Account["Your AWS Account"]
        subgraph DNS_SSL["DNS & Security"]
            R53["Route 53 / Domain"]
            ACM["Let's Encrypt / ACM SSL"]
        end

        subgraph EC2_Server["AWS EC2 Instance (Ubuntu / Linux)"]
            Nginx["Nginx Reverse Proxy (Port 80/443)"]
            StaticFE["React Static Assets (/dist)"]
            Gunicorn["Gunicorn + Uvicorn Workers (Port 8000)"]
            Systemd["Systemd Service Supervisor"]
            IAMRole["EC2 IAM Instance Profile"]

            Nginx -->|Serves| StaticFE
            Nginx -->|Proxy /api/*| Gunicorn
            Systemd -->|Manages| Gunicorn
        end

        subgraph AWS_Managed["AWS Managed Services"]
            RDS[("AWS RDS PostgreSQL")]
            S3["AWS S3 Bucket (Resumes & Uploads)"]
        end
    end

    Users -->|HTTPS| Nginx
    Gunicorn -->|DB Queries| RDS
    Gunicorn -->|Upload Resumes| IAMRole
    IAMRole -->|IAM Auth| S3
```

---

## Step 1: AWS S3 Bucket Setup & IAM Role Security

### 1. Configure S3 Bucket
1. Open **AWS S3 Console** $\rightarrow$ Create bucket: `ris-hr-portal-resumes-prod`.
2. Enable **Block all public access** (Access will be managed securely via IAM).
3. Under **CORS configuration**, paste:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST"],
           "AllowedOrigins": ["https://your-domain.org", "http://localhost:5173"],
           "ExposeHeaders": ["ETag"]
       }
   ]
   ```

### 2. Attach IAM Role to EC2 (No Hardcoded Access Keys Needed!)
1. Go to **AWS IAM Console** $\rightarrow$ **Roles** $\rightarrow$ Create Role.
2. Select Trusted Entity: **AWS Service $\rightarrow$ EC2**.
3. Attach Policy: `AmazonS3FullAccess` (or custom policy for `s3://ris-hr-portal-resumes-prod/*`).
4. Name role: `EC2-S3-HR-Portal-Role`.
5. Attach this IAM Role to your EC2 instance (**EC2 Console $\rightarrow$ Actions $\rightarrow$ Security $\rightarrow$ Modify IAM role**).

---

## Step 2: AWS EC2 Server Setup (FastAPI + Nginx)

Connect to your EC2 instance via SSH:
```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git curl
```

### 2. Clone Codebase & Setup Python Environment
```bash
cd /var/www
sudo git clone https://github.com/your-org/HR_RIS.git
sudo chown -R ubuntu:ubuntu /var/www/HR_RIS
cd /var/www/HR_RIS/backend

# Create Virtual Environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn uvicorn psycopg2-binary boto3
```

### 3. Configure Production Environment File (`backend/.env`)
Create `/var/www/HR_RIS/backend/.env`:
```env
DATABASE_URL=postgresql://hr_db_user:YourSecurePassword@your-rds-endpoint.rds.amazonaws.com:5432/ris_db
S3_BUCKET_NAME=ris-hr-portal-resumes-prod
AWS_REGION=ap-south-1
JWT_SECRET=super_secret_production_key_change_me_12345
ALLOWED_ORIGINS=https://your-domain.org,http://your-ec2-public-ip
```

---

## Step 3: Configure Gunicorn Systemd Service Supervisor

Create systemd service file:
```bash
sudo nano /etc/systemd/system/hr_backend.service
```

Paste the following configuration:
```ini
[Unit]
Description=FastAPI Gunicorn Backend Service for RIS HR Portal
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/HR_RIS/backend
EnvironmentFile=/var/www/HR_RIS/backend/.env
ExecStart=/var/www/HR_RIS/backend/venv/bin/gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/hr_backend_access.log \
    --error-logfile /var/log/hr_backend_error.log \
    main:app

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start backend service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hr_backend
sudo systemctl start hr_backend
sudo systemctl status hr_backend
```

---

## Step 4: React Frontend Build & Nginx Reverse Proxy Setup

### 1. Build React Static Production Bundle
On your local machine or EC2:
```bash
# In frontend root directory:
npm run build
```
Upload or copy `dist/` folder to EC2: `/var/www/HR_RIS/dist`.

### 2. Configure Nginx Web Server
Create Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/hr_portal
```

Paste configuration:
```nginx
server {
    listen 80;
    server_name your-domain.org <your-ec2-ip>;

    # Frontend Static Assets
    location / {
        root /var/www/HR_RIS/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase upload body limit for large resume PDFs (15MB)
        client_max_body_size 15M;
    }
}
```

Enable site & test Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hr_portal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 5: Enable Free SSL Certificate (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.org
```

---

## Verification & Deployment Checklist

- [ ] EC2 IAM Instance profile attached to instance.
- [ ] AWS RDS PostgreSQL connected & migrated.
- [ ] Gunicorn running via Systemd (`sudo systemctl status hr_backend`).
- [ ] Nginx serving React frontend on port 80/443.
- [ ] Test candidate application submission & check resume upload in S3 bucket console.
