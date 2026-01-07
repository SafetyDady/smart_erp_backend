"""
Phase 13B: Database Configuration
PostgreSQL setup with production safety guards
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, UserRole

# Environment variables with defaults
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./smart_erp.db"  # SQLite for development, PostgreSQL for production
)

# Production safety: disable create_all in production
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOW_CREATE_ALL = ENVIRONMENT != "production"

# Low stock threshold configuration
LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "10"))

# Create engine with connection pooling
if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=ENVIRONMENT == "development"  # SQL logging in dev only
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=ENVIRONMENT == "development"  # SQL logging in dev only
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    """
    Create database tables if in development environment
    NEVER run in production - use migrations instead
    """
    if ALLOW_CREATE_ALL:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created (development mode)")
    else:
        print("⚠️ Table creation disabled in production mode")


def get_db():
    """
    Dependency to get database session
    Ensures proper session cleanup
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Mock user-role mapping (replace with real auth in production)
USER_ROLE_MAP = {
    "user_owner": "owner",
    "user_manager": "manager", 
    "user_staff": "staff"
}


def get_user_role(user_id: str) -> str:
    """
    Server-side role resolution (mock implementation)
    In production: query from auth service/database
    
    Args:
        user_id: User identifier from X-User-ID header
        
    Returns:
        User role string
        
    Raises:
        ValueError: If user not found
    """
    role = USER_ROLE_MAP.get(user_id)
    if not role:
        raise ValueError(f"User {user_id} not found or has no role")
    return role


def get_current_user_role() -> UserRole:
    """
    Dependency for getting current user role
    
    Mock implementation - returns OWNER role for development
    In production, this should integrate with your auth system
    """
    # Mock: Always return OWNER for development
    return UserRole.OWNER