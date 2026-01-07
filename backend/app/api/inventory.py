"""
Phase 13B: Inventory API Routes
FastAPI endpoints for inventory management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db, get_current_user_role, UserRole
from ..inventory_service import InventoryService, InventoryError
from ..schemas import (
    CreateProductRequest, UpdateProductRequest, ExecuteMovementRequest, AdjustStockRequest,
    ProductResponse, StockBalanceResponse, MovementResponse, 
    MovementHistoryResponse, LowStockResponse
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/products", response_model=ProductResponse)
def create_product(
    request: CreateProductRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Create new product/material/consumable
    
    Requires: Owner or Manager role
    """
    if user_role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(
            status_code=403, 
            detail="Only owners and managers can create products"
        )
    
    service = InventoryService(db)
    try:
        product = service.create_product(
            name=request.name,
            sku=request.sku,
            product_type=request.product_type.value,
            category=request.category,
            unit=request.unit,
            cost=request.cost,
            price=request.price,
            created_by=f"user_{user_role.value}"
        )
        return ProductResponse.from_orm(product)
    except InventoryError as e:
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail="SKU already exists")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    request: UpdateProductRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Update product master data
    
    Requires: Owner or Manager role
    SKU Lock Policy: SKU cannot be changed after stock movements exist
    """
    if user_role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(
            status_code=403,
            detail="Only owners and managers can update products"
        )
        
    service = InventoryService(db)
    try:
        product = service.update_product(
            product_id=product_id,
            name=request.name,
            sku=request.sku,
            category=request.category,
            unit=request.unit,
            price=request.price,
            status=request.status
        )
        return ProductResponse.from_orm(product)
    except InventoryError as e:
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail="SKU already exists")
        if "is locked" in str(e):
            raise HTTPException(status_code=409, detail=str(e)) 
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/movements", response_model=MovementResponse)
def execute_movement(
    request: ExecuteMovementRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Execute stock movement: RECEIVE/ISSUE/CONSUME
    
    Permission matrix:
    - RECEIVE: Owner, Manager only
    - ISSUE: Owner, Manager, Staff
    - CONSUME: Owner, Manager only
    - ADJUST: Owner only (use separate endpoint)
    """
    service = InventoryService(db)
    
    try:
        movement = service.execute_movement(
            product_id=request.product_id,
            movement_type=request.movement_type.value,
            quantity=request.quantity,
            performed_by=f"user_{user_role.value}",
            note=request.note,
            user_role=user_role
        )
        
        # Build response with additional data
        return MovementResponse(
            id=movement.id,
            product_id=movement.product_id,
            product_name=movement.product.name,
            sku=movement.product.sku,
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            balance_after=movement.balance_after,
            performed_by=movement.performed_by,
            performed_at=movement.performed_at,
            note=movement.note
        )
    except InventoryError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/adjustments", response_model=MovementResponse)
def adjust_stock(
    request: AdjustStockRequest,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Adjust stock quantity (positive or negative)
    
    Requires: Owner role only
    """
    if user_role != UserRole.OWNER:
        raise HTTPException(
            status_code=403, 
            detail="Only owners can adjust stock quantities"
        )
    
    service = InventoryService(db)
    try:
        movement = service.execute_movement(
            product_id=request.product_id,
            movement_type="ADJUST",
            quantity=request.adjustment,
            performed_by=f"user_{user_role.value}",
            note=request.note,
            user_role=user_role
        )
        
        return MovementResponse(
            id=movement.id,
            product_id=movement.product_id,
            product_name=movement.product.name,
            sku=movement.product.sku,
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            balance_after=movement.balance_after,
            performed_by=movement.performed_by,
            performed_at=movement.performed_at,
            note=movement.note
        )
    except InventoryError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/products/{product_id}/stock", response_model=StockBalanceResponse)
def get_stock_balance(
    product_id: int,
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Get current stock balance for product
    
    Accessible to: All authenticated users
    """
    service = InventoryService(db)
    balance = service.get_stock_balance(product_id)
    
    if not balance:
        raise HTTPException(
            status_code=404, 
            detail=f"No stock record found for product {product_id}"
        )
    
    return StockBalanceResponse(
        product_id=balance.product_id,
        name=balance.product.name,
        sku=balance.product.sku,
        product_type=balance.product.product_type,
        on_hand=balance.on_hand,
        unit=balance.product.unit,
        is_low_stock=service.is_low_stock(balance),
        last_updated=balance.last_updated
    )


@router.get("/movements/{product_id}", response_model=MovementHistoryResponse)
def get_movement_history(
    product_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Get movement history for product
    
    Accessible to: All authenticated users
    """
    service = InventoryService(db)
    movements, total = service.get_movement_history(product_id, limit, offset)
    
    movement_responses = []
    for movement in movements:
        movement_responses.append(MovementResponse(
            id=movement.id,
            product_id=movement.product_id,
            product_name=movement.product.name,
            sku=movement.product.sku,
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            balance_after=movement.balance_after,
            performed_by=movement.performed_by,
            performed_at=movement.performed_at,
            note=movement.note
        ))
    
    return MovementHistoryResponse(
        movements=movement_responses,
        total_count=total
    )


@router.get("/products", response_model=List[ProductResponse])
def list_products(
    product_type: Optional[str] = Query(None, description="Filter by product type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    List products with optional filters
    
    Accessible to: All authenticated users
    """
    service = InventoryService(db)
    products = service.list_products(
        product_type=product_type,
        category=category,
        limit=limit,
        offset=offset
    )
    
    return [ProductResponse.from_orm(product) for product in products]


@router.get("/low-stock")
def get_low_stock_products(
    db: Session = Depends(get_db),
    user_role: UserRole = Depends(get_current_user_role)
):
    """
    Get low stock products count and top items
    
    Accessible to: All authenticated users
    Returns: count and top 5 low stock items (name + on_hand only)
    """
    service = InventoryService(db)
    low_stock_data = service.get_low_stock_items()
    return low_stock_data