"""
Phase 13B: API Schemas
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProductTypeSchema(str, Enum):
    """Product type for API"""
    PRODUCT = "product"
    MATERIAL = "material"
    CONSUMABLE = "consumable"


class MovementTypeSchema(str, Enum):
    """Movement type for API"""
    RECEIVE = "RECEIVE"
    ISSUE = "ISSUE"
    CONSUME = "CONSUME"
    ADJUST = "ADJUST"


class WorkOrderStatusSchema(str, Enum):
    """Work Order status for API"""
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"


# Request Schemas
class CreateProductRequest(BaseModel):
    """Create product request"""
    name: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    product_type: ProductTypeSchema
    category: Optional[str] = Field(None, max_length=100)
    unit: str = Field("pcs", max_length=50)
    cost: float = Field(..., ge=0)
    price: Optional[float] = Field(None, ge=0)
    
    @validator('cost')
    def validate_cost(cls, v, values):
        """Validate cost >= 1 THB for all product types"""
        if v < 1.0:
            raise ValueError('Cost must be >= 1.00 THB')
        return v


class UpdateProductRequest(BaseModel):
    """Update product request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100) 
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    price: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None)


class ExecuteMovementRequest(BaseModel):
    """Execute movement request"""
    product_id: int = Field(..., gt=0)
    movement_type: MovementTypeSchema
    quantity: float = Field(..., gt=0)
    note: Optional[str] = Field(None, max_length=500)
    
    # Special handling for ADJUST which can be negative
    @validator('quantity')
    def validate_adjust_quantity(cls, v, values):
        """Allow negative quantities only for ADJUST"""
        movement_type = values.get('movement_type')
        if movement_type != MovementTypeSchema.ADJUST and v <= 0:
            raise ValueError('Quantity must be positive for non-ADJUST movements')
        return v


class AdjustStockRequest(BaseModel):
    """Stock adjustment request (can be positive or negative)"""
    product_id: int = Field(..., gt=0)
    adjustment: float = Field(..., ne=0)  # Cannot be zero
    note: Optional[str] = Field(None, max_length=500)


# Response Schemas
class ProductResponse(BaseModel):
    """Product response"""
    id: int
    name: str
    sku: str
    product_type: str
    category: Optional[str]
    unit: str
    cost: float
    price: Optional[float]
    created_at: datetime
    created_by: str
    
    class Config:
        from_attributes = True


class StockBalanceResponse(BaseModel):
    """Stock balance response"""
    product_id: int
    name: str
    sku: str
    product_type: str
    on_hand: float
    unit: str
    is_low_stock: bool
    last_updated: datetime


class MovementResponse(BaseModel):
    """Movement response"""
    id: int
    product_id: int
    product_name: str
    sku: str
    movement_type: str
    quantity: float
    balance_after: float
    performed_by: str
    performed_at: datetime
    note: Optional[str]


class LowStockItem(BaseModel):
    """Low stock item"""
    product_id: int
    name: str
    sku: str
    product_type: str
    on_hand: float
    unit: str
    threshold: int


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    error_code: Optional[str] = None


# Bulk Response Schemas
class MovementHistoryResponse(BaseModel):
    """Movement history response"""
    movements: List[MovementResponse]
    total_count: int


class LowStockResponse(BaseModel):
    """Low stock response"""
    low_stock_products: List[LowStockItem]
    threshold: int
    total_count: int


# Authentication Schemas
class UserRoleSchema(str, Enum):
    """User role for API"""
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response"""
    id: int
    email: str
    full_name: str
    role: UserRoleSchema
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data"""
    email: Optional[str] = None


class UserCreate(BaseModel):
    """Create user request"""
    email: EmailStr
    full_name: str
    password: str
    role: UserRoleSchema = UserRoleSchema.STAFF


class StockMovementRequest(BaseModel):
    """Stock movement request"""
    product_id: int = Field(..., gt=0)
    movement_type: MovementTypeSchema
    qty_input: float = Field(..., gt=0)
    unit_input: str = Field(..., min_length=1, max_length=50)
    unit_cost_input: Optional[float] = Field(None, gt=0)
    note: Optional[str] = Field(None, max_length=1000)
    
    @validator('unit_input')
    def validate_unit_input(cls, v):
        """Validate unit input is supported"""
        valid_units = ['PCS', 'DOZEN']
        if v.upper() not in valid_units:
            raise ValueError(f'Unit must be one of: {valid_units}')
        return v.upper()
    
    @validator('unit_cost_input')
    def validate_unit_cost_for_receive(cls, v, values):
        """Validate unit_cost_input required for RECEIVE"""
        if 'movement_type' in values:
            if values['movement_type'] == MovementTypeSchema.RECEIVE and v is None:
                raise ValueError('unit_cost_input is required for RECEIVE movements')
            if values['movement_type'] in [MovementTypeSchema.ISSUE, MovementTypeSchema.CONSUME] and v is not None:
                raise ValueError('unit_cost_input not allowed for ISSUE/CONSUME movements')
        return v


class StockMovementResponse(BaseModel):
    """Stock movement response"""
    id: int
    product_id: int
    movement_type: MovementTypeSchema
    qty_input: float
    unit_input: str
    multiplier_to_base: float
    qty_base: float
    unit_cost_input: Optional[float]
    unit_cost_base: Optional[float]
    value_total: Optional[float]
    quantity: float
    balance_after: float
    performed_by: str
    performed_at: datetime
    created_at: datetime
    note: Optional[str]
    
    # Reversal tracking
    reversal_of_id: Optional[int]
    reversed_at: Optional[datetime]
    reversed_by: Optional[str]
    
    class Config:
        from_attributes = True


# Work Order Schemas
class CreateWorkOrderRequest(BaseModel):
    """Create work order request"""
    wo_number: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: WorkOrderStatusSchema = WorkOrderStatusSchema.OPEN
    cost_center: str = Field(..., min_length=1, max_length=50)
    cost_element: str = Field(..., min_length=1, max_length=50)


class UpdateWorkOrderRequest(BaseModel):
    """Update work order request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[WorkOrderStatusSchema] = None
    cost_center: Optional[str] = Field(None, min_length=1, max_length=50)
    cost_element: Optional[str] = Field(None, min_length=1, max_length=50)


class WorkOrderResponse(BaseModel):
    """Work order response"""
    id: int
    wo_number: str
    title: str
    description: Optional[str]
    status: WorkOrderStatusSchema
    cost_center: str
    cost_element: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class WorkOrderListResponse(BaseModel):
    """Work order list response"""
    id: int
    wo_number: str
    title: str
    status: WorkOrderStatusSchema
    cost_center: str
    cost_element: str
    created_at: datetime
    
    class Config:
        from_attributes = True