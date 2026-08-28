# AWS RDS vs Amazon Aurora PostgreSQL Explained

This document clarifies the relationship between **AWS RDS** and **Amazon Aurora**, and explains how both options work with your **RIS HR & Career Portal**.

---

## 1. What Is the Difference Between AWS RDS and Amazon Aurora?

- **AWS RDS (Relational Database Service):**  
  AWS RDS is the **overarching managed service family** provided by AWS to manage relational databases. Standard RDS allows you to run traditional database engines like **RDS PostgreSQL** or **RDS MySQL** without managing underlying OS patches or manual backups.

- **Amazon Aurora (PostgreSQL-Compatible):**  
  Amazon Aurora is AWS's **enterprise, cloud-native database engine** built within the RDS service family. It is **100% compatible with PostgreSQL**, meaning your FastAPI + SQLAlchemy backend works with zero code changes, but it provides enterprise performance and instant auto-scaling.

```mermaid
flowchart TD
    subgraph RDS_Family["AWS RDS (Relational Database Service Family)"]
        StdRDS["Standard RDS PostgreSQL\n(Traditional PostgreSQL Engine)"]
        AuroraPG["Amazon Aurora PostgreSQL\n(High-Performance Cloud-Native Engine)"]
        AuroraServerless["Amazon Aurora Serverless v2\n(Auto-Scaling CPU & RAM)"]
    end

    FastAPI["FastAPI Backend (SQLAlchemy)"] -->|Identical PostgreSQL Protocol| StdRDS
    FastAPI -->|Identical PostgreSQL Protocol| AuroraPG
    FastAPI -->|Identical PostgreSQL Protocol| AuroraServerless
```

---

## 2. Comparison Matrix: Standard RDS vs Amazon Aurora

| Feature | Standard AWS RDS PostgreSQL | Amazon Aurora PostgreSQL | Amazon Aurora Serverless v2 |
| :--- | :--- | :--- | :--- |
| **SQL Compatibility** | 100% PostgreSQL | 100% PostgreSQL | 100% PostgreSQL |
| **Code Changes Required** | None | **None (Drop-in replacement)** | **None (Drop-in replacement)** |
| **Data Replication** | Dual AZ (2 copies) | **6 copies across 3 Availability Zones** | **6 copies across 3 Availability Zones** |
| **Failover Speed** | ~60 seconds | **< 30 seconds** | **< 15 seconds** |
| **Auto-Scaling RAM & CPU** | Manual instance resizing | Manual instance resizing | **Automatic real-time scaling** (Scales up during deadline traffic) |
| **Storage Auto-Expansion** | Configurable up to 64 TB | **Automatic (10 GB to 128 TB)** | **Automatic (10 GB to 128 TB)** |
| **Estimated Baseline Cost** | ~$30 – $50 / mo | ~$50 – $80 / mo | Pay per actual ACU usage (~$40–$70/mo) |

---

## 3. Which One Is Best for Your 1,000+ Applicant Portal?

### Option A: Amazon Aurora Serverless v2 (Recommended for Recruitment Deadlines)
- **Why it fits your portal:**  
  Recruitment portals experience **bursty traffic**. For 25 days of the month, traffic is light. On the final 3 days before application deadlines, **1,000+ applicants submit forms simultaneously**.
- **Aurora Serverless v2 Advantage:**  
  During light traffic, Aurora automatically shrinks to 0.5 ACU (minimal cost). When 1,000 applicants hit the site at deadline, Aurora instantly expands CPU and RAM in real time to process all submissions without crashing!

### Option B: Standard AWS RDS PostgreSQL (`db.t4g.medium`)
- **Why it fits your portal:**  
  Predictable, lower cost starting point with automated daily snapshots and point-in-time recovery.

---

## 4. Connection String (`DATABASE_URL`) Format

Both options use the exact same SQLAlchemy PostgreSQL connection format in your `backend/.env`:

```env
# Standard RDS PostgreSQL:
DATABASE_URL=postgresql://hr_admin:YourPassword@ris-db.c123456789.ap-south-1.rds.amazonaws.com:5432/ris_db

# Amazon Aurora PostgreSQL / Aurora Serverless:
DATABASE_URL=postgresql://hr_admin:YourPassword@ris-aurora-cluster.cluster-c123456789.ap-south-1.rds.amazonaws.com:5432/ris_db
```
