@echo off
title OmniTag Mobile Simulator Launcher
cd /d "%~dp0"

:: Start the background server if not already running
powershell -Command "if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 8080 -InformationLevel Quiet)) { Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File ""%~dp0server.ps1"" -NoBrowser' }"

:: Small wait for server readiness
timeout /t 1 /nobreak >nul

:: Launch in smartphone viewport dimensions (412x890)
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8080/mobile.html" --window-size=430,900
