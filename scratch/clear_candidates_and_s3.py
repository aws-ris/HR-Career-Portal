import os
import sys
import boto3
from sqlalchemy import text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def clear_candidates_and_s3():
    print("=== STARTING CANDIDATE & S3 PURGE PROCESS ===")
    
    # 1. Clear AWS S3 Resume Objects
    S3_BUCKET = os.getenv("S3_BUCKET_NAME")
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "ap-south-1")

    if S3_BUCKET:
        print(f"Connecting to S3 Bucket: {S3_BUCKET}...")
        try:
            s3_kwargs = {"region_name": aws_region}
            if aws_access_key and aws_secret_key:
                s3_kwargs["aws_access_key_id"] = aws_access_key
                s3_kwargs["aws_secret_access_key"] = aws_secret_key
            
            s3_client = boto3.client('s3', **s3_kwargs)
            paginator = s3_client.get_paginator('list_objects_v2')
            
            deleted_count = 0
            for page in paginator.paginate(Bucket=S3_BUCKET):
                if 'Contents' in page:
                    objects = [{'Key': obj['Key']} for obj in page['Contents']]
                    if objects:
                        s3_client.delete_objects(
                            Bucket=S3_BUCKET,
                            Delete={'Objects': objects}
                        )
                        deleted_count += len(objects)
            print(f"Successfully deleted {deleted_count} object(s) from S3 bucket '{S3_BUCKET}'.")
        except Exception as e:
            print(f"Warning: S3 purge error: {e}")
    else:
        print("No S3_BUCKET_NAME specified in environment, skipping S3 purge.")

    # 2. Database Purge
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
    try:
        from database.database import SessionLocal
        db = SessionLocal()
        print("Connected to database. Truncating candidate tables...")
        
        tables_to_clear = [
            "candidate_resume_payload",
            "application_status_history",
            "application_tracking",
            "candidate_schooling",
            "candidate_higher_education",
            "candidate_publications",
            "candidate_work_experience",
            "candidate_links_about",
            "token_registry",
            "candidate_metadata"
        ]

        is_sqlite = "sqlite" in str(db.bind.url)

        if is_sqlite:
            for tbl in tables_to_clear:
                db.execute(text(f"DELETE FROM {tbl};"))
        else:
            db.execute(text(f"TRUNCATE TABLE {', '.join(tables_to_clear)} CASCADE;"))
            
        db.commit()
        print("Database tables cleared successfully!")
        db.close()
    except Exception as e:
        print(f"Database purge error: {e}")
        
    print("=== PURGE COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    clear_candidates_and_s3()
