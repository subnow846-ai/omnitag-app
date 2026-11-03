@echo off
title OmniTag Native App Launcher
cd /d "%~dp0"

:: Start the local server in the background
start /b powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0server.ps1" -Port 8080 -NoBrowser

:: Wait 2 seconds for server to bind port
timeout /t 2 /nobreak >nul

:: Launch Edge in standalone desktop app window mode
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8080/" --window-size=1280,820
