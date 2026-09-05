$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Write-Host "Iniciando frontend de CupVE (Vue 3 + Vite en http://localhost:5173)..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
