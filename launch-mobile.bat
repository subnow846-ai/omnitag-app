@echo off
title OmniTag Mobile Simulator Launcher
cd /d "%~dp0"

:: Start the local server in the background
start /b powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0server.ps1" -Port 8080 -NoBrowser

:: Wait 2 seconds for server to bind port
timeout /t 2 /nobreak >nul

:: Launch in smartphone viewport dimensions (430x900)
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8080/mobile.html" --window-size=430,900
