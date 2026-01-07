"""
Phase 13B: Inventory Core Engine Models
Database schema for transactional stock management
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, Text, ForeignKey, Index, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class ProductType(enum.Enum):
    """Product type enumeration"""
    PRODUCT = "product"          # Finished goods for sale (real stock)
    MATERIAL = "material"        # Raw materials (real stock, cost >= 1 THB)
    CONSUMABLE = "consumable"    # Consumables (approximate stock, batch consume)


class MovementType(enum.Enum):
    """Stock movement type enumeration"""
    RECEIVE = "RECEIVE"      # Incoming stock
    ISSUE = "ISSUE"          # Outgoing stock for production/sale
    CONSUME = "CONSUME"      # Consumption (consumables only)
    ADJUST = "ADJUST"        # Manual adjustment (owner only)


class UserRole(enum.Enum):
    """User role enumeration for authorization"""
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"


class Product(Base):
    """
    Product master data (immutable stock info)
    NO on_hand here - stock data lives in stock_balances
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    product_type = Column(Enum(ProductType), nullable=False)
    category = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=False, default="pcs")
    
    # Cost enforcement: Materials must have cost >= 1 THB
    cost = Column(Float, nullable=False)
    price = Column(Float, nullable=True)  # Null for non-sellable items
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100), nullable=False)  # user_id who created
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "product_type != 'material' OR cost >= 1.0",
            name="material_min_cost_constraint"
        ),
        Index("idx_products_type_category", "product_type", "category"),
    )
    
    # Relationships
    stock_balance = relationship("StockBalance", back_populates="product", uselist=False)
    movements = relationship("StockMovement", back_populates="product")


class StockBalance(Base):
    """
    Current stock balances (one record per product)
    Source of truth for on_hand quantities
    """
    __tablename__ = "stock_balances"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    on_hand = Column(Float, nullable=False, default=0.0)
    
    # Metadata
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_movement_id = Column(Integer, ForeignKey("stock_movements.id"), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("on_hand >= 0", name="non_negative_stock"),
        Index("idx_stock_balances_product", "product_id"),
    )
    
    # Relationships
    product = relationship("Product", back_populates="stock_balance")
    last_movement = relationship("StockMovement", foreign_keys=[last_movement_id])


class StockMovement(Base):
    """
    Immutable audit trail of all stock movements
    Every movement creates a record here + updates stock_balances
    """
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    
    # Quantity (positive for RECEIVE, negative for ISSUE/CONSUME/ADJUST-decrease)
    quantity = Column(Float, nullable=False)
    
    # Balance after this movement (snapshot for audit)
    balance_after = Column(Float, nullable=False)
    
    # Audit trail
    performed_by = Column(String(100), nullable=False)  # user_id
    performed_at = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text, nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("quantity != 0", name="non_zero_movement"),
        Index("idx_movements_product_date", "product_id", "performed_at"),
        Index("idx_movements_type_date", "movement_type", "performed_at"),
        Index("idx_movements_user", "performed_by"),
    )
    
    # Relationships
    product = relationship("Product", back_populates="movements")