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


# Request Schemas
class CreateProductRequest(BaseModel):
    """Create product request"""
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    product_type: ProductTypeSchema
    category: Optional[str] = Field(None, max_length=100)
    unit: str = Field("pcs", max_length=50)
    cost: float = Field(..., ge=0)
    price: Optional[float] = Field(None, ge=0)
    
    @validator('cost')
    def validate_material_cost(cls, v, values):
        """Validate material cost >= 1 THB"""
        if values.get('product_type') == ProductTypeSchema.MATERIAL and v < 1.0:
            raise ValueError('Material cost must be >= 1.00 THB')
        return v


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