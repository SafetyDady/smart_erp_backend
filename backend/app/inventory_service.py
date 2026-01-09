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


# Unit conversion constants (hardcoded as per spec)
UNIT_CONVERSIONS = {
    'PCS': 1.0,
    'DOZEN': 12.0
}


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

    def get_unit_multiplier(self, unit: str) -> float:
        """Get conversion multiplier for unit to base unit"""
        unit_upper = unit.upper()
        if unit_upper not in UNIT_CONVERSIONS:
            raise InventoryError(f"Unsupported unit: {unit}")
        return UNIT_CONVERSIONS[unit_upper]

    def execute_stock_movement(
        self,
        product_id: int,
        movement_type: str,
        qty_input: float,
        unit_input: str,
        unit_cost_input: Optional[float],
        performed_by: str,
        note: Optional[str] = None,
        work_order_id: Optional[int] = None
    ) -> StockMovement:
        """Execute stock movement with unit conversion"""
        try:
            # Get product and validate
            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise InventoryError(f"Product {product_id} not found")

            # Get current balance
            balance = self.db.query(StockBalance).filter(
                StockBalance.product_id == product_id
            ).first()
            if not balance:
                raise InventoryError(f"Stock balance for product {product_id} not found")

            # Validate movement type
            movement_enum = MovementType[movement_type.upper()]
            
            # Validate work order for CONSUME movements
            if movement_type.upper() == 'CONSUME':
                if work_order_id is None:
                    raise InventoryError("work_order_id is required for CONSUME movements")
                
                # Validate work order exists and is active
                from .models import WorkOrder, WorkOrderStatus
                work_order = self.db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
                if not work_order:
                    raise InventoryError(f"Work Order {work_order_id} not found")
                if work_order.status != WorkOrderStatus.OPEN:
                    raise InventoryError(f"Work Order {work_order.wo_number} is not open for consumption")
            elif work_order_id is not None:
                raise InventoryError("work_order_id only allowed for CONSUME movements")
            
            # Get unit conversion multiplier
            multiplier_to_base = self.get_unit_multiplier(unit_input)
            qty_base = qty_input * multiplier_to_base

            # Validate unit restrictions
            if movement_type.upper() in ['ISSUE', 'CONSUME'] and unit_input.upper() != 'PCS':
                raise InventoryError("ISSUE and CONSUME movements must use PCS unit only")

            # Initialize cost variables
            unit_cost_base = None
            value_total = 0.0

            # Movement type specific logic
            if movement_type.upper() == 'RECEIVE':
                if unit_cost_input is None:
                    raise InventoryError("unit_cost_input is required for RECEIVE movements")
                
                # Calculate costs
                unit_cost_base = unit_cost_input / multiplier_to_base
                value_total = qty_base * unit_cost_base
                
                # Update average cost in product
                if balance.on_hand > 0:
                    # Calculate weighted average cost
                    total_cost = (balance.on_hand * product.cost_per_base_unit) + value_total
                    total_qty = balance.on_hand + qty_base
                    new_avg_cost = total_cost / total_qty
                    product.cost_per_base_unit = new_avg_cost
                else:
                    # First stock, use this cost
                    product.cost_per_base_unit = unit_cost_base

                # Update balance
                balance.on_hand += qty_base
                quantity = qty_base  # Positive for RECEIVE

            elif movement_type.upper() in ['ISSUE', 'CONSUME']:
                # Check sufficient stock
                if balance.on_hand < qty_base:
                    raise InventoryError("Insufficient stock")

                # Use current average cost
                unit_cost_base = product.cost_per_base_unit
                value_total = qty_base * unit_cost_base

                # Update balance
                balance.on_hand -= qty_base
                quantity = -qty_base  # Negative for ISSUE/CONSUME

            else:
                raise InventoryError(f"Unsupported movement type: {movement_type}")

            # Create movement record
            movement = StockMovement(
                product_id=product_id,
                movement_type=movement_enum,
                work_order_id=work_order_id,
                qty_input=qty_input,
                unit_input=unit_input.upper(),
                multiplier_to_base=multiplier_to_base,
                qty_base=qty_base,
                unit_cost_input=unit_cost_input,
                unit_cost_base=unit_cost_base,
                value_total=value_total,
                quantity=quantity,
                balance_after=balance.on_hand,
                performed_by=performed_by,
                note=note
            )

            self.db.add(movement)
            self.db.commit()
            self.db.refresh(movement)

            return movement

        except IntegrityError as e:
            self.db.rollback()
            raise InventoryError(f"Database constraint violation: {str(e)}")
        except Exception as e:
            self.db.rollback()
            if "not found" in str(e).lower():
                raise InventoryError(str(e))
            raise InventoryError(f"Movement execution failed: {str(e)}")

    def get_recent_movements(self, limit: int = 50) -> List[StockMovement]:
        """Get recent stock movements for UI refresh"""
        movements = (
            self.db.query(StockMovement)
            .order_by(StockMovement.performed_at.desc())
            .limit(limit)
            .all()
        )
        return movements
    
    def get_recent_movements_with_undo_flags(self, current_user_id: str, limit: int = 50):
        """Get recent movements with undo flags for UI"""
        movements = self.get_recent_movements(limit)
        
        # Get latest movement IDs per product for undo validation
        latest_per_product = {}
        for movement in movements:
            if movement.product_id not in latest_per_product:
                latest_movement = self.db.query(StockMovement).filter(
                    StockMovement.product_id == movement.product_id
                ).order_by(StockMovement.created_at.desc()).first()
                latest_per_product[movement.product_id] = latest_movement.id if latest_movement else None
        
        # Add undo flags to response
        result = []
        for movement in movements:
            movement_dict = {
                'id': movement.id,
                'product_id': movement.product_id,
                'movement_type': movement.movement_type,
                'qty_input': movement.qty_input,
                'unit_input': movement.unit_input,
                'multiplier_to_base': movement.multiplier_to_base,
                'qty_base': movement.qty_base,
                'unit_cost_input': movement.unit_cost_input,
                'unit_cost_base': movement.unit_cost_base,
                'value_total': movement.value_total,
                'quantity': movement.quantity,
                'balance_after': movement.balance_after,
                'performed_by': movement.performed_by,
                'performed_at': movement.performed_at,
                'created_at': movement.created_at,
                'note': movement.note,
                'reversal_of_id': movement.reversal_of_id,
                'reversed_at': movement.reversed_at,
                'reversed_by': movement.reversed_by,
                # Undo flags for frontend
                'can_undo': (
                    movement.reversed_at is None and
                    movement.performed_by == current_user_id and
                    latest_per_product.get(movement.product_id) == movement.id
                )
            }
            result.append(movement_dict)
        
        return result
    
    def get_movement_by_id(self, movement_id: int) -> Optional[StockMovement]:
        """Get stock movement by ID"""
        return self.db.query(StockMovement).filter(
            StockMovement.id == movement_id
        ).first()
    
    def can_undo_movement(self, movement_id: int, current_user_id: str) -> bool:
        """
        ERP validation: Check if movement can be undone (undo last action only)
        
        Conditions:
        1. Movement exists and not already reversed
        2. Movement was created by current user
        3. Movement is the latest for that product
        """
        # Get the target movement
        movement = self.db.query(StockMovement).filter(
            StockMovement.id == movement_id
        ).first()
        
        if not movement or movement.reversed_at is not None:
            return False
            
        # Check if created by current user
        if movement.performed_by != current_user_id:
            return False
            
        # Check if it's the latest movement for this product
        latest_movement = self.db.query(StockMovement).filter(
            StockMovement.product_id == movement.product_id
        ).order_by(StockMovement.created_at.desc()).first()
        
        return latest_movement and latest_movement.id == movement_id
    
    def reverse_stock_movement(self, movement_id: int, performed_by: str) -> StockMovement:
        """
        Reverse a stock movement - ERP-correct immutable audit trail
        
        Creates a new reversing movement, preserves original record
        """
        # Get original movement
        original = self.db.query(StockMovement).filter(
            StockMovement.id == movement_id
        ).first()
        
        if not original:
            raise ValueError(f"Movement {movement_id} not found")
            
        if original.reversed_at is not None:
            raise ValueError(f"Movement {movement_id} already reversed")
        
        # Determine reverse movement type
        reverse_type_map = {
            MovementType.RECEIVE: MovementType.ISSUE,
            MovementType.ISSUE: MovementType.RECEIVE,
            MovementType.CONSUME: MovementType.RECEIVE,
        }
        
        reverse_type = reverse_type_map.get(original.movement_type)
        if not reverse_type:
            raise ValueError(f"Cannot reverse movement type: {original.movement_type}")
        
        # Get product info for base unit
        product = self.db.query(Product).filter(Product.id == original.product_id).first()
        if not product:
            raise ValueError(f"Product {original.product_id} not found")
        
        # Create reversing movement using base unit values
        reversal_movement = StockMovement(
            product_id=original.product_id,
            movement_type=reverse_type,
            
            # Use base unit for reversal (always PCS)
            qty_input=original.qty_base,
            unit_input=product.base_unit,  # Always PCS
            multiplier_to_base=1.0,
            qty_base=original.qty_base,
            
            # Preserve cost valuation
            unit_cost_input=original.unit_cost_base,
            unit_cost_base=original.unit_cost_base,
            value_total=original.value_total,
            
            # Sign-correct quantity for stock balance
            quantity=-original.quantity,  # Reverse the effect
            balance_after=0,  # Will be calculated
            
            # Audit
            performed_by=performed_by,
            note=f"Reversal of movement #{original.id}",
            
            # Link to original
            reversal_of_id=original.id
        )
        
        try:
            # Apply stock balance changes (reuse existing logic)
            self.db.add(reversal_movement)
            self.db.flush()  # Get ID
            
            # Get current stock balance (same as execute_stock_movement)
            balance = self.db.query(StockBalance).filter(
                StockBalance.product_id == original.product_id
            ).first()
            if not balance:
                raise InventoryError(f"Stock balance for product {original.product_id} not found")
            
            # Apply the reversal quantity to balance
            balance.on_hand += reversal_movement.quantity
            balance.last_updated = func.now()
            balance.last_movement_id = reversal_movement.id
            
            # Update reversal movement with final balance
            reversal_movement.balance_after = balance.on_hand
            
            # Mark original as reversed
            original.reversed_at = func.now()
            original.reversed_by = performed_by
            
            self.db.commit()
            
            return reversal_movement
            
        except Exception as e:
            self.db.rollback()
            raise InventoryError(f"Reversal failed: {str(e)}")
