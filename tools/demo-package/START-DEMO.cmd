@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [QXFRAME9A7C2] Node.js not found.
  echo You can also try opening docs\index.html directly in your browser.
  pause
  exit /b 1
)
node demo-server.mjs --open
