"""
Startup script for backend server
"""
import sys
import os

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Now import and run
if __name__ == "__main__":
    import uvicorn
    from app.main import app
    
    print("🚀 Starting Smart ERP Backend Server...")
    print(f"📁 Working directory: {current_dir}")
    print("🌐 Server will be available at: http://127.0.0.1:8001")
    print("🔑 Demo credentials:")
    print("   Owner: demo@example.com / demo123")
    print("   Manager: manager@example.com / manager123") 
    print("   Staff: staff@example.com / staff123")
    print("-" * 50)
    
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)