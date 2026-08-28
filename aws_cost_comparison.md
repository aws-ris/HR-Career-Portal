# AWS Monthly Cost Estimation & Comparison

This document provides a detailed breakdown of estimated monthly AWS costs for the **RIS HR & Career Portal**, comparing **Standard AWS RDS PostgreSQL**, **Amazon Aurora Serverless v2**, and **EC2 Self-Hosted PostgreSQL**, both **including and excluding your existing EC2 instance**.

---

## Cost Comparison Summary Table

*(Estimates based on AWS Asia Pacific - Mumbai region `ap-south-1`)*

| Architecture Setup | Database Engine | Monthly Cost (Excluding EC2 — using your running EC2) | Monthly Cost (Including new `t4g.small` EC2) | Best Suited For |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Minimal Cost Setup** | PostgreSQL hosted on **Existing EC2** | **~$2.00 / month** (₹165) | **~$17.00 / month** (₹1,400) | Tight budget, low to medium traffic |
| **Option 2: Standard Production** | **Standard AWS RDS PostgreSQL** (`db.t4g.micro/small`) | **~$18.00 – $34.00 / month** (₹1,500 – ₹2,800) | **~$33.00 – $49.00 / month** (₹2,700 – ₹4,000) | Standard production, automatic daily backups |
| **Option 3: Enterprise Auto-Scaling** | **Amazon Aurora Serverless v2** (Auto-scales 0.5–2 ACUs) | **~$38.00 – $58.00 / month** (₹3,100 – ₹4,800) | **~$53.00 – $73.00 / month** (₹4,300 – ₹6,000) | Heavy bursty traffic (1,000+ applicants at deadline) |

---

## Detailed Itemized Breakdown

### 1. Fixed & Low-Cost Components (Shared Across All Options)

| Service | Configuration | Estimated Monthly Cost |
| :--- | :--- | :--- |
| **Existing EC2 Instance** | Already running in your account | **$0.00** |
| **New EC2 Instance (If created)** | `t4g.small` (2 vCPU, 2 GB RAM, ARM Graviton) | ~$15.00 / month |
| **AWS S3 Bucket (Resumes & FE)** | ~20 GB storage + GET/PUT requests | ~$0.50 – $1.50 / month |
| **AWS CloudFront CDN** | 100 GB Data Transfer (Free Tier includes 1 TB/mo) | **$0.00** (Free Tier) |
| **AWS Route 53 DNS** | Hosted Zone for custom domain | ~$0.50 / month |
| **AWS Certificate Manager (ACM)** | SSL / HTTPS Certificate | **$0.00** (Free) |

---

### 2. Database Cost Breakdown (Excluding Existing EC2)

#### Option 1: PostgreSQL on Existing EC2 ($0 Extra DB Cost)
- **Database Cost:** $0.00 (Installed directly on your existing EC2 instance).
- **S3 & DNS Cost:** ~$2.00 / month.
- **Total Monthly Cost (Excluding EC2):** **~$2.00 / month** (approx ₹165 / month).

#### Option 2: Standard AWS RDS PostgreSQL (`db.t4g.micro` or `db.t4g.small`)
- **RDS Instance (`db.t4g.micro` - 1 vCPU, 1 GB RAM):** ~$13.50 / month.
- **RDS Storage (20 GB gp3 SSD):** ~$2.50 / month.
- **Automated S3 Backups:** ~$1.00 / month.
- **S3 & DNS Cost:** ~$2.00 / month.
- **Total Monthly Cost (Excluding EC2):** **~$19.00 / month** (approx ₹1,560 / month).
- *(If upgraded to `db.t4g.small` 2GB RAM: Total ~$34.00 / month)*

#### Option 3: Amazon Aurora Serverless v2
- **Aurora Compute (Scales 0.5 ACU baseline to 2.0 ACU during deadline burst):** ~$32.00 – $48.00 / month.
- **Aurora Storage (Auto-expanding gp3 storage):** ~$3.00 / month.
- **Automated Backups & WAL Streaming:** ~$2.00 / month.
- **S3 & DNS Cost:** ~$2.00 / month.
- **Total Monthly Cost (Excluding EC2):** **~$39.00 – $55.00 / month** (approx ₹3,200 – ₹4,500 / month).

---

## Recommendation & Savings Strategy

1. **For Development & Initial Rollout (Lowest Cost):**  
   Use **Option 1** (Install PostgreSQL directly on your existing EC2 instance + AWS S3 for resumes). Your total additional AWS cost will be less than **$2.00 / month**!

2. **For Production Readiness (Recommended Balance):**  
   Use **Option 2** (**Standard AWS RDS PostgreSQL `db.t4g.micro`**). For **~$19.00 / month**, you get dedicated database isolation, automated daily backups, and Point-In-Time Recovery without overspending.

3. **For High-Volume Deadline Bursts (Maximum Reliability):**  
   Upgrade to **Option 3** (**Amazon Aurora Serverless v2**) during peak recruitment cycles so the database automatically expands RAM and CPU to handle 1,000+ simultaneous applicant submissions without crashing.
