"""
Cost Master Data API Routes
FastAPI endpoints for Cost Centers and Cost Elements management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from ..database import get_db, get_current_user_role, UserRole
from ..models import CostCenter, CostElement
from ..schemas import (
    CreateCostCenterRequest, UpdateCostCenterRequest, CostCenterResponse,
    CreateCostElementRequest, UpdateCostElementRequest, CostElementResponse
)

router = APIRouter(prefix="/master-data", tags=["master-data"])


# Cost Centers
@router.get("/cost-centers", response_model=List[CostCenterResponse])
def list_cost_centers(
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """Get list of cost centers with optional active filter"""
    query = db.query(CostCenter)
    
    if active is not None:
        query = query.filter(CostCenter.is_active == active)
    
    cost_centers = query.order_by(CostCenter.code).all()
    return cost_centers


@router.post("/cost-centers", response_model=CostCenterResponse)
def create_cost_center(
    request: CreateCostCenterRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """Create new cost center (Owner/Manager only)"""
    # RBAC: Only Owner/Manager can create
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot create cost centers"
        )
    
    try:
        cost_center = CostCenter(
            code=request.code,
            name=request.name
        )
        
        db.add(cost_center)
        db.commit()
        db.refresh(cost_center)
        
        return cost_center
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Cost center with code '{request.code}' already exists"
        )


@router.patch("/cost-centers/{cost_center_id}", response_model=CostCenterResponse)
def update_cost_center(
    cost_center_id: int,
    request: UpdateCostCenterRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """Update cost center (Owner/Manager only)"""
    # RBAC: Only Owner/Manager can update
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot update cost centers"
        )
    
    cost_center = db.query(CostCenter).filter(CostCenter.id == cost_center_id).first()
    if not cost_center:
        raise HTTPException(status_code=404, detail="Cost center not found")
    
    # Update fields
    if request.name is not None:
        cost_center.name = request.name
    if request.is_active is not None:
        cost_center.is_active = request.is_active
    
    db.commit()
    db.refresh(cost_center)
    
    return cost_center


# Cost Elements
@router.get("/cost-elements", response_model=List[CostElementResponse])
def list_cost_elements(
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """Get list of cost elements with optional active filter"""
    query = db.query(CostElement)
    
    if active is not None:
        query = query.filter(CostElement.is_active == active)
    
    cost_elements = query.order_by(CostElement.code).all()
    return cost_elements


@router.post("/cost-elements", response_model=CostElementResponse)
def create_cost_element(
    request: CreateCostElementRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """Create new cost element (Owner/Manager only)"""
    # RBAC: Only Owner/Manager can create
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot create cost elements"
        )
    
    try:
        cost_element = CostElement(
            code=request.code,
            name=request.name
        )
        
        db.add(cost_element)
        db.commit()
        db.refresh(cost_element)
        
        return cost_element
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Cost element with code '{request.code}' already exists"
        )


@router.patch("/cost-elements/{cost_element_id}", response_model=CostElementResponse)
def update_cost_element(
    cost_element_id: int,
    request: UpdateCostElementRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """Update cost element (Owner/Manager only)"""
    # RBAC: Only Owner/Manager can update
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot update cost elements"
        )
    
    cost_element = db.query(CostElement).filter(CostElement.id == cost_element_id).first()
    if not cost_element:
        raise HTTPException(status_code=404, detail="Cost element not found")
    
    # Update fields
    if request.name is not None:
        cost_element.name = request.name
    if request.is_active is not None:
        cost_element.is_active = request.is_active
    
    db.commit()
    db.refresh(cost_element)
    
    return cost_element