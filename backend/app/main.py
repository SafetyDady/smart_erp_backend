import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.inventory import router as inventory_router
from .api.auth import router as auth_router
from .api.stock import router as stock_router
from .api.work_orders import router as work_orders_router
from .api.master_data import router as master_data_router
from .api.warehouse import router as warehouse_router
from .database import Base, engine

app = FastAPI(
    title="Smart ERP Backend", 
    version="1.0.0",
    description="Phase 13B: Inventory Management System"
)

# 🔒 Production-safe CORS
allowed_origins = [
    "http://localhost:3000",  # Local dev (Next.js)
    "http://localhost:5173",  # Local dev (Vite)
    "http://localhost:5174",  # Local dev (Vite alternative port)
    "http://localhost:5175",  # Local dev (Vite alternative port)
    "http://127.0.0.1:3000",  # Local dev (Next.js)
    "http://127.0.0.1:5173",  # Local dev (Vite)
    "http://127.0.0.1:5174",  # Local dev (Vite alternative port)
    "http://127.0.0.1:5175",  # Local dev (Vite alternative port)
    "https://*.vercel.app",   # Vercel deployments
    # Add your specific Vercel domain here:
    # "https://your-frontend.vercel.app",
]

# Use wildcard only in development
if os.getenv("RAILWAY_ENVIRONMENT") != "production":
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory_router)
app.include_router(auth_router)
app.include_router(stock_router)
app.include_router(work_orders_router)
app.include_router(master_data_router)
app.include_router(warehouse_router)

@app.get("/")
def root():
    return {
        "message": "Smart ERP Backend API - Phase 13B",
        "status": "online",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
        "features": ["inventory_management", "role_based_auth", "transactional_movements"]
    }

@app.get("/health")
def health():
    return {"status": "ok", "phase": "13B"}

# Lifecycle event to create tables
@app.on_event("startup")
async def startup():
    """Create database tables on startup"""
    if os.getenv("ENVIRONMENT") != "production":
        Base.metadata.create_all(bind=engine)