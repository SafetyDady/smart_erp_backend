"""
Warehouse and Zone Service
Business logic for warehouse management and zone-based stock tracking
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import Warehouse, Zone, ZoneType, StockBalance, Product
from .database import get_db


class WarehouseError(Exception):
    """Custom exception for warehouse operations"""
    pass


class WarehouseService:
    """Service for warehouse and zone management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_default_warehouse(self) -> Optional[Warehouse]:
        """
        Get the default (first main) warehouse for backward compatibility
        """
        warehouse = self.db.query(Warehouse).filter(
            and_(Warehouse.warehouse_type == "MAIN", Warehouse.is_active == True)
        ).first()
        return warehouse
    
    def get_default_zone(self, warehouse_id: int, zone_type: ZoneType) -> Optional[Zone]:
        """
        Get default zone of specific type in warehouse
        """
        zone = self.db.query(Zone).filter(
            and_(
                Zone.warehouse_id == warehouse_id,
                Zone.zone_type == zone_type,
                Zone.is_active == True
            )
        ).first()
        return zone
    
    def get_receiving_zone(self, warehouse_id: Optional[int] = None) -> Zone:
        """
        Get receiving zone for new stock
        If warehouse_id not specified, use default warehouse
        """
        if not warehouse_id:
            warehouse = self.get_default_warehouse()
            if not warehouse:
                raise WarehouseError("No default warehouse found")
            warehouse_id = warehouse.id
        
        zone = self.get_default_zone(warehouse_id, ZoneType.RECEIVING)
        if not zone:
            raise WarehouseError(f"No RECEIVING zone found in warehouse {warehouse_id}")
        
        return zone
    
    def get_storage_zone(self, warehouse_id: Optional[int] = None) -> Zone:
        """
        Get storage zone for available stock
        If warehouse_id not specified, use default warehouse  
        """
        if not warehouse_id:
            warehouse = self.get_default_warehouse()
            if not warehouse:
                raise WarehouseError("No default warehouse found")
            warehouse_id = warehouse.id
        
        zone = self.get_default_zone(warehouse_id, ZoneType.STORAGE)
        if not zone:
            raise WarehouseError(f"No STORAGE zone found in warehouse {warehouse_id}")
        
        return zone
    
    def can_issue_from_zone(self, zone_type: ZoneType) -> bool:
        """
        Check if stock can be issued/consumed from this zone type
        """
        allowed_zones = [ZoneType.STORAGE, ZoneType.PICK]
        return zone_type in allowed_zones
    
    def can_receive_to_zone(self, zone_type: ZoneType) -> bool:
        """
        Check if stock can be received to this zone type
        """
        allowed_zones = [ZoneType.RECEIVING]
        return zone_type in allowed_zones
    
    def get_stock_status_from_zone(self, zone_type: ZoneType) -> str:
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
    
    def ensure_product_balance_in_zone(self, product_id: int, zone_id: int) -> StockBalance:
        """
        Ensure stock balance record exists for product in zone
        Create if not exists with zero balance
        """
        balance = self.db.query(StockBalance).filter(
            and_(StockBalance.product_id == product_id, StockBalance.zone_id == zone_id)
        ).first()
        
        if not balance:
            balance = StockBalance(
                product_id=product_id,
                zone_id=zone_id,
                on_hand=0.0
            )
            self.db.add(balance)
            self.db.flush()
        
        return balance
    
    def get_product_stock_by_zone(self, product_id: int) -> List[dict]:
        """
        Get stock breakdown by zone for a product
        """
        balances = self.db.query(StockBalance).filter(
            and_(StockBalance.product_id == product_id, StockBalance.on_hand > 0)
        ).all()
        
        result = []
        for balance in balances:
            if balance.zone:  # Only include items with zone assignment
                result.append({
                    "zone_id": balance.zone.id,
                    "zone_type": balance.zone.zone_type.value,
                    "zone_name": balance.zone.name,
                    "warehouse_id": balance.zone.warehouse_id,
                    "warehouse_code": balance.zone.warehouse.code,
                    "on_hand": balance.on_hand,
                    "status": self.get_stock_status_from_zone(balance.zone.zone_type)
                })
        
        return result
    
    def get_available_stock(self, product_id: int, warehouse_id: Optional[int] = None) -> float:
        """
        Get available stock quantity (STORAGE + PICK zones only)
        """
        query = self.db.query(StockBalance).join(Zone).filter(
            and_(
                StockBalance.product_id == product_id,
                StockBalance.on_hand > 0,
                Zone.zone_type.in_([ZoneType.STORAGE, ZoneType.PICK])
            )
        )
        
        if warehouse_id:
            query = query.filter(Zone.warehouse_id == warehouse_id)
        
        balances = query.all()
        return sum(b.on_hand for b in balances)
    
    def migrate_legacy_stock_to_zones(self):
        """
        Migrate existing stock balances to default zones
        Used for backward compatibility during initial setup
        """
        # Find balances without zone assignment
        legacy_balances = self.db.query(StockBalance).filter(
            StockBalance.zone_id.is_(None)
        ).all()
        
        if not legacy_balances:
            return {"message": "No legacy stock to migrate", "migrated": 0}
        
        # Get default warehouse and storage zone
        warehouse = self.get_default_warehouse()
        if not warehouse:
            raise WarehouseError("No default warehouse found for migration")
        
        storage_zone = self.get_default_zone(warehouse.id, ZoneType.STORAGE)
        if not storage_zone:
            raise WarehouseError("No storage zone found for migration")
        
        migrated = 0
        for balance in legacy_balances:
            if balance.on_hand > 0:  # Only migrate non-zero balances
                balance.zone_id = storage_zone.id
                migrated += 1
        
        self.db.commit()
        
        return {"message": f"Migrated {migrated} stock balances to storage zone", "migrated": migrated}


# Zone Movement Rules
ZONE_MOVEMENT_RULES = {
    "RECEIVE_TO": [ZoneType.RECEIVING],  # RECEIVE movements go to RECEIVING zone
    "ISSUE_FROM": [ZoneType.STORAGE, ZoneType.PICK],  # ISSUE/CONSUME from these zones only
    "QC_FLOWS": {
        ZoneType.RECEIVING: ZoneType.QC_HOLD,  # Receiving → QC Hold
        ZoneType.QC_HOLD: ZoneType.STORAGE,    # QC Hold → Storage (after approval)
    },
    "PICK_FLOWS": {
        ZoneType.STORAGE: ZoneType.PICK,       # Storage → Pick
        ZoneType.PICK: ZoneType.DISPATCH,      # Pick → Dispatch
    }
}


def get_default_zone_for_movement(movement_type: str, warehouse_service: WarehouseService) -> Optional[Zone]:
    """
    Get default zone for stock movement type
    Used for backward compatibility with existing stock movements
    """
    if movement_type.upper() == "RECEIVE":
        return warehouse_service.get_receiving_zone()
    elif movement_type.upper() in ["ISSUE", "CONSUME"]:
        return warehouse_service.get_storage_zone()
    
    return None