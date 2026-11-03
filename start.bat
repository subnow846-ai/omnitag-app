@echo off
title OmniTag Search App Launcher
cd /d "%~dp0"
echo Starting OmniTag Search Server...
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1"
pause
