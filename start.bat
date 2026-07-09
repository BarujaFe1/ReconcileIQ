@echo off
setlocal
cd /d "%~dp0"

echo [ReconcileIQ] Starting API and Web...

if not exist "apps\api\.venv" (
  echo Creating Python venv...
  python -m venv "apps\api\.venv"
)

call "apps\api\.venv\Scripts\activate.bat"
pip install -r "apps\api\requirements.txt" -q

start "ReconcileIQ API" cmd /k "cd /d %~dp0apps\api && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

pushd "apps\web"
if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
)
start "ReconcileIQ Web" cmd /k "cd /d %~dp0apps\web && npm run dev"
popd

timeout /t 4 >nul
start "" "http://localhost:3000"
echo Done. API :8000 ^| Web :3000
endlocal
