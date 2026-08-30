import sys
import os
import argparse

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal, engine
from database import models
from utils.auth import hash_password

def create_or_reset_admin(username, password, full_name="HR Administrator", email=None):
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(models.AdminUser).filter(models.AdminUser.username == username).first()
        if admin:
            admin.password_hash = hash_password(password)
            if full_name:
                admin.full_name = full_name
            if email:
                admin.email = email
            db.commit()
            print(f"✅ Password reset successfully for admin user '{username}'!")
        else:
            admin = models.AdminUser(
                username=username,
                password_hash=hash_password(password),
                full_name=full_name,
                email=email
            )
            db.add(admin)
            db.commit()
            print(f"✅ Created new admin user '{username}' successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error managing admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage HR Portal Admin Accounts")
    parser.add_argument("--username", default="hr_ris", help="Admin username")
    parser.add_argument("--password", required=True, help="New password for admin")
    parser.add_argument("--name", default="HR Administrator", help="Full name")
    parser.add_argument("--email", default=None, help="Email address")
    args = parser.parse_args()

    create_or_reset_admin(args.username, args.password, args.name, args.email)
