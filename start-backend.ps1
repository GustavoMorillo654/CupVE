Write-Host "Iniciando backend de CupVE (FastAPI en http://localhost:8000)..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
& ".\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 127.0.0.1 --port 8000
