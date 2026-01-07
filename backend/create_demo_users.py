"""
Create demo users for testing authentication
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, User, UserRole
from app.auth import get_password_hash

def create_demo_users():
    """Create demo users for testing"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Users already exist ({existing_users} users found). Skipping creation.")
            return
        
        # Demo users
        demo_users = [
            {
                "email": "demo@example.com",
                "full_name": "Demo User",
                "password": "demo123",
                "role": UserRole.OWNER
            },
            {
                "email": "manager@example.com",
                "full_name": "Manager User",
                "password": "manager123",
                "role": UserRole.MANAGER
            },
            {
                "email": "staff@example.com",
                "full_name": "Staff User",
                "password": "staff123",
                "role": UserRole.STAFF
            }
        ]
        
        # Create users
        for user_data in demo_users:
            hashed_password = get_password_hash(user_data["password"])
            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hashed_password,
                role=user_data["role"],
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print("✅ Demo users created successfully!")
        print()
        print("Login credentials:")
        print("==================")
        for user_data in demo_users:
            print(f"Role: {user_data['role'].value}")
            print(f"Email: {user_data['email']}")
            print(f"Password: {user_data['password']}")
            print("---")
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_users()