import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Smart ERP Backend", version="1.0.0")

# 🔒 Production-safe CORS
allowed_origins = [
    "http://localhost:3000",  # Local dev (Next.js)
    "http://localhost:5173",  # Local dev (Vite)
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
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Smart ERP Backend API",
        "status": "online",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development")
    }

@app.get("/health")
def health():
    return {"status": "ok"}