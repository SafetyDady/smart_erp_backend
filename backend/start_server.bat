@echo off
REM Phase 13B Backend Server Launcher
cd /d "c:\web_project\smart_erp\backend"
echo Starting Smart ERP Backend (Phase 13B)...
echo.

REM Set Python path
set PYTHONPATH=.

REM Load environment variables
if exist .env (
    echo Loading environment from .env file...
)

REM Start the server
echo Server starting at http://localhost:8001
echo API Documentation: http://localhost:8001/docs
echo.
python -m uvicorn app.main:app --reload --port 8001 --host 0.0.0.0

pause