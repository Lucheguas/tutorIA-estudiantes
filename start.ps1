# TutorIA - Start dev environment
Write-Host "Starting TutorIA..." -ForegroundColor Cyan

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal

Start-Sleep 2

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Remember to set ANTHROPIC_API_KEY in backend/.env" -ForegroundColor Yellow
