"""
Phase 13B: Inventory Core Engine Models
Database schema for transactional stock management
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, Text, ForeignKey, Index, CheckConstraint, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class ProductType(enum.Enum):
    """Product type enumeration"""
    PRODUCT = "PRODUCT"          # Finished goods for sale (real stock)
    MATERIAL = "MATERIAL"        # Raw materials (real stock, cost >= 1 THB)
    CONSUMABLE = "CONSUMABLE"    # Consumables (approximate stock, batch consume)


class MovementType(enum.Enum):
    """Stock movement type enumeration"""
    RECEIVE = "RECEIVE"      # Incoming stock
    ISSUE = "ISSUE"          # Outgoing stock for production/sale
    CONSUME = "CONSUME"      # Consumption (consumables only)
    ADJUST = "ADJUST"        # Manual adjustment (owner only)


class UserRole(enum.Enum):
    """User role enumeration for authorization"""
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    STAFF = "STAFF"


class WorkOrderStatus(enum.Enum):
    """Work Order status enumeration"""
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class ZoneType(enum.Enum):
    """Standard zone types for warehouse management"""
    RECEIVING = "RECEIVING"      # Incoming goods waiting processing
    QC_HOLD = "QC_HOLD"          # Quality control hold area
    STORAGE = "STORAGE"          # Main storage area
    PICK = "PICK"                # Picking area for outbound
    DISPATCH = "DISPATCH"        # Ready to ship area
    SCRAP = "SCRAP"              # Damaged/unusable items


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STAFF)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_role", "role"),
    )


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
    base_unit = Column(String(50), nullable=False, default="PCS")
    
    # Cost enforcement: Materials must have cost >= 1 THB
    cost = Column(Float, nullable=False)
    cost_per_base_unit = Column(Float, nullable=False, default=0.0)
    price = Column(Float, nullable=True)  # Null for non-sellable items
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100), nullable=False)  # user_id who created
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "product_type != 'MATERIAL' OR cost >= 1.0",
            name="material_min_cost_constraint"
        ),
        Index("idx_products_type_category", "product_type", "category"),
    )
    
    # Relationships
    stock_balance = relationship("StockBalance", back_populates="product", uselist=False)
    movements = relationship("StockMovement", back_populates="product")


class StockBalance(Base):
    """
    Current stock balances (one record per product per zone)
    Source of truth for on_hand quantities by location
    """
    __tablename__ = "stock_balances"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)  # Nullable for backward compatibility
    on_hand = Column(Float, nullable=False, default=0.0)
    
    # Metadata
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_movement_id = Column(Integer, ForeignKey("stock_movements.id"), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("on_hand >= 0", name="non_negative_stock"),
        Index("idx_stock_balances_product", "product_id"),
        Index("idx_stock_balances_zone", "zone_id"),
        # Unique product per zone (when zone_id is not null)
        Index("idx_stock_balances_product_zone", "product_id", "zone_id", unique=True),
    )
    
    # Relationships
    product = relationship("Product", back_populates="stock_balance")
    zone = relationship("Zone", back_populates="stock_balances")
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
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)  # Required for CONSUME movements
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)  # Zone where stock is after movement
    
    # Cost allocation fields
    cost_center = Column(String(50), nullable=True)  # Required for ISSUE, copied from WO for CONSUME
    cost_element = Column(String(50), nullable=True)  # Required for ISSUE, copied from WO for CONSUME
    ref_type = Column(String(20), nullable=True)  # WORK_ORDER, COST_CENTER, NULL
    
    # Unit conversion fields
    qty_input = Column(Float, nullable=False)  # Quantity as entered by user
    unit_input = Column(String(50), nullable=False)  # Unit as entered by user
    multiplier_to_base = Column(Float, nullable=False, default=1.0)  # Conversion multiplier
    qty_base = Column(Float, nullable=False)  # Quantity in base unit
    unit_cost_input = Column(Float, nullable=True)  # Cost per input unit (RECEIVE only)
    unit_cost_base = Column(Float, nullable=True)  # Cost per base unit
    value_total = Column(Float, nullable=False, default=0.0)  # Total transaction value
    
    # Quantity (positive for RECEIVE, negative for ISSUE/CONSUME/ADJUST-decrease)
    quantity = Column(Float, nullable=False)
    
    # Balance after this movement (snapshot for audit)
    balance_after = Column(Float, nullable=False)
    
    # Audit trail
    performed_by = Column(String(100), nullable=False)  # user_id
    performed_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text, nullable=True)
    
    # Reversal tracking (immutable audit trail)
    reversal_of_id = Column(Integer, ForeignKey("stock_movements.id"), nullable=True)
    reversed_at = Column(DateTime(timezone=True), nullable=True)
    reversed_by = Column(String(100), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("quantity != 0", name="non_zero_movement"),
        Index("idx_movements_product_date", "product_id", "performed_at"),
        Index("idx_movements_type_date", "movement_type", "performed_at"),
        Index("idx_movements_user", "performed_by"),
        Index("idx_movements_reversal", "reversal_of_id"),
        Index("idx_movements_zone", "zone_id"),
    )
    
    # Relationships
    product = relationship("Product", back_populates="movements")
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id])
    zone = relationship("Zone")


class WorkOrder(Base):
    """Work Order model for manufacturing/service orders"""
    __tablename__ = "work_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    wo_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(WorkOrderStatus), nullable=False, default=WorkOrderStatus.OPEN)
    cost_center = Column(String(50), nullable=False)
    cost_element = Column(String(50), nullable=True)  # Legacy field, nullable for new Cost Allocation Rules
    created_by = Column(String(100), nullable=False)  # user_id
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_wo_number", "wo_number"),
        Index("idx_wo_status", "status"),
        Index("idx_wo_created_at", "created_at"),
        Index("idx_wo_cost_center", "cost_center"),
    )
    
    # Relationships
    stock_movements = relationship("StockMovement", foreign_keys="StockMovement.work_order_id", overlaps="work_order")


class CostCenter(Base):
    """Cost Center master data for cost allocation"""
    __tablename__ = "cost_centers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_cost_centers_code", "code"),
        Index("idx_cost_centers_active", "is_active"),
    )


class CostElement(Base):
    """Cost Element master data for cost allocation"""
    __tablename__ = "cost_elements"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_cost_elements_code", "code"),
        Index("idx_cost_elements_active", "is_active"),
    )


class Warehouse(Base):
    """Warehouse master for multi-warehouse support"""
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    warehouse_type = Column(String(20), nullable=False, default="MAIN")  # MAIN, SITE, TEMPORARY
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    zones = relationship("Zone", back_populates="warehouse", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_warehouses_code", "code"),
        Index("idx_warehouses_active", "is_active"),
        Index("idx_warehouses_type", "warehouse_type"),
    )


class Zone(Base):
    """Zone master for standardized warehouse zones"""
    __tablename__ = "zones"
    
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    zone_type = Column(Enum(ZoneType), nullable=False)
    name = Column(String(255), nullable=False)  # Display name (e.g., "Receiving Bay A")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    warehouse = relationship("Warehouse", back_populates="zones")
    stock_balances = relationship("StockBalance", back_populates="zone")
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_zones_warehouse", "warehouse_id"),
        Index("idx_zones_type", "zone_type"),
        Index("idx_zones_active", "is_active"),
        # Unique zone type per warehouse (only one RECEIVING per warehouse, etc.)
        Index("idx_zones_warehouse_type", "warehouse_id", "zone_type", unique=True),
    )