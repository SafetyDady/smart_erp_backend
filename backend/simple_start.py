#!/usr/bin/env python3
"""
Simple backend server starter
"""
import os
import sys

# Get the directory this script is in
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")

# Change to script directory
os.chdir(script_dir)
print(f"Changed to: {os.getcwd()}")

# Add to Python path
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Import and test
try:
    from app.main import app
    print("✅ Successfully imported app")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Start server
import uvicorn
print("🚀 Starting server on http://127.0.0.1:8001")
print("🔑 Demo users:")
print("   demo@example.com / demo123")
print("   manager@example.com / manager123") 
print("   staff@example.com / staff123")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=False)