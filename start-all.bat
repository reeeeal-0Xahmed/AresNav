@echo off
set BACKEND_DIR=%~dp0all done\laravel
set FRONTEND_DIR=%~dp0mars-frontend-brief\frontend

if not exist "%BACKEND_DIR%\artisan" (
  echo Backend not found: %BACKEND_DIR%
  pause & exit /b 1
)
if not exist "%FRONTEND_DIR%\package.json" (
  echo Frontend not found: %FRONTEND_DIR%
  pause & exit /b 1
)

start "AresNav Backend :8001" cmd /k "cd /d "%BACKEND_DIR%" && php artisan serve --host=127.0.0.1 --port=8001"

start "AresNav Frontend :5173" cmd /k "cd /d "%FRONTEND_DIR%" && set VITE_BACKEND_URL=http://127.0.0.1:8001&& set VITE_USE_MOCK=false&& (if not exist node_modules\.bin\vite.cmd npm.cmd install) && npm.cmd run dev"

timeout /t 8 >nul
start http://localhost:5173

