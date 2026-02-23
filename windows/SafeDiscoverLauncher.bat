@echo off
setlocal
TITLE SafeDiscover Defender Suite

REM Starts a local web host for the SafeDiscover UI and opens Microsoft Edge.
cd /d %~dp0\..
where python >nul 2>nul
if %errorlevel% neq 0 (
  echo Python is required to launch this application.
  pause
  exit /b 1
)

start "SafeDiscover Server" cmd /c "python -m http.server 8181"
timeout /t 2 >nul
start msedge http://localhost:8181

echo SafeDiscover launched at http://localhost:8181
