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
        product_type: ProductType, 
        cost: float,
        user_id: str,
        category: str = None,
        unit: str = "pcs",
        price: float = None
    ) -> Product:
        """
        Create new product with role authorization
        
        Rules:
        - Staff cannot create products
        - Materials must have cost >= 1 THB (DB constraint)
        """
        user_role = get_user_role(user_id)
        
        # Authorization check
        if user_role == "staff":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff users cannot create products"
            )
        
        # Validate material cost (server-side enforcement)
        if product_type == ProductType.MATERIAL and cost < 1.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Material cost must be >= 1.00 THB"
            )
        
        try:
            # Create product
            product = Product(
                name=name,
                sku=sku,
                product_type=product_type,
                category=category,
                unit=unit,
                cost=cost,
                price=price,
                created_by=user_id
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
        user_role: UserRole = None
    ) -> StockMovement:
        """
        Execute stock movement with transactional guarantees
        
        Rules:
        - RECEIVE: Staff blocked
        - CONSUME: Consumables only
        - ADJUST: Owner only
        - Row locking for stock_balances
        """
        user_role = get_user_role(user_id)
        
        try:
            # Start transaction and get product with lock
            product = self.db.get(Product, product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {product_id} not found"
                )
            
            # Get stock balance with row lock
            stock_balance = self.db.execute(
                select(StockBalance)
                .where(StockBalance.product_id == product_id)
                .with_for_update()
            ).scalar_one_or_none()
            
            if not stock_balance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Stock balance not found for product {product_id}"
                )
            
            # Authorization checks
            self._validate_movement_authorization(movement_type, product, user_role)
            
            # Calculate new quantity based on movement type
            movement_quantity = self._calculate_movement_quantity(movement_type, quantity)
            new_balance = stock_balance.on_hand + movement_quantity
            
            # Validate sufficient stock for outgoing movements
            if new_balance < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Available: {stock_balance.on_hand}, Required: {abs(movement_quantity)}"
                )
            
            # Create movement record
            movement = StockMovement(
                product_id=product_id,
                movement_type=movement_type,
                quantity=movement_quantity,
                balance_after=new_balance,
                performed_by=user_id,
                note=note
            )
            
            # Update stock balance
            stock_balance.on_hand = new_balance
            stock_balance.last_movement_id = None  # Will be set after flush
            
            self.db.add(movement)
            self.db.flush()  # Get movement.id
            
            # Update reference
            stock_balance.last_movement_id = movement.id
            
            self.db.commit()
            self.db.refresh(movement)
            return movement
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Movement execution failed: {str(e)}"
            )
    
    def _validate_movement_authorization(
        self, 
        movement_type: MovementType, 
        product: Product, 
        user_role: str
    ):
        """Validate movement authorization based on rules"""
        
        # RECEIVE: Staff blocked
        if movement_type == MovementType.RECEIVE and user_role == "staff":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff users cannot receive stock"
            )
        
        # CONSUME: Consumables only
        if movement_type == MovementType.CONSUME and product.product_type != ProductType.CONSUMABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CONSUME movement only allowed for consumable products"
            )
        
        # ADJUST: Owner only
        if movement_type == MovementType.ADJUST and user_role != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners can perform stock adjustments"
            )
    
    def _calculate_movement_quantity(self, movement_type: MovementType, quantity: float) -> float:
        """Calculate signed quantity for movement"""
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Movement quantity must be positive"
            )
        
        # RECEIVE adds stock (positive)
        if movement_type == MovementType.RECEIVE:
            return quantity
        
        # ISSUE, CONSUME remove stock (negative)
        elif movement_type in [MovementType.ISSUE, MovementType.CONSUME]:
            return -quantity
        
        # ADJUST can be positive or negative (passed as-is from API)
        elif movement_type == MovementType.ADJUST:
            return quantity  # API layer determines sign
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown movement type: {movement_type}"
            )
    
    def get_product_stock(self, product_id: int) -> dict:
        """Get current stock balance for product"""
        result = self.db.execute(
            select(Product, StockBalance)
            .join(StockBalance, Product.id == StockBalance.product_id)
            .where(Product.id == product_id)
        ).first()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found"
            )
        
        product, stock_balance = result
        return {
            "product_id": product.id,
            "name": product.name,
            "sku": product.sku,
            "product_type": product.product_type.value,
            "on_hand": stock_balance.on_hand,
            "unit": product.unit,
            "is_low_stock": stock_balance.on_hand <= LOW_STOCK_THRESHOLD,
            "last_updated": stock_balance.last_updated
        }
    
    def get_movement_history(
        self, 
        product_id: Optional[int] = None, 
        limit: int = 100
    ) -> List[dict]:
        """Get movement history with optional product filter"""
        query = select(StockMovement, Product).join(Product)
        
        if product_id:
            query = query.where(StockMovement.product_id == product_id)
        
        query = query.order_by(StockMovement.performed_at.desc()).limit(limit)
        
        results = self.db.execute(query).all()
        
        return [
            {
                "id": movement.id,
                "product_id": movement.product_id,
                "product_name": product.name,
                "sku": product.sku,
                "movement_type": movement.movement_type.value,
                "quantity": movement.quantity,
                "balance_after": movement.balance_after,
                "performed_by": movement.performed_by,
                "performed_at": movement.performed_at,
                "note": movement.note
            }
            for movement, product in results
        ]
    
    def get_low_stock_products(self) -> List[dict]:
        """Get products with stock below threshold"""
        results = self.db.execute(
            select(Product, StockBalance)
            .join(StockBalance)
            .where(StockBalance.on_hand <= LOW_STOCK_THRESHOLD)
            .order_by(StockBalance.on_hand.asc())
        ).all()
        
        return [
            {
                "product_id": product.id,
                "name": product.name,
                "sku": product.sku,
                "product_type": product.product_type.value,
                "on_hand": stock_balance.on_hand,
                "unit": product.unit,
                "threshold": LOW_STOCK_THRESHOLD
            }
            for product, stock_balance in results
        ]
    
    def get_stock_balance(self, product_id: int) -> StockBalance:
        """Get current stock balance for product"""
        return self.db.execute(
            select(StockBalance)
            .options(joinedload(StockBalance.product))
            .where(StockBalance.product_id == product_id)
        ).scalar_one_or_none()
    
    def is_low_stock(self, balance: StockBalance) -> bool:
        """Check if product is below low stock threshold"""
        return balance.on_hand <= self.low_stock_threshold
    
    def get_movement_history(self, product_id: int, limit: int = 50, offset: int = 0):
        """Get movement history with pagination"""
        # Get total count
        total_query = select(func.count(StockMovement.id)).where(
            StockMovement.product_id == product_id
        )
        total = self.db.execute(total_query).scalar()
        
        # Get movements
        query = (
            select(StockMovement)
            .options(joinedload(StockMovement.product))
            .where(StockMovement.product_id == product_id)
            .order_by(StockMovement.performed_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        movements = self.db.execute(query).scalars().all()
        return movements, total
    
    def list_products(self, product_type=None, category=None, limit=100, offset=0):
        """List products with optional filters"""
        query = select(Product).order_by(Product.created_at.desc())
        
        if product_type:
            query = query.where(Product.product_type == product_type)
        if category:
            query = query.where(Product.category == category)
            
        query = query.offset(offset).limit(limit)
        return self.db.execute(query).scalars().all()