# Phase 13B Backend Server Launcher
Set-Location "c:\web_project\smart_erp\backend"
Write-Host "Starting Smart ERP Backend (Phase 13B)..." -ForegroundColor Green

# Set Python path
$env:PYTHONPATH = "."

# Load environment variables
if (Test-Path ".env") {
    Write-Host "Loading environment from .env file..." -ForegroundColor Yellow
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            Set-Item -Path "env:$($matches[1])" -Value $matches[2]
        }
    }
}

Write-Host "Server starting at http://localhost:8001" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host ""

# Start the server
python -m uvicorn app.main:app --reload --port 8001 --host 0.0.0.0