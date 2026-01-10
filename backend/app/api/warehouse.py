"""
Warehouse and Zone Management APIs
Provides endpoints for warehouse/zone CRUD operations and stock location management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import get_db
from ..auth import get_current_user
from ..models import Warehouse, Zone, ZoneType, StockBalance, UserRole

router = APIRouter()


# Warehouse Management APIs
@router.get("/warehouses")
def list_warehouses(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all warehouses
    Available to all roles
    """
    query = db.query(Warehouse)
    if active_only:
        query = query.filter(Warehouse.is_active == True)
    
    warehouses = query.order_by(Warehouse.code).all()
    return [
        {
            "id": w.id,
            "code": w.code,
            "name": w.name,
            "description": w.description,
            "warehouse_type": w.warehouse_type,
            "is_active": w.is_active,
            "zone_count": len([z for z in w.zones if z.is_active])
        }
        for w in warehouses
    ]


@router.post("/warehouses")
def create_warehouse(
    warehouse_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create new warehouse with standard zones
    Requires: Manager or Owner role
    """
    user_role = UserRole(current_user["role"].upper())
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot create warehouses"
        )
    
    # Validate required fields
    if not warehouse_data.get("code") or not warehouse_data.get("name"):
        raise HTTPException(
            status_code=400,
            detail="Code and name are required"
        )
    
    # Check if warehouse code already exists
    existing = db.query(Warehouse).filter(Warehouse.code == warehouse_data["code"]).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Warehouse code '{warehouse_data['code']}' already exists"
        )
    
    try:
        # Create warehouse
        warehouse = Warehouse(
            code=warehouse_data["code"],
            name=warehouse_data["name"],
            description=warehouse_data.get("description", ""),
            warehouse_type=warehouse_data.get("warehouse_type", "MAIN")
        )
        db.add(warehouse)
        db.flush()  # Get warehouse ID
        
        # Create standard zones for this warehouse
        standard_zones = [
            {"type": ZoneType.RECEIVING, "name": f"{warehouse.name} - Receiving"},
            {"type": ZoneType.QC_HOLD, "name": f"{warehouse.name} - QC Hold"},
            {"type": ZoneType.STORAGE, "name": f"{warehouse.name} - Storage"},
            {"type": ZoneType.PICK, "name": f"{warehouse.name} - Picking"},
            {"type": ZoneType.DISPATCH, "name": f"{warehouse.name} - Dispatch"},
            {"type": ZoneType.SCRAP, "name": f"{warehouse.name} - Scrap"}
        ]
        
        for zone_data in standard_zones:
            zone = Zone(
                warehouse_id=warehouse.id,
                zone_type=zone_data["type"],
                name=zone_data["name"],
                description=f"Standard {zone_data['type'].value.lower()} zone"
            )
            db.add(zone)
        
        db.commit()
        
        return {
            "id": warehouse.id,
            "code": warehouse.code,
            "name": warehouse.name,
            "description": warehouse.description,
            "warehouse_type": warehouse.warehouse_type,
            "zones_created": len(standard_zones)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create warehouse: {str(e)}")


# Zone Management APIs
@router.get("/warehouses/{warehouse_id}/zones")
def list_zones(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List zones in a warehouse
    Available to all roles
    """
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    zones = db.query(Zone).filter(
        and_(Zone.warehouse_id == warehouse_id, Zone.is_active == True)
    ).order_by(Zone.zone_type).all()
    
    return [
        {
            "id": zone.id,
            "zone_type": zone.zone_type.value,
            "name": zone.name,
            "description": zone.description,
            "warehouse_code": warehouse.code,
            "warehouse_name": warehouse.name,
            "stock_status": get_zone_stock_status(zone.zone_type),
            "is_active": zone.is_active
        }
        for zone in zones
    ]


# Stock Location APIs
@router.get("/stock-locations")
def list_stock_locations(
    warehouse_id: Optional[int] = None,
    zone_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List stock locations (products with non-zero balance by zone)
    Available to all roles
    """
    query = db.query(StockBalance).filter(StockBalance.on_hand > 0)
    
    if warehouse_id:
        query = query.join(Zone).filter(Zone.warehouse_id == warehouse_id)
    
    if zone_type:
        try:
            zone_enum = ZoneType(zone_type)
            query = query.join(Zone).filter(Zone.zone_type == zone_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid zone type: {zone_type}")
    
    balances = query.all()
    
    result = []
    for balance in balances:
        if balance.zone:  # Only include items with zone assignment
            result.append({
                "product_id": balance.product_id,
                "product_name": balance.product.name,
                "product_sku": balance.product.sku,
                "on_hand": balance.on_hand,
                "zone_id": balance.zone.id,
                "zone_type": balance.zone.zone_type.value,
                "zone_name": balance.zone.name,
                "warehouse_id": balance.zone.warehouse_id,
                "warehouse_code": balance.zone.warehouse.code,
                "stock_status": get_zone_stock_status(balance.zone.zone_type),
                "last_updated": balance.last_updated
            })
    
    return result


# Helper Functions
def get_zone_stock_status(zone_type: ZoneType) -> str:
    """
    Derive stock status from zone type
    """
    status_mapping = {
        ZoneType.RECEIVING: "Received",
        ZoneType.QC_HOLD: "In QC",
        ZoneType.STORAGE: "Available",
        ZoneType.PICK: "Available",
        ZoneType.DISPATCH: "Ready to Dispatch",
        ZoneType.SCRAP: "Not Usable"
    }
    return status_mapping.get(zone_type, "Unknown")


# Zone Movement APIs (for future implementation)
@router.post("/stock-movements/zone-transfer")
def transfer_stock_between_zones(
    transfer_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Transfer stock between zones (placeholder for future implementation)
    Requires: Manager or Owner role
    """
    user_role = UserRole(current_user["role"].upper())
    if user_role == UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="Staff users cannot transfer stock between zones"
        )
    
    # TODO: Implement zone transfer logic
    # This would create stock movements and update balances
    return {"message": "Zone transfer functionality will be implemented in future phase"}