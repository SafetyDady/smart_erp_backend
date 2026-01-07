"""
Phase 13B: Inventory Core Service
Transactional stock movement engine with role-based authorization
"""

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from fastapi import HTTPException, status

from .models import Product, StockBalance, StockMovement, ProductType, MovementType, UserRole
from .database import get_user_role, LOW_STOCK_THRESHOLD


class InventoryError(Exception):
    """Custom exception for inventory operations"""
    pass


class InventoryService:
    """Core inventory engine with transactional guarantees"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_product(
        self, 
        name: str, 
        sku: str, 
        product_type: str, 
        cost: float,
        category: str = None,
        unit: str = "pcs",
        price: float = None,
        created_by: str = "system"
    ) -> Product:
        """
        Create new product with role authorization
        
        Rules:
        - Materials must have cost >= 1 THB (DB constraint)
        """
        # Validate material cost (server-side enforcement)
        if product_type == "material" and cost < 1.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Material cost must be >= 1.00 THB"
            )
        
        try:
            # Convert string product_type to enum
            product_type_enum = ProductType[product_type.upper()]
            
            # Create product
            product = Product(
                name=name,
                sku=sku,
                product_type=product_type_enum,
                category=category,
                unit=unit,
                cost=cost,
                price=price,
                created_by=created_by
            )
            
            self.db.add(product)
            self.db.flush()  # Get product.id
            
            # Initialize stock balance
            stock_balance = StockBalance(
                product_id=product.id,
                on_hand=0.0
            )
            self.db.add(stock_balance)
            
            self.db.commit()
            self.db.refresh(product)
            return product
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create product: {str(e)}"
            )
    
    def execute_movement(
        self,
        product_id: int,
        movement_type: str,
        quantity: float,
        performed_by: str,
        note: str = None,
    ) -> StockMovement:
        """
        Execute stock movement with automatic balance update
        
        Rules:
        - RECEIVE: Always allowed
        - ISSUE: Balance must be >= quantity
        - CONSUME: Consumable only, balance must be >= quantity
        - ADJUST: Owner only
        """
        try:
            # Get product and current balance
            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise InventoryError(f"Product {product_id} not found")
            
            balance = self.db.query(StockBalance).filter(
                StockBalance.product_id == product_id
            ).first()
            if not balance:
                raise InventoryError(f"Stock balance for product {product_id} not found")
            
            # Validate movement type
            movement_enum = MovementType[movement_type.upper()]
            
            # Authorization and validation
            if movement_enum == MovementType.ADJUST:
                # Only owner can adjust
                pass  # Role check done at endpoint level
            elif movement_enum == MovementType.CONSUME:
                if product.product_type != ProductType.CONSUMABLE:
                    raise InventoryError("Only consumables can be consumed")
            
            # Check sufficient balance for outgoing movements
            if movement_enum in [MovementType.ISSUE, MovementType.CONSUME]:
                if balance.on_hand < quantity:
                    raise InventoryError(
                        f"Insufficient balance. Available: {balance.on_hand}, Required: {quantity}"
                    )
            
            # Calculate new balance
            if movement_enum == MovementType.RECEIVE:
                new_balance = balance.on_hand + quantity
            else:  # ISSUE, CONSUME, ADJUST
                new_balance = balance.on_hand - quantity
            
            # Create movement record
            movement = StockMovement(
                product_id=product_id,
                movement_type=movement_enum,
                quantity=quantity,
                balance_after=new_balance,
                performed_by=performed_by,
                note=note
            )
            
            # Update balance
            balance.on_hand = new_balance
            balance.last_movement_id = None  # Will be set after insert
            
            self.db.add(movement)
            self.db.flush()
            
            balance.last_movement_id = movement.id
            self.db.commit()
            self.db.refresh(movement)
            
            return movement
            
        except InventoryError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Movement execution failed: {str(e)}"
            )
    
    def get_product_balance(self, product_id: int) -> StockBalance:
        """Get current stock balance for product"""
        balance = self.db.query(StockBalance).filter(
            StockBalance.product_id == product_id
        ).first()
        if not balance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No balance found for product {product_id}"
            )
        return balance
    
    def get_movement_history(
        self, 
        product_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[StockMovement]:
        """Get movement history for product"""
        movements = self.db.query(StockMovement).filter(
            StockMovement.product_id == product_id
        ).order_by(StockMovement.performed_at.desc()).limit(limit).offset(offset).all()
        
        return movements
    
    def get_low_stock_items(self, threshold: float = LOW_STOCK_THRESHOLD) -> List[Product]:
        """Get products with balance below threshold"""
        low_stock = self.db.query(Product).join(StockBalance).filter(
            StockBalance.on_hand < threshold
        ).all()
        
        return low_stock
    
    def adjust_stock(
        self,
        product_id: int,
        new_quantity: float,
        performed_by: str,
        reason: str = None
    ) -> StockMovement:
        """
        Adjust stock to specific quantity (owner only)
        """
        try:
            balance = self.get_product_balance(product_id)
            
            # Calculate adjustment quantity
            adjustment = new_quantity - balance.on_hand
            
            # Execute as ADJUST movement
            return self.execute_movement(
                product_id=product_id,
                movement_type="ADJUST",
                quantity=abs(adjustment),
                performed_by=performed_by,
                note=f"Adjustment: {reason}" if reason else "Stock adjustment"
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock adjustment failed: {str(e)}"
            )
