#!/bin/bash
# Automated Daily Database Backup Script for RIS HR Portal
BACKUP_DIR="/tmp/db_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ris_db_backup_$TIMESTAMP.sql.gz"
S3_BUCKET="${S3_BUCKET_NAME:-ris-hr-portal-resumes-prod}"

mkdir -p $BACKUP_DIR

# 1. Dump compressed database
pg_dump -h localhost -U hr_user -d ris_db | gzip > $BACKUP_FILE

# 2. Upload snapshot to AWS S3 bucket
aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/db_backups/ris_db_backup_$TIMESTAMP.sql.gz

# 3. Clean local temp files older than 3 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +3 -delete
