#!/bin/bash
# Local Database Backup Script for HR Portal
BACKUP_DIR="/var/backups/hr_portal_db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/hr_portal_ris_db_$TIMESTAMP.sql.gz"

sudo mkdir -p $BACKUP_DIR
sudo chown -R ubuntu:ubuntu $BACKUP_DIR

# Dump compressed database
PGPASSWORD='Ris@1234' pg_dump -h localhost -U hr_portal_user -d hr_portal_ris_db | gzip > $BACKUP_FILE

echo "Backup created successfully at: $BACKUP_FILE"

# Clean backups older than 14 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -delete
