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
from ..models import WorkOrder, WorkOrderStatus, StockMovement

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
    - ADJUST is not available in Freeze Phase
    """
    # Role enforcement: Staff is read-only
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot create stock movements (read-only access)"
        )
    
    # Freeze Phase: Block ADJUST movements
    if request.movement_type.value == "ADJUST":
        raise HTTPException(
            status_code=400,
            detail="ADJUST is not available in Freeze Phase. Use RECEIVE/ISSUE/CONSUME only."
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
            note=request.note,
            work_order_id=request.work_order_id,  # Pass work order ID for CONSUME movements
            cost_center=request.cost_center,  # Legacy field (deprecated)
            cost_element=request.cost_element,  # Legacy field (deprecated)
            cost_center_id=request.cost_center_id,  # Pass cost center ID for ISSUE movements
            cost_element_id=request.cost_element_id  # Pass cost element ID for ISSUE/CONSUME movements
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
    try:
        # Get stock movements directly from database
        movements = db.query(StockMovement).order_by(
            StockMovement.performed_at.desc()
        ).limit(limit).all()
        
        # Convert to response format
        result = []
        for movement in movements:
            # Ensure work_order_id has default value for existing records
            work_order_id = getattr(movement, 'work_order_id', None)
            
            result.append(StockMovementResponse(
                id=movement.id,
                product_id=movement.product_id,
                movement_type=movement.movement_type,
                work_order_id=work_order_id,
                cost_center=getattr(movement, 'cost_center', None),
                cost_element=getattr(movement, 'cost_element', None),
                ref_type=getattr(movement, 'ref_type', None),
                qty_input=movement.qty_input,
                unit_input=movement.unit_input,
                multiplier_to_base=movement.multiplier_to_base,
                qty_base=movement.qty_base,
                unit_cost_input=movement.unit_cost_input,
                unit_cost_base=movement.unit_cost_base,
                value_total=movement.value_total,
                quantity=movement.quantity,
                balance_after=movement.balance_after,
                performed_by=movement.performed_by,
                performed_at=movement.performed_at,
                created_at=movement.created_at,
                note=movement.note,
                reversal_of_id=movement.reversal_of_id,
                reversed_at=movement.reversed_at,
                reversed_by=movement.reversed_by
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch movements: {str(e)}")


@router.get("/active-work-orders")
def get_active_work_orders(
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Get active work orders for CONSUME movements
    
    Available to all roles for consumption purposes
    """
    try:
        work_orders = db.query(WorkOrder).filter(
            WorkOrder.status == WorkOrderStatus.OPEN
        ).order_by(WorkOrder.wo_number.asc()).all()
        
        return [
            {
                "id": wo.id,
                "wo_number": wo.wo_number,
                "title": wo.title,
                "description": wo.description,
                "cost_center": wo.cost_center,
                "cost_element": wo.cost_element,
                "status": wo.status.value,
                "created_at": wo.created_at
            } 
            for wo in work_orders
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch work orders: {str(e)}")