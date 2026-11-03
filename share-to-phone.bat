@echo off
title OmniTag Instant Phone Sharing
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0share-to-phone.ps1"
pause
