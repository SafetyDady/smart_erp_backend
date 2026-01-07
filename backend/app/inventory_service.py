"""
Phase 13B: Inventory Core Service
Transactional stock movement engine with role-based authorization
"""

import time
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
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
            
        except IntegrityError as e:
            self.db.rollback()
            if "UNIQUE constraint failed: products.sku" in str(e):
                raise InventoryError("SKU already exists")
            raise InventoryError(f"Database constraint violation: {str(e)}")
        except Exception as e:
            self.db.rollback()
            raise InventoryError(f"Failed to create product: {str(e)}")
    
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
    
    def list_products(
        self,
        product_type: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Product]:
        """List products with optional filters"""
        query = self.db.query(Product)
        
        if product_type:
            query = query.filter(Product.product_type == product_type.upper())
        
        if category:
            query = query.filter(Product.category == category)
        
        products = query.limit(limit).offset(offset).all()
        return products
    
    def get_low_stock_items(self, threshold: float = LOW_STOCK_THRESHOLD) -> dict:
        """Get products with balance below threshold"""
        low_stock_products = self.db.query(Product).join(StockBalance).filter(
            StockBalance.on_hand < threshold
        ).options(joinedload(Product.stock_balance)).all()
        
        # Sort by lowest stock first and get top 5
        sorted_products = sorted(low_stock_products, key=lambda p: p.stock_balance.on_hand)[:5]
        
        return {
            "count": len(low_stock_products),
            "threshold": int(threshold),
            "items": [
                {
                    "id": product.id,
                    "name": product.name,
                    "on_hand": product.stock_balance.on_hand,
                    "unit": product.unit
                }
                for product in sorted_products
            ]
        }
        
    def update_product(
        self,
        product_id: int,
        name: Optional[str] = None,
        sku: Optional[str] = None,
        category: Optional[str] = None,
        unit: Optional[str] = None,
        price: Optional[float] = None,
        status: Optional[str] = None
    ) -> Product:
        """Update product with SKU lock policy"""
        try:
            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise InventoryError(f"Product with ID {product_id} not found")
                
            # Check SKU lock policy if SKU is being changed
            if sku and sku != product.sku:
                # Normalize SKU: trim and uppercase  
                sku = sku.strip().upper()
                
                # Check if product has any stock movements
                has_movements = self.db.query(StockMovement).filter(
                    StockMovement.product_id == product_id
                ).first() is not None
                
                if has_movements:
                    raise InventoryError("SKU is locked after movements exist")
                    
                # Check for case-insensitive duplicate SKU
                existing_product = self.db.query(Product).filter(
                    func.upper(Product.sku) == sku.upper(),
                    Product.id != product_id
                ).first()
                if existing_product:
                    raise InventoryError("SKU already exists")
                    
            # Update fields
            if name is not None:
                product.name = name
            if sku is not None:
                product.sku = sku
            if category is not None:
                product.category = category
            if unit is not None:
                product.unit = unit
            if price is not None:
                product.price = price
                
            self.db.commit()
            self.db.refresh(product)
            return product
            
        except IntegrityError as e:
            self.db.rollback()
            if "UNIQUE constraint failed: products.sku" in str(e):
                raise InventoryError("SKU already exists")
            raise InventoryError(f"Database constraint violation: {str(e)}")
        except Exception as e:
            self.db.rollback()
            if "Product with ID" in str(e) and "not found" in str(e):
                raise InventoryError(f"Product with ID {product_id} not found")
            raise InventoryError(f"Failed to update product: {str(e)}")
    
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
