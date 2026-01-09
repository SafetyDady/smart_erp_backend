"""
Stock Movement API Routes
FastAPI endpoints for stock movements with unit conversion
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db, get_current_user_role, UserRole
from ..inventory_service import InventoryService, InventoryError
from ..schemas import StockMovementRequest, StockMovementResponse

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("/movements", response_model=StockMovementResponse)
def create_stock_movement(
    request: StockMovementRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Create stock movement with unit conversion
    
    Requires: Manager or Owner role (Staff is read-only)
    
    Rules:
    - RECEIVE: unit_cost_input required, supports PCS/DOZEN
    - ISSUE/CONSUME: unit_input must be PCS, unit_cost_input not allowed
    - Stock stored in base unit only
    - Average cost calculation for RECEIVE
    """
    # Role enforcement: Staff is read-only
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot create stock movements (read-only access)"
        )
        
    service = InventoryService(db)
    try:
        movement = service.execute_stock_movement(
            product_id=request.product_id,
            movement_type=request.movement_type.value,
            qty_input=request.qty_input,
            unit_input=request.unit_input,
            unit_cost_input=request.unit_cost_input,
            performed_by=f"user_{user_role.value.lower()}",  # Store creator ID
            note=request.note
        )
        return StockMovementResponse.from_orm(movement)
        
    except InventoryError as e:
        if "insufficient stock" in str(e).lower():
            raise HTTPException(status_code=409, detail=str(e))
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        if "unsupported" in str(e).lower() or "must use" in str(e).lower():
            raise HTTPException(status_code=422, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/movements", response_model=List[StockMovementResponse])
def get_stock_movements(
    limit: int = 50,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Get recent stock movements with undo flags
    
    Available to all roles
    """
    service = InventoryService(db)
    try:
        movements = service.get_recent_movements_with_undo_flags(
            current_user_id=f"user_{user_role.value}",
            limit=limit
        )
        return movements
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch movements: {str(e)}")