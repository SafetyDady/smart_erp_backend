"""
Work Order API endpoints
MVP implementation with CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from ..database import get_db
from ..auth import get_current_user
from ..models import WorkOrder, User, StockMovement, Product
from ..schemas import (
    CreateWorkOrderRequest,
    UpdateWorkOrderRequest, 
    WorkOrderResponse,
    WorkOrderListResponse
)

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])


def check_manager_or_owner(current_user: User = Depends(get_current_user)) -> User:
    """Check if user is manager or owner"""
    if current_user.role.value not in ["manager", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Manager or Owner role required."
        )
    return current_user


@router.get("/")
async def list_work_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of work orders - all roles can view"""
    work_orders = db.query(WorkOrder).order_by(WorkOrder.created_at.desc()).all()
    # Convert to dict to avoid Pydantic issues
    result = []
    for wo in work_orders:
        result.append({
            "id": wo.id,
            "wo_number": wo.wo_number,
            "title": wo.title,
            "status": wo.status.value,
            "cost_center": wo.cost_center,
            "cost_element": wo.cost_element,
            "created_at": wo.created_at.isoformat()
        })
    return result


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_work_order(
    work_order_data: CreateWorkOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_manager_or_owner)
):
    """Create new work order - Manager/Owner only"""
    try:
        work_order = WorkOrder(
            wo_number=work_order_data.wo_number,
            title=work_order_data.title,
            description=work_order_data.description,
            status=work_order_data.status,
            cost_center=work_order_data.cost_center,
            cost_element=work_order_data.cost_element,
            created_by=str(current_user.id)
        )
        
        db.add(work_order)
        db.commit()
        db.refresh(work_order)
        
        # Convert to dict response
        return {
            "id": work_order.id,
            "wo_number": work_order.wo_number,
            "title": work_order.title,
            "description": work_order.description,
            "status": work_order.status.value,
            "cost_center": work_order.cost_center,
            "cost_element": work_order.cost_element,
            "created_by": work_order.created_by,
            "created_at": work_order.created_at.isoformat(),
            "updated_at": work_order.updated_at.isoformat() if work_order.updated_at else None
        }
        
    except IntegrityError as e:
        db.rollback()
        if "wo_number" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Work Order number '{work_order_data.wo_number}' already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Database integrity error"
        )


@router.get("/{work_order_id}")
async def get_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get work order by ID - all roles can view"""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order with ID {work_order_id} not found"
        )
    
    return work_order


@router.patch("/{work_order_id}")
async def update_work_order(
    work_order_id: int,
    update_data: UpdateWorkOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_manager_or_owner)
):
    """Update work order - Manager/Owner only"""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order with ID {work_order_id} not found"
        )
    
    # Update only provided fields
    update_fields = update_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(work_order, field, value)
    
    # Set updated timestamp
    from datetime import datetime
    work_order.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(work_order)
        
        # Return dict response to avoid Pydantic issues
        return {
            "id": work_order.id,
            "wo_number": work_order.wo_number,
            "title": work_order.title,
            "description": work_order.description,
            "status": work_order.status.value,
            "cost_center": work_order.cost_center,
            "cost_element": work_order.cost_element,
            "created_by": work_order.created_by,
            "created_at": work_order.created_at.isoformat(),
            "updated_at": work_order.updated_at.isoformat() if work_order.updated_at else None
        }
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Database integrity error"
        )


@router.get("/{work_order_id}/consumptions")
async def get_work_order_consumptions(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all CONSUME stock movements for a specific work order - all roles can view"""
    # Check if work order exists
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work Order with ID {work_order_id} not found"
        )
    
    # Get all CONSUME movements for this work order with product details
    consumptions = db.query(StockMovement, Product).join(
        Product, StockMovement.product_id == Product.id
    ).filter(
        StockMovement.work_order_id == work_order_id,
        StockMovement.movement_type == "CONSUME"
    ).order_by(StockMovement.timestamp.desc()).all()
    
    # Format response with summary
    consumption_list = []
    total_qty = 0
    total_value = 0.0
    
    for movement, product in consumptions:
        item_value = float(movement.quantity) * float(movement.unit_cost or 0)
        total_qty += movement.quantity
        total_value += item_value
        
        consumption_list.append({
            "id": movement.id,
            "timestamp": movement.timestamp.isoformat(),
            "product": {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "unit": product.unit
            },
            "quantity": movement.quantity,
            "unit_cost": float(movement.unit_cost or 0),
            "total_value": item_value,
            "note": movement.note,
            "created_by": movement.created_by
        })
    
    return {
        "work_order": {
            "id": work_order.id,
            "wo_number": work_order.wo_number,
            "title": work_order.title
        },
        "summary": {
            "total_consumed_qty": total_qty,
            "total_consumed_value": total_value,
            "currency": "THB"
        },
        "consumptions": consumption_list
    }