"""
Authentication API endpoints
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User
from ..schemas import UserLogin, UserResponse, Token
from ..auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user and return JWT token"""
    print(f"🔐 Login attempt for email: {user_login.email}")
    
    user = authenticate_user(db, user_login.email, user_login.password)
    if not user:
        print(f"❌ Authentication failed for: {user_login.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Authentication successful for: {user_login.email}, role: {user.role}")
    
    # Update last login
    user.last_login = func.now()
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat(),
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }


@router.post("/logout")
async def logout():
    """Logout user (client should discard token)"""
    return {"message": "Logged out successfully"}